import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useEditorPlano } from '../hooks/useEditorPlano'
import { getProyecto } from '../api/proyectos'

import { SeleccionMetodo } from '../modules/editor-planos/SeleccionMetodo'
import { SubidaPlanoIA } from '../modules/editor-planos/SubidaPlanoIA'
import { EditorWorkspace } from '../modules/editor-planos/EditorWorkspace'

export function EditorPage() {
  const params = useParams()
  const proyectoId = params?.id
  const navigate = useNavigate()

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark])

  const {
    planoData,
    datosVectoriales,
    hasVectorData,
    isLoading,
    isProcessingIA,
    error,
    setDatosVectorialesLocal,
    saveDatosVectoriales,
    procesarIA,
    addElemento,
    clearPlano,
  } = useEditorPlano(proyectoId)

  const [mode, setMode] = useState('auto') // auto | ia | manual
  const [saving, setSaving] = useState(false)

  const [proyecto, setProyecto] = useState(null)

  useEffect(() => {
    let alive = true
    async function run() {
      if (!planoData?.proyecto) return
      try {
        const p = await getProyecto(planoData.proyecto)
        if (!alive) return
        setProyecto(p)
      } catch {
        if (!alive) return
        setProyecto(null)
      }
    }
    run()
    return () => {
      alive = false
    }
  }, [planoData?.proyecto])

  const showEmpty = useMemo(() => {
    if (isLoading) return false
    if (hasVectorData) return false
    // si el usuario eligió manual, entra aunque esté vacío
    if (mode === 'manual') return false
    return true
  }, [hasVectorData, isLoading, mode])

  const showIAUpload = useMemo(() => !hasVectorData && mode === 'ia', [hasVectorData, mode])

  const enterManual = async () => {
    setMode('manual')
    if (!Array.isArray(datosVectoriales) || datosVectoriales.length === 0) {
      setDatosVectorialesLocal([])
    }
  }

  const onSave = async () => {
    setSaving(true)
    try {
      await saveDatosVectoriales()
    } finally {
      setSaving(false)
    }
  }

  const onClear = async () => {
    setSaving(true)
    try {
      await clearPlano()
      setMode('auto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white dark:bg-[#0F172A]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center text-slate-200">
          Cargando editor…
        </div>
      ) : error ? (
        <div className="w-full h-full flex items-center justify-center p-6">
          <div className="max-w-xl w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-6">
            <div className="text-lg font-semibold text-white">No se pudo abrir el editor</div>
            <div className="mt-2 text-sm text-slate-300">{error}</div>
            <div className="mt-4 text-xs text-slate-400">
              Tip: si ves 401, vuelve a iniciar sesión.
            </div>
          </div>
        </div>
      ) : showEmpty ? (
        <SeleccionMetodo onIA={() => setMode('ia')} onManual={enterManual} />
      ) : showIAUpload ? (
        <SubidaPlanoIA
          isProcessing={isProcessingIA}
          onUpload={async (file) => {
            await procesarIA(file)
            setMode('auto')
          }}
        />
      ) : (
        <EditorWorkspace
          datosVectoriales={Array.isArray(datosVectoriales) ? datosVectoriales : []}
          onChange={setDatosVectorialesLocal}
          onBack={() => navigate(-1)}
          onClear={onClear}
          onSave={onSave}
          onAdd={addElemento}
          exportTitulo={proyecto?.titulo || planoData?.nombre || `Plano #${planoData?.id}` || 'Casa'}
          exportSubtitulo={planoData ? `Plano #${planoData.id} — Proyecto ${planoData.proyecto}` : ''}
          exportUbicacion={planoData?.nombre || ''}
          exportDescripcion={proyecto?.descripcion || ''}
          saving={saving}
          isDark={isDark}
          onToggleTheme={() => setIsDark((v) => !v)}
        />
      )}

      {!isLoading && planoData ? (
        <div className="absolute bottom-3 left-3 text-xs text-slate-400">
          Plano #{planoData.id} — Proyecto {planoData.proyecto}
        </div>
      ) : null}
    </div>
  )
}
