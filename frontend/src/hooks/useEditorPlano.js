import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  getPlano,
  procesarPlanoIA,
  updateDatosVectoriales,
} from '../api/planos'

function isEmptyVectorData(data) {
  if (!data) return true
  if (Array.isArray(data)) return data.length === 0
  if (typeof data === 'object') return Object.keys(data).length === 0
  return false
}

function toErrorMessage(err) {
  const status = err?.response?.status
  const data = err?.response?.data

  if (data) {
    // DRF típico: { detail: "..." }
    if (typeof data === 'object' && !Array.isArray(data)) {
      const detail = data?.detail
      if (detail) return status ? `HTTP ${status}: ${detail}` : String(detail)
      try {
        return status ? `HTTP ${status}: ${JSON.stringify(data)}` : JSON.stringify(data)
      } catch {
        // ignore
      }
    }

    // A veces el backend devuelve HTML/texto (debug page o error proxy)
    if (typeof data === 'string') {
      const s = data.trim()
      // Intento parsear JSON si vino como string
      if (s.startsWith('{') || s.startsWith('[')) {
        try {
          const parsed = JSON.parse(s)
          const detail = parsed?.detail
          if (detail) return status ? `HTTP ${status}: ${detail}` : String(detail)
          return status ? `HTTP ${status}: ${s.slice(0, 240)}` : s.slice(0, 240)
        } catch {
          // ignore
        }
      }
      const preview = s.replace(/\s+/g, ' ').slice(0, 240)
      return status ? `HTTP ${status}: ${preview}` : preview
    }
  }

  return err?.message || 'Ocurrió un error inesperado'
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

function findFreeSpotForWall(existing, candidate) {
  const others = existing.filter((s) => s?.tipo === 'muro')
  if (!others.length) return candidate

  const maxTries = 40
  let next = { ...candidate }
  for (let i = 0; i < maxTries; i++) {
    const overlaps = others.some((s) =>
      rectsOverlap(
        { x: next.x, y: next.y, width: next.width, height: next.height },
        {
          x: Number(s.x) || 0,
          y: Number(s.y) || 0,
          width: Number(s.width) || 0,
          height: Number(s.height) || 0,
        },
      ),
    )
    if (!overlaps) return next
    next = { ...next, y: next.y + next.height + 10 }
  }
  return next
}

export function useEditorPlano(proyectoId) {
  const [planoData, setPlanoData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingIA, setIsProcessingIA] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true

    async function run() {
      if (!proyectoId) return
      setIsLoading(true)
      setError('')
      try {
        const plano = await getPlano(proyectoId)
        if (!alive) return
        setPlanoData(plano)
      } catch (e) {
        if (!alive) return
        setError(String(toErrorMessage(e)))
      } finally {
        if (!alive) return
        setIsLoading(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [proyectoId])

  const datosVectoriales = planoData?.datos_vectoriales

  const setDatosVectorialesLocal = useCallback((json) => {
    setPlanoData((prev) => (prev ? { ...prev, datos_vectoriales: json } : prev))
  }, [])

  const saveDatosVectoriales = useCallback(async () => {
    if (!planoData?.id) return null
    setError('')
    try {
      const updated = await updateDatosVectoriales(planoData.id, datosVectoriales)
      setPlanoData(updated)
      return updated
    } catch (e) {
      setError(String(toErrorMessage(e)))
      throw e
    }
  }, [planoData?.id, datosVectoriales])

  const handleUploadIA = useCallback(
    async (file) => {
      if (!planoData?.id) return null
      if (!file) return null
      setError('')
      setIsProcessingIA(true)
      try {
        const json = await procesarPlanoIA(planoData.id, file)
        // El backend ya guarda en BD; aquí actualizamos el estado local.
        setPlanoData((prev) => (prev ? { ...prev, datos_vectoriales: json } : prev))
        return json
      } catch (e) {
        setError(String(toErrorMessage(e)))
        throw e
      } finally {
        setIsProcessingIA(false)
      }
    },
    [planoData?.id]
  )

  const procesarIA = useCallback(async (file) => handleUploadIA(file), [handleUploadIA])

  const addElemento = useCallback(
    (tipo) => {
      const current = Array.isArray(datosVectoriales) ? datosVectoriales : []
      const idx = current.length
      const nextId = Date.now()

      const pxPorMetro = 100
      const espesoresM = {
        muro: 0.2,
        puerta: 0.15,
        ventana: 0.1,
      }
      const largosM = {
        muro: 1,
        puerta: 0.9,
        ventana: 1.2,
      }
      const espesorPx = (espesoresM[tipo] ?? 0.18) * pxPorMetro
      const largoPx = (largosM[tipo] ?? 1) * pxPorMetro

      const base = {
        id: nextId,
        tipo,
        x: 120,
        y: 120 + idx * 28,
        width: 220,
        height: 18,
      }

      const shape =
        tipo === 'muro' || tipo === 'puerta' || tipo === 'ventana'
          ? { ...base, width: largoPx, height: espesorPx }
          : { ...base, width: 280, height: 18 }

      const finalShape =
        tipo === 'muro'
          ? findFreeSpotForWall(current, {
              ...shape,
              x: Number(shape.x) || 0,
              y: Number(shape.y) || 0,
              width: Number(shape.width) || 0,
              height: Number(shape.height) || 0,
            })
          : shape

      const next = [...current, finalShape]
      setDatosVectorialesLocal(next)
      return next
    },
    [datosVectoriales, setDatosVectorialesLocal]
  )

  const clearPlano = useCallback(async () => {
    if (!planoData?.id) return null
    setError('')
    const empty = []
    setDatosVectorialesLocal(empty)
    try {
      const updated = await updateDatosVectoriales(planoData.id, empty)
      setPlanoData(updated)
      return updated
    } catch (e) {
      setError(String(toErrorMessage(e)))
      throw e
    }
  }, [planoData?.id, setDatosVectorialesLocal])

  const hasVectorData = useMemo(
    () => !isEmptyVectorData(datosVectoriales),
    [datosVectoriales]
  )

  return useMemo(
    () => ({
      planoData,
      datosVectoriales,
      hasVectorData,
      isLoading,
      isProcessingIA,
      error,
      setDatosVectorialesLocal,
      saveDatosVectoriales,
      handleUploadIA,
      procesarIA,
      addElemento,
      clearPlano,
    }),
    [
      planoData,
      datosVectoriales,
      hasVectorData,
      isLoading,
      isProcessingIA,
      error,
      setDatosVectorialesLocal,
      saveDatosVectoriales,
      handleUploadIA,
      procesarIA,
      addElemento,
      clearPlano,
    ]
  )
}
