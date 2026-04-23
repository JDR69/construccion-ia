import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Arc, Circle, Group, Layer, Line, Path, Rect, Stage, Text, Transformer } from 'react-konva'

const PX_POR_METRO = 100
const ESPESOR_M = {
  muro: 0.2,
  puerta: 0.15,
  ventana: 0.1,
}

function espesorPxPorTipo(tipo) {
  const m = ESPESOR_M[tipo]
  return Number.isFinite(m) ? m * PX_POR_METRO : null
}

function tieneEspesorFijo(tipo) {
  return tipo === 'muro' || tipo === 'puerta' || tipo === 'ventana'
}

function isTipoRect(tipo) {
  return tipo === 'muro' || tipo === 'puerta' || tipo === 'ventana'
}

// ── Paths SVG mejorados para símbolos (bounding box ~100×70) ──────────────
function symbolPathByName(nombre) {
  const key = String(nombre || '').trim().toLowerCase()

  // Cama doble: base + cabecera + dos almohadas
  if (key === 'cama') {
    return [
      'M4 14 H96 V66 H4 Z',          // base
      'M4 14 H96 V24 H4 Z',          // cabecera
      'M8 28 H44 V48 H8 Z',          // almohada izq
      'M56 28 H92 V48 H56 Z',        // almohada der
    ].join(' ')
  }

  // Inodoro: tanque rectangular + taza ovalada
  if (key === 'inodoro' || key === 'wc') {
    return [
      'M30 4 H70 V20 H30 Z',         // tanque
      'M26 20 C26 16 74 16 74 20 L74 46 C74 60 26 60 26 46 Z',  // taza
    ].join(' ')
  }

  return null
}

// ── Color por símbolo (fill + stroke) ────────────────────────────────────
function symbolColors(nombre, isDark) {
  const key = String(nombre || '').trim().toLowerCase()
  if (key === 'cama') {
    return isDark
      ? { fill: '#1E3A5F', stroke: '#38BDF8', bg: 'rgba(56,189,248,0.10)' }
      : { fill: '#DBEAFE', stroke: '#2563EB', bg: 'rgba(37,99,235,0.10)' }
  }
  if (key === 'inodoro' || key === 'wc') {
    return isDark
      ? { fill: '#1E3A3A', stroke: '#34D399', bg: 'rgba(52,211,153,0.10)' }
      : { fill: '#D1FAE5', stroke: '#059669', bg: 'rgba(5,150,105,0.10)' }
  }
  // fallback
  return isDark
    ? { fill: '#1E293B', stroke: '#94A3B8', bg: 'rgba(148,163,184,0.10)' }
    : { fill: '#F1F5F9', stroke: '#475569', bg: 'rgba(71,85,105,0.10)' }
}

function cotaTicks({ x1, y1, x2, y2, tick = 10 }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (!len) {
    return {
      a: [x1, y1, x1, y1],
      b: [x2, y2, x2, y2],
    }
  }

  // vector perpendicular normalizado
  const px = -dy / len
  const py = dx / len

  const ax1 = x1 - px * tick
  const ay1 = y1 - py * tick
  const ax2 = x1 + px * tick
  const ay2 = y1 + py * tick

  const bx1 = x2 - px * tick
  const by1 = y2 - py * tick
  const bx2 = x2 + px * tick
  const by2 = y2 + py * tick

  return {
    a: [ax1, ay1, ax2, ay2],
    b: [bx1, by1, bx2, by2],
  }
}

// Calcula el valor de la cota en metros a partir de las coordenadas en px
function calcularValorCota(x1, y1, x2, y2) {
  const distPx = Math.hypot(x2 - x1, y2 - y1)
  const metros = distPx / PX_POR_METRO
  return `${metros.toFixed(2)} m`
}

const ROTACION_SNAP_GRADOS = 45
const ROTACION_SNAPS = Array.from({ length: 360 / ROTACION_SNAP_GRADOS }, (_, i) => i * ROTACION_SNAP_GRADOS)

function normalizarGrados(grados) {
  const g = Number(grados) || 0
  const m = ((g % 360) + 360) % 360
  return m
}

function snapGrados(grados, paso = ROTACION_SNAP_GRADOS) {
  const g = normalizarGrados(grados)
  const snapped = Math.round(g / paso) * paso
  return normalizarGrados(snapped)
}

function normalizarFormas(json) {
  return Array.isArray(json) ? json : []
}

// Umbral de 4px: paredes que se tocan en esquina no se consideran conflicto
const OVERLAP_UMBRAL = 4
function rectangulosSeSolapan(a, b) {
  const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
  const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return ox > OVERLAP_UMBRAL && oy > OVERLAP_UMBRAL
}

// ── Snap magnético — usa las 4 ESQUINAS del muro (no centros de borde) ───────
const SNAP_RADIO = 20 // px
function extremosDeMuro(s) {
  const x = Number(s.x) || 0
  const y = Number(s.y) || 0
  const w = Number(s.width) || 0
  const h = Number(s.height) || 0
  // Las 4 esquinas del rectángulo — son los puntos de unión arquitectónicos
  return [
    { x: x, y: y },   // top-left
    { x: x + w, y: y },   // top-right
    { x: x, y: y + h },   // bottom-left
    { x: x + w, y: y + h },   // bottom-right
  ]
}
function calcularSnap(shapes, draggedId, candidateX, candidateY) {
  const dragged = shapes.find(s => s.id === draggedId)
  if (!dragged) return null
  const otrosMuros = shapes.filter(s => s.tipo === 'muro' && s.id !== draggedId)
  // Posición candidata del muro arrastrado
  const candidato = { ...dragged, x: candidateX, y: candidateY }
  const puntosCandidate = extremosDeMuro(candidato)
  let mejorDist = SNAP_RADIO, snapDx = 0, snapDy = 0, haySnap = false
  for (const otro of otrosMuros) {
    for (const ep of extremosDeMuro(otro)) {
      for (const cp of puntosCandidate) {
        const d = Math.hypot(cp.x - ep.x, cp.y - ep.y)
        if (d < mejorDist) {
          mejorDist = d
          // Delta para mover la posición del grupo completo
          snapDx = ep.x - cp.x
          snapDy = ep.y - cp.y
          haySnap = true
        }
      }
    }
  }
  return haySnap ? { x: candidateX + snapDx, y: candidateY + snapDy } : null
}

function clientRectDeNode(node) {
  if (!node?.getClientRect) return null
  const r = node.getClientRect({ skipTransform: false, skipStroke: true, skipShadow: true })
  return {
    x: Number(r.x) || 0,
    y: Number(r.y) || 0,
    width: Number(r.width) || 0,
    height: Number(r.height) || 0,
  }
}

function aMetros(px, pxPorMetro = PX_POR_METRO) {
  const v = Number(px) / pxPorMetro
  if (!Number.isFinite(v)) return 0
  return v
}

function descargarBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function sanitizarNombreArchivo(s) {
  const raw = String(s || '').trim() || 'plano'
  return raw
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function colorPorTipoParaExport(tipo) {
  if (tipo === 'muro') return '#0F172A'
  if (tipo === 'puerta') return '#9333EA'
  if (tipo === 'ventana') return '#0284C7'
  return '#334155'
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  const raw = String(text || '').trim()
  if (!raw) return 0
  const words = raw.split(/\s+/)
  let line = ''
  let lines = 0

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i]
    const w = ctx.measureText(testLine).width
    if (w > maxWidth && line) {
      ctx.fillText(line, x, y)
      y += lineHeight
      lines += 1
      line = words[i]
      if (maxLines && lines >= maxLines) return lines
    } else {
      line = testLine
    }
  }

  if (line) {
    ctx.fillText(line, x, y)
    lines += 1
  }
  return lines
}

function crearCanvasPlanoProfesional({ stage, shapes, titulo, subtitulo, ubicacion, descripcion }) {
  const pixelRatio = 2
  const baseCanvas = stage.toCanvas({ pixelRatio })

  const margin = Math.round(28 * pixelRatio)
  const titleH = Math.round(170 * pixelRatio)
  const w = baseCanvas.width + margin * 2
  const h = baseCanvas.height + margin * 2 + titleH

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')

  // Fondo
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)

  // Marco exterior
  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 2 * pixelRatio
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2)

  // Plano (área de dibujo)
  const planoX = margin
  const planoY = margin
  ctx.drawImage(baseCanvas, planoX, planoY)

  // Cajetín inferior
  const cajX = margin
  const cajY = margin + baseCanvas.height
  const cajW = w - margin * 2
  const cajH = titleH
  ctx.fillStyle = '#F8FAFC'
  ctx.fillRect(cajX, cajY, cajW, cajH)

  ctx.strokeStyle = '#CBD5E1'
  ctx.lineWidth = 1 * pixelRatio
  ctx.strokeRect(cajX, cajY, cajW, cajH)

  // Tipografía
  const px = cajX + Math.round(16 * pixelRatio)
  let py = cajY + Math.round(26 * pixelRatio)
  const line = Math.round(18 * pixelRatio)
  const font = (size, weight = 400) => {
    ctx.font = `${weight} ${size * pixelRatio}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
  }

  ctx.fillStyle = '#0F172A'
  font(11, 700)
  ctx.fillText(`Nombre de casa: ${String(titulo || 'Casa')}`, px, py)

  py += line
  font(10, 600)
  ctx.fillText('Ubicación:', px, py)
  font(10, 400)
  wrapText(
    ctx,
    String(ubicacion || ''),
    px + Math.round(70 * pixelRatio),
    py,
    Math.round(420 * pixelRatio),
    Math.round(16 * pixelRatio),
    2
  )

  py += line
  font(10, 600)
  ctx.fillText('Descripción:', px, py)
  font(10, 400)
  wrapText(
    ctx,
    String(descripcion || subtitulo || ''),
    px + Math.round(84 * pixelRatio),
    py,
    Math.round(420 * pixelRatio),
    Math.round(16 * pixelRatio),
    2
  )

  py += line
  font(10, 400)
  const fecha = new Date().toLocaleDateString('es-BO')
  ctx.fillText(`Fecha: ${fecha}`, px, py)

  py += line
  ctx.fillText(`Escala: 1 m = ${PX_POR_METRO} px`, px, py)

  // Bounding box
  const rects = shapes
    .filter(Boolean)
    .map((s) => ({
      x: Number(s.x) || 0,
      y: Number(s.y) || 0,
      w: Number(s.width) || 0,
      h: Number(s.height) || 0,
    }))
    .filter((r) => r.w > 0 && r.h > 0)

  if (rects.length) {
    const minX = Math.min(...rects.map((r) => r.x))
    const minY = Math.min(...rects.map((r) => r.y))
    const maxX = Math.max(...rects.map((r) => r.x + r.w))
    const maxY = Math.max(...rects.map((r) => r.y + r.h))
    const anchoM = aMetros(maxX - minX).toFixed(2)
    const altoM = aMetros(maxY - minY).toFixed(2)
    py += line
    ctx.fillText(`Tamaño aprox.: ${anchoM} m x ${altoM} m`, px, py)
  }

  // Conteo
  const counts = shapes.reduce(
    (acc, s) => {
      const t = s?.tipo || 'otro'
      acc[t] = (acc[t] || 0) + 1
      return acc
    },
    {}
  )

  // Columna derecha: leyenda + conteo
  const colX = cajX + cajW - Math.round(280 * pixelRatio)
  let colY = cajY + Math.round(26 * pixelRatio)
  font(10, 700)
  ctx.fillStyle = '#0F172A'
  ctx.fillText('Leyenda', colX, colY)
  colY += Math.round(16 * pixelRatio)

  const legend = [
    { tipo: 'muro', label: 'Muro' },
    { tipo: 'puerta', label: 'Puerta' },
    { tipo: 'ventana', label: 'Ventana' },
  ]

  legend.forEach((it) => {
    const c = colorPorTipoParaExport(it.tipo)
    ctx.fillStyle = c
    ctx.fillRect(colX, colY - Math.round(10 * pixelRatio), Math.round(14 * pixelRatio), Math.round(10 * pixelRatio))
    ctx.strokeStyle = '#0F172A'
    ctx.strokeRect(colX, colY - Math.round(10 * pixelRatio), Math.round(14 * pixelRatio), Math.round(10 * pixelRatio))
    ctx.fillStyle = '#0F172A'
    font(9, 500)
    ctx.fillText(it.label, colX + Math.round(20 * pixelRatio), colY)
    colY += Math.round(16 * pixelRatio)
  })

  colY += Math.round(6 * pixelRatio)
  font(10, 700)
  ctx.fillText('Elementos', colX, colY)
  colY += Math.round(16 * pixelRatio)
  font(9, 400)
  Object.entries(counts).forEach(([t, n]) => {
    ctx.fillText(`${t}: ${n}`, colX, colY)
    colY += Math.round(14 * pixelRatio)
  })

  // Barra de escala (abajo-izq)
  const barX = px
  const barY = cajY + cajH - Math.round(24 * pixelRatio)
  const segmentM = 1
  const segments = 5
  const segPx = PX_POR_METRO * pixelRatio * segmentM
  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 2 * pixelRatio
  ctx.beginPath()
  ctx.moveTo(barX, barY)
  ctx.lineTo(barX + segPx * segments, barY)
  ctx.stroke()
  for (let i = 0; i <= segments; i += 1) {
    const x = barX + segPx * i
    ctx.beginPath()
    ctx.moveTo(x, barY - Math.round(6 * pixelRatio))
    ctx.lineTo(x, barY + Math.round(6 * pixelRatio))
    ctx.stroke()
    font(8, 500)
    ctx.fillStyle = '#0F172A'
    ctx.fillText(`${i * segmentM}m`, x - Math.round(6 * pixelRatio), barY - Math.round(10 * pixelRatio))
  }

  return out
}

export const CanvasBoard = forwardRef(function CanvasBoard(
  { datosVectoriales, onChange, isDark, exportTitulo, exportSubtitulo, exportUbicacion, exportDescripcion },
  ref,
) {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const transformerRef = useRef(null)
  const shapeRefs = useRef({})
  const [size, setSize] = useState({ width: 300, height: 300 })
  const [selectedId, setSelectedId] = useState(null)

  // ── Editor de texto inline ────────────────────────────────────────────
  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingPos, setEditingPos] = useState({ x: 0, y: 0, width: 180 })
  const textareaRef = useRef(null)
  const [idEnConflicto, setIdEnConflicto] = useState(null)
  const [modoExport, setModoExport] = useState(false)
  const [snapPos, setSnapPos] = useState(null)  // { x, y } del preview de snap

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      setSize({ width: Math.max(1, cr.width), height: Math.max(1, cr.height) })
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const shapes = useMemo(() => normalizarFormas(datosVectoriales), [datosVectoriales])

  const selectedShape = useMemo(
    () => (selectedId ? shapes.find((s) => s.id === selectedId) : null),
    [selectedId, shapes]
  )

  // ── Abrir editor de texto inline ─────────────────────────────────────
  const abrirEditorTexto = useCallback((s, nodeOrPos) => {
    const stageEl = stageRef.current?.container()
    const stageRect = stageEl?.getBoundingClientRect() ?? { left: 0, top: 0 }
    let sx = 0, sy = 0
    if (nodeOrPos?.getAbsolutePosition) {
      const abs = nodeOrPos.getAbsolutePosition()
      sx = stageRect.left + abs.x
      sy = stageRect.top + abs.y
    } else {
      sx = stageRect.left + (Number(s.x) || 0)
      sy = stageRect.top + (Number(s.y) || 0)
    }
    const currentText = s.tipo === 'cota' ? (s.valor || '') : (s.texto || '')
    setEditingId(s.id)
    setEditingText(currentText)
    setEditingPos({ x: sx, y: sy, width: 180 })
    setTimeout(() => textareaRef.current?.focus(), 0)
  }, [])

  const cerrarEditorTexto = useCallback((guardar = true) => {
    if (!editingId) return
    if (guardar) {
      // Actualizamos el JSON directamente sin pasar por actualizarForma
      // (que se define más abajo) para evitar dependencia circular.
      const shape = shapes.find((ss) => ss.id === editingId)
      if (shape) {
        const patch =
          shape.tipo === 'cota' ? { valor: editingText } :
            shape.tipo === 'texto' ? { texto: editingText } :
              null
        if (patch) {
          const next = shapes.map((ss) => ss.id === editingId ? { ...ss, ...patch } : ss)
          onChange?.(next)
        }
      }
    }
    setEditingId(null)
    setEditingText('')
  }, [editingId, editingText, shapes, onChange])

  const aplicarRotacionSeleccion = (grados) => {
    if (!selectedId) return
    const rot = snapGrados(Number(grados) || 0)
    const ok = actualizarForma(selectedId, { rotation: rot })
    if (!ok) return
    const node = shapeRefs.current[selectedId]
    if (node) {
      node.rotation(rot)
      node.getLayer()?.batchDraw()
    }
  }

  const exportarJpg = async () => {
    const stage = stageRef.current
    if (!stage) return

    setModoExport(true)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const tr = transformerRef.current
    const prevVisible = tr?.visible?.() ?? true
    if (tr) {
      tr.nodes([])
      tr.visible(false)
      tr.getLayer()?.batchDraw()
    }

    const canvas = crearCanvasPlanoProfesional({
      stage,
      shapes,
      titulo: exportTitulo || 'Plano',
      subtitulo: exportSubtitulo || '',
      ubicacion: exportUbicacion || '',
      descripcion: exportDescripcion || '',
    })

    if (tr) {
      tr.visible(prevVisible)
      tr.getLayer()?.batchDraw()
    }

    setModoExport(false)

    const name = sanitizarNombreArchivo(exportTitulo || 'plano')
    await new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) descargarBlob(blob, `${name}.jpg`)
          resolve()
        },
        'image/jpeg',
        0.95,
      )
    })
  }

  const exportarPdf = async () => {
    const stage = stageRef.current
    if (!stage) return

    setModoExport(true)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

    const tr = transformerRef.current
    const prevVisible = tr?.visible?.() ?? true
    if (tr) {
      tr.nodes([])
      tr.visible(false)
      tr.getLayer()?.batchDraw()
    }

    const canvas = crearCanvasPlanoProfesional({
      stage,
      shapes,
      titulo: exportTitulo || 'Plano',
      subtitulo: exportSubtitulo || '',
      ubicacion: exportUbicacion || '',
      descripcion: exportDescripcion || '',
    })
    const imgData = canvas.toDataURL('image/jpeg', 0.95)

    if (tr) {
      tr.visible(prevVisible)
      tr.getLayer()?.batchDraw()
    }

    setModoExport(false)

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    const margin = 24
    const maxW = pageW - margin * 2
    const maxH = pageH - margin * 2
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
    const w = canvas.width * ratio
    const h = canvas.height * ratio
    const x = (pageW - w) / 2
    const y = (pageH - h) / 2

    pdf.addImage(imgData, 'JPEG', x, y, w, h)

    const name = sanitizarNombreArchivo(exportTitulo || 'plano')
    pdf.save(`${name}.pdf`)
  }

  useImperativeHandle(ref, () => ({ exportarJpg, exportarPdf }), [shapes, exportTitulo, exportSubtitulo])

  const grid = useMemo(() => {
    const spacing = 40
    const lines = []

    for (let x = 0; x <= size.width; x += spacing) {
      lines.push({ points: [x, 0, x, size.height] })
    }
    for (let y = 0; y <= size.height; y += spacing) {
      lines.push({ points: [0, y, size.width, y] })
    }

    return lines
  }, [size.height, size.width])

  // ── Tecla Delete/Backspace elimina el elemento seleccionado ──────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (!selectedId) return
      const next = shapes.filter(s => s.id !== selectedId)
      onChange?.(next)
      setSelectedId(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedId, shapes, onChange])

  const eliminarSeleccionado = () => {
    if (!selectedId) return
    const next = shapes.filter(s => s.id !== selectedId)
    onChange?.(next)
    setSelectedId(null)
  }

  const muroTieneConflicto = (id, rectCandidate) => {
    if (!rectCandidate) return false
    return shapes.some((s) => {
      if (!s) return false
      if (s.id === id) return false
      if (s.tipo !== 'muro') return false
      const otherRect = {
        x: Number(s.x) || 0,
        y: Number(s.y) || 0,
        width: Number(s.width) || 0,
        height: Number(s.height) || 0,
      }
      return rectangulosSeSolapan(rectCandidate, otherRect)
    })
  }

  const actualizarForma = (id, patch) => {
    const actual = shapes.find((s) => s.id === id)
    if (!actual) return true

    const actualizado = { ...actual, ...patch }

    if (actualizado.tipo === 'muro') {
      const node = shapeRefs.current[id]
      const rect =
        clientRectDeNode(node) ??
        {
          x: Number(actualizado.x) || 0,
          y: Number(actualizado.y) || 0,
          width: Number(actualizado.width) || 0,
          height: Number(actualizado.height) || 0,
        }

      const haySolape = muroTieneConflicto(id, rect)
      if (haySolape) return false
    }

    const next = shapes.map((s) => (s.id === id ? actualizado : s))
    onChange?.(next)
    return true
  }

  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return

    // El Transformer solo opera sobre elementos tipo rect (muro/puerta/ventana).
    // Usamos un rAF para garantizar que shapeRefs ya está poblado post-commit.
    const run = () => {
      const selectedShape = shapes.find((s) => s.id === selectedId)
      const esRect = selectedShape ? isTipoRect(selectedShape.tipo) : false
      const node = (selectedId && esRect) ? shapeRefs.current[selectedId] : null
      tr.nodes(node ? [node] : [])
      tr.getLayer()?.batchDraw()
      setIdEnConflicto(null)
    }

    // requestAnimationFrame asegura que los ref callbacks de los <Rect> ya corrieron
    const raf = requestAnimationFrame(run)
    return () => cancelAnimationFrame(raf)
  }, [selectedId, shapes])

  const alPresionarFondo = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage()
    if (clickedOnEmpty) setSelectedId(null)
  }

  const estiloPorTipo = (tipo) => {
    if (modoExport) {
      const fill = colorPorTipoParaExport(tipo)
      const opacity = tipo === 'ventana' ? 0.55 : 0.9
      return { fill, opacity }
    }

    if (tipo === 'muro') {
      return isDark
        ? { fill: '#FFFFFF', opacity: 0.95 }
        : { fill: '#0F172A', opacity: 0.92 }
    }
    if (tipo === 'puerta') {
      // Gris — neutro para que el símbolo del arco sea protagonista
      return isDark
        ? { fill: '#64748B', opacity: 0.55 }   // slate-500
        : { fill: '#94A3B8', opacity: 0.45 }   // slate-400
    }
    if (tipo === 'ventana') {
      // Fill casi-invisible (transparent bloquea los hits en Konva)
      return { fill: 'rgba(0,0,0,0.001)', opacity: 1 }
    }

    return isDark
      ? { fill: '#38BDF8', opacity: 0.9 }
      : { fill: '#1E293B', opacity: 0.75 }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white dark:bg-[#0F172A]">
      {/* ── Widget de control (rotación + eliminar) para elemento seleccionado ── */}
      {selectedShape ? (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
          {/* Rotación: solo rect */}
          {isTipoRect(selectedShape.tipo) && (
            <div className="rounded-xl border border-slate-700 bg-slate-950/95 text-white px-3 py-2 backdrop-blur">
              <div className="text-[10px] text-slate-400 mb-1">Rotación · {selectedShape.tipo}</div>
              <select
                className="h-8 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm w-full"
                value={snapGrados(Number(selectedShape.rotation) || 0)}
                onChange={(e) => aplicarRotacionSeleccion(e.target.value)}
              >
                {ROTACION_SNAPS.map((deg) => (
                  <option key={deg} value={deg}>{deg}°</option>
                ))}
              </select>
            </div>
          )}
          {/* Tipo label para no-rect */}
          {!isTipoRect(selectedShape.tipo) && (
            <div className="rounded-lg border border-slate-700 bg-slate-950/95 text-slate-300 px-3 py-1.5 text-xs backdrop-blur">
              {selectedShape.tipo === 'texto' || selectedShape.tipo === 'cota'
                ? 'Doble clic para editar · Arrastra para mover'
                : selectedShape.tipo}
            </div>
          )}
          {/* Botón eliminar */}
          <button
            onClick={eliminarSeleccionado}
            title="Eliminar (Delete)"
            className="
              flex items-center justify-center w-9 h-9 rounded-xl
              border border-red-800 bg-red-950/90 text-red-400
              hover:bg-red-600 hover:text-white hover:border-red-500
              transition-colors backdrop-blur
            "
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M7.5 6.75h9m-6.75 0v-1.5h4.5v1.5m-7.5 0l.9 13.5h6.2l.9-13.5" />
            </svg>
          </button>
        </div>
      ) : null}

      {/* ── Editor de texto inline (HTML flotante sobre el Stage) ── */}
      {editingId ? (
        <div
          className="fixed z-50 shadow-2xl"
          style={{
            left: editingPos.x,
            top: editingPos.y,
            width: editingPos.width,
          }}
        >
          <textarea
            ref={textareaRef}
            value={editingText}
            rows={2}
            className="
              w-full resize-none rounded-lg border-2 px-3 py-2
              text-sm font-semibold leading-snug outline-none
              bg-slate-900 border-sky-400 text-sky-200
              placeholder-slate-500 shadow-lg
            "
            placeholder="Escribe aquí…"
            onChange={(e) => setEditingText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                cerrarEditorTexto(true)
              }
              if (e.key === 'Escape') {
                cerrarEditorTexto(false)
              }
            }}
            onBlur={() => cerrarEditorTexto(true)}
          />
          <div className="mt-1 text-[10px] text-slate-500 text-center">
            Enter para guardar · Esc para cancelar
          </div>
        </div>
      ) : null}

      <Stage ref={stageRef} width={size.width} height={size.height} onMouseDown={alPresionarFondo}>
        <Layer>
          <Rect
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fill={modoExport ? '#FFFFFF' : isDark ? '#0F172A' : '#FFFFFF'}
          />

          {modoExport
            ? null
            : grid.map((l, idx) => (
              <Line
                key={idx}
                points={l.points}
                stroke={isDark ? '#1E293B' : '#E2E8F0'}
                strokeWidth={1}
                opacity={0.7}
              />
            ))}

          {modoExport ? null : (
            <Text
              x={12}
              y={10}
              text="Editor CAD (demo)"
              fill={isDark ? '#38BDF8' : '#1E293B'}
              fontSize={12}
              opacity={0.75}
            />
          )}
        </Layer>

        <Layer>
          {/* ── Elementos tipo RECT (muro / puerta / ventana) ── */}
          {shapes.filter((s) => isTipoRect(s.tipo)).map((s) => (
            <Rect
              key={s.id}
              ref={(node) => {
                if (!node) return
                shapeRefs.current[s.id] = node
              }}
              x={Number(s.x) || 0}
              y={Number(s.y) || 0}
              width={Number(s.width) || 0}
              height={Number(s.height) || 0}
              rotation={Number(s.rotation) || 0}
              {...(idEnConflicto === s.id && s.tipo === 'muro'
                ? { fill: '#EF4444', opacity: 0.85 }
                : estiloPorTipo(s.tipo))}
              stroke={selectedId === s.id ? (isDark ? '#38BDF8' : '#0F172A') : undefined}
              strokeWidth={selectedId === s.id ? 1.5 : 0}
              cornerRadius={2}
              draggable
              onClick={() => setSelectedId(s.id)}
              onTap={() => setSelectedId(s.id)}
              onDragMove={(e) => {
                if (s.tipo !== 'muro') return
                const nx = e.target.x(), ny = e.target.y()
                // Snap magnético
                const snap = calcularSnap(shapes, s.id, nx, ny)
                if (snap) {
                  e.target.position(snap)
                  setSnapPos(snap)
                } else {
                  setSnapPos(null)
                }
                // Conflicto con umbral 4px — ya no dispara en esquinas
                const rect = {
                  x: (snap?.x ?? nx),
                  y: (snap?.y ?? ny),
                  width: Number(s.width) || 0,
                  height: Number(s.height) || 0,
                }
                setIdEnConflicto(muroTieneConflicto(s.id, rect) ? s.id : null)
              }}
              onDragEnd={(e) => {
                setIdEnConflicto(null)
                setSnapPos(null)
                const ok = actualizarForma(s.id, { x: e.target.x(), y: e.target.y() })
                if (!ok) {
                  e.target.position({ x: Number(s.x) || 0, y: Number(s.y) || 0 })
                  e.target.getLayer()?.batchDraw()
                }
              }}
              onTransform={(e) => {
                const node = e.target
                const snappedRotation = snapGrados(node.rotation())
                if (node.rotation() !== snappedRotation) {
                  node.rotation(snappedRotation)
                  node.getLayer()?.batchDraw()
                }
                if (s.tipo !== 'muro') return
                const rect = clientRectDeNode(node)
                setIdEnConflicto(muroTieneConflicto(s.id, rect) ? s.id : null)
              }}
              onTransformEnd={(e) => {
                const node = e.target
                const scaleX = node.scaleX()
                const scaleY = node.scaleY()
                const rotation = snapGrados(node.rotation())
                node.scaleX(1)
                node.scaleY(1)
                const patch = { x: node.x(), y: node.y(), rotation }
                const widthCandidate = Math.max(6, node.width() * scaleX)
                const heightCandidate = Math.max(6, node.height() * scaleY)
                if (tieneEspesorFijo(s.tipo)) {
                  const esp = espesorPxPorTipo(s.tipo)
                  const largo = Math.max(widthCandidate, heightCandidate)
                  const esHorizontal = widthCandidate >= heightCandidate
                  const width = esHorizontal ? largo : esp
                  const height = esHorizontal ? esp : largo
                  patch.width = width
                  patch.height = height
                  node.width(width)
                  node.height(height)
                } else {
                  patch.width = widthCandidate
                  patch.height = heightCandidate
                }
                setIdEnConflicto(null)
                const ok = actualizarForma(s.id, patch)
                if (!ok) {
                  node.position({ x: Number(s.x) || 0, y: Number(s.y) || 0 })
                  node.width(Number(s.width) || 0)
                  node.height(Number(s.height) || 0)
                  node.rotation(Number(s.rotation) || 0)
                  node.getLayer()?.batchDraw()
                }
              }}
            />
          ))}

          {/* ── Overlay símbolo arquitectónico de PUERTA (Arc+Line, no interactivo) ── */}
          {shapes.filter((s) => s.tipo === 'puerta').map((s) => {
            const w = Number(s.width) || 0
            const h = Number(s.height) || 0
            const rot = Number(s.rotation) || 0
            // Gris neutro para la puerta — funciona en dark y light
            const doorColor = isDark ? '#CBD5E1' : '#475569'   // slate-300 / slate-600
            const doorFill = isDark ? 'rgba(203,213,225,0.10)' : 'rgba(71,85,105,0.08)'
            return (
              <Group
                key={`door-sym-${s.id}`}
                x={Number(s.x) || 0}
                y={Number(s.y) || 0}
                rotation={rot}
                listening={false}   // no captura eventos — el Rect subyacente los maneja
              >
                {/* Línea de umbral (el vano) */}
                <Line
                  points={[0, h / 2, w, h / 2]}
                  stroke={doorColor}
                  strokeWidth={h}
                  opacity={0.18}
                />
                {/* Hinge dot */}
                <Circle x={0} y={h / 2} radius={3.5} fill={doorColor} />
                {/* Panel de la puerta (posición abierta — perpendicular) */}
                <Line
                  points={[0, h / 2, 0, h / 2 - w]}
                  stroke={doorColor}
                  strokeWidth={2.5}
                  lineCap="round"
                />
                {/* Arco de apertura */}
                <Arc
                  x={0}
                  y={h / 2}
                  innerRadius={w - 2}
                  outerRadius={w}
                  angle={90}
                  rotation={-90}
                  fill={doorFill}
                  stroke={doorColor}
                  strokeWidth={1}
                />
              </Group>
            )
          })}

          {/* ── Overlay símbolo arquitectónico de VENTANA (4 paneles, sin fondo) ── */}
          {shapes.filter((s) => s.tipo === 'ventana').map((s) => {
            const w = Number(s.width) || 0
            const h = Number(s.height) || 0
            const rot = Number(s.rotation) || 0
            // Color de la ventana: funciona en ambos temas
            const winColor = isDark ? '#7DD3FC' : '#0369A1'   // sky-300 / sky-700
            return (
              <Group
                key={`win-sym-${s.id}`}
                x={Number(s.x) || 0}
                y={Number(s.y) || 0}
                rotation={rot}
                listening={false}
              >
                {/* Marco exterior */}
                <Rect
                  x={0} y={0} width={w} height={h}
                  fill="transparent"
                  stroke={winColor}
                  strokeWidth={2}
                  cornerRadius={1}
                />
                {/* Línea paralela interior superior (hueco de vidrio) */}
                <Line
                  points={[0, h * 0.25, w, h * 0.25]}
                  stroke={winColor}
                  strokeWidth={1}
                />
                {/* Línea paralela interior inferior */}
                <Line
                  points={[0, h * 0.75, w, h * 0.75]}
                  stroke={winColor}
                  strokeWidth={1}
                />
                {/* Cruceta vertical — divide en 2 hojas */}
                <Line
                  points={[w / 2, 0, w / 2, h]}
                  stroke={winColor}
                  strokeWidth={1.5}
                />
              </Group>
            )
          })}

          {/* ── Etiquetas de medida para elementos rect ── */}
          {shapes.filter((s) => isTipoRect(s.tipo)).map((s) => {
            const w = Number(s.width) || 0
            const h = Number(s.height) || 0
            const lengthPx = tieneEspesorFijo(s.tipo) ? Math.max(w, h) : w
            const m = aMetros(lengthPx)
            const label = `${m.toFixed(2)} m`
            const x = (Number(s.x) || 0) + 4
            const y = (Number(s.y) || 0) - 18
            return (
              <Text
                key={`${s.id}-measure`}
                x={x}
                y={y}
                text={label}
                fontSize={12}
                fill={isDark ? '#E2E8F0' : '#0F172A'}
                opacity={0.9}
              />
            )
          })}

          {/* ── TEXTO libre ── */}
          {shapes.filter((s) => s.tipo === 'texto').map((s) => {
            const isSelected = selectedId === s.id
            const isEditing = editingId === s.id
            const textColor = isDark ? '#A5F3FC' : '#1D4ED8'   // cyan-200 / blue-700
            const bgColor = isDark ? 'rgba(14,165,233,0.10)' : 'rgba(29,78,216,0.07)'
            const borderCol = isSelected
              ? (isDark ? '#38BDF8' : '#2563EB')
              : (isDark ? 'rgba(56,189,248,0.25)' : 'rgba(37,99,235,0.20)')

            const txt = String(s.texto || '')
            const fs = Number(s.tamano_fuente) || 16
            const px = Number(s.x) || 0
            const py = Number(s.y) || 0
            // Estimar ancho del texto para el fondo
            const approxW = Math.max(60, txt.length * fs * 0.6 + 16)
            const approxH = fs + 14

            return (
              <Group
                key={s.id}
                x={px}
                y={py}
                draggable={!isEditing}
                onClick={() => setSelectedId(s.id)}
                onTap={() => setSelectedId(s.id)}
                onDblClick={(e) => {
                  setSelectedId(s.id)
                  abrirEditorTexto(s, e.target)
                }}
                onDragEnd={(e) => {
                  actualizarForma(s.id, { x: e.target.x(), y: e.target.y() })
                }}
              >
                {/* Fondo pastilla */}
                <Rect
                  x={-8}
                  y={-6}
                  width={approxW}
                  height={approxH}
                  fill={bgColor}
                  stroke={borderCol}
                  strokeWidth={isSelected ? 1.5 : 1}
                  cornerRadius={5}
                />
                {/* Indicador izq */}
                <Rect
                  x={-8}
                  y={-6}
                  width={3}
                  height={approxH}
                  fill={isDark ? '#38BDF8' : '#2563EB'}
                  cornerRadius={[5, 0, 0, 5]}
                />
                {/* Texto */}
                <Text
                  ref={(node) => { if (node) shapeRefs.current[s.id] = node }}
                  x={0}
                  y={0}
                  text={isEditing ? '' : txt}
                  fontSize={fs}
                  fill={textColor}
                  fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
                  fontStyle="600"
                />
              </Group>
            )
          })}

          {/* ── COTAS arquitectónicas ── */}
          {shapes.filter((s) => s.tipo === 'cota').map((s) => {
            const x1 = Number(s.x1) || 0
            const y1 = Number(s.y1) || 0
            const x2 = Number(s.x2) || 0
            const y2 = Number(s.y2) || 0
            const cx = (x1 + x2) / 2
            const cy = (y1 + y2) / 2
            const { a: tickA, b: tickB } = cotaTicks({ x1, y1, x2, y2, tick: 10 })
            const isSelected = selectedId === s.id
            const isEditing = editingId === s.id

            // Paleta de cota: naranja cálido
            const cotaLine = isDark ? '#FB923C' : '#EA580C'    // orange-400 / orange-600
            const cotaBadge = isDark ? '#431407' : '#FFF7ED'    // fondo badge
            const cotaText = isDark ? '#FDBA74' : '#9A3412'    // orange-300 / orange-800

            const valorStr = String(s.valor || '')
            const badgeW = Math.max(44, valorStr.length * 7.5 + 14)

            return (
              <Group key={s.id}>
                {/* ── Grupo principal arrastrable (línea + ticks + label) ── */}
                <Group
                  draggable
                  onClick={() => setSelectedId(s.id)}
                  onTap={() => setSelectedId(s.id)}
                  onDragEnd={(e) => {
                    const dx = e.target.x()
                    const dy = e.target.y()
                    actualizarForma(s.id, { x1: x1 + dx, y1: y1 + dy, x2: x2 + dx, y2: y2 + dy })
                    e.target.position({ x: 0, y: 0 })
                  }}
                >
                  {/* Línea principal */}
                  <Line
                    points={[x1, y1, x2, y2]}
                    stroke={cotaLine}
                    strokeWidth={isSelected ? 2.5 : 1.8}
                    lineCap="round"
                  />
                  {/* Ticks extremos */}
                  <Line points={tickA} stroke={cotaLine} strokeWidth={2} lineCap="round" />
                  <Line points={tickB} stroke={cotaLine} strokeWidth={2} lineCap="round" />

                  {/* Badge del valor — doble-click para editar */}
                  <Group
                    x={cx - badgeW / 2}
                    y={cy - 14}
                    onDblClick={(e) => {
                      setSelectedId(s.id)
                      abrirEditorTexto(s, e.target)
                    }}
                  >
                    <Rect
                      width={badgeW}
                      height={20}
                      fill={cotaBadge}
                      stroke={cotaLine}
                      strokeWidth={1}
                      cornerRadius={4}
                    />
                    <Text
                      x={4}
                      y={4}
                      text={isEditing ? '...' : valorStr}
                      fontSize={11}
                      fill={cotaText}
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                      fontStyle="bold"
                      width={badgeW - 8}
                      align="center"
                    />
                  </Group>
                </Group>

                {/* ── Handles de resize (solo cuando está seleccionada) ── */}
                {isSelected && (
                  <>
                    {/* Handle extremo A */}
                    <Circle
                      x={x1} y={y1} radius={8}
                      fill={isDark ? '#1E293B' : '#FFFFFF'}
                      stroke={cotaLine}
                      strokeWidth={2.5}
                      draggable
                      onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'crosshair' }}
                      onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
                      onDragEnd={(e) => {
                        const newX1 = e.target.x()
                        const newY1 = e.target.y()
                        // Recalcular el valor en metros automáticamente
                        const nuevoValor = calcularValorCota(newX1, newY1, x2, y2)
                        actualizarForma(s.id, { x1: newX1, y1: newY1, valor: nuevoValor })
                        e.target.position({ x: newX1, y: newY1 })
                      }}
                    />
                    {/* Handle extremo B */}
                    <Circle
                      x={x2} y={y2} radius={8}
                      fill={isDark ? '#1E293B' : '#FFFFFF'}
                      stroke={cotaLine}
                      strokeWidth={2.5}
                      draggable
                      onMouseEnter={(e) => { e.target.getStage().container().style.cursor = 'crosshair' }}
                      onMouseLeave={(e) => { e.target.getStage().container().style.cursor = 'default' }}
                      onDragEnd={(e) => {
                        const newX2 = e.target.x()
                        const newY2 = e.target.y()
                        // Recalcular el valor en metros automáticamente
                        const nuevoValor = calcularValorCota(x1, y1, newX2, newY2)
                        actualizarForma(s.id, { x2: newX2, y2: newY2, valor: nuevoValor })
                        e.target.position({ x: newX2, y: newY2 })
                      }}
                    />
                  </>
                )}
              </Group>
            )
          })}

          {/* ── SÍMBOLOS (paths SVG con color por categoría) ── */}
          {shapes.filter((s) => s.tipo === 'simbolo').map((s) => {
            const svgPath = symbolPathByName(s.nombre)
            const escala = Number(s.escala) || 1
            const rot = Number(s.rotacion) || 0
            if (!svgPath) return null

            const isSelected = selectedId === s.id
            const { fill: symFill, stroke: symStroke, bg: symBg } = symbolColors(s.nombre, isDark)
            const selBorder = isDark ? '#F472B6' : '#DB2777'   // pink selección

            return (
              <Group
                key={s.id}
                x={Number(s.x) || 0}
                y={Number(s.y) || 0}
                rotation={rot}
                scaleX={escala}
                scaleY={escala}
                draggable
                onClick={() => setSelectedId(s.id)}
                onTap={() => setSelectedId(s.id)}
                onDragEnd={(e) => actualizarForma(s.id, { x: e.target.x(), y: e.target.y() })}
              >
                {/* Fondo con color de categoría */}
                <Rect
                  x={-4} y={-4} width={108} height={78}
                  fill={symBg}
                  stroke={isSelected ? selBorder : symStroke}
                  strokeWidth={isSelected ? 2 : 1}
                  cornerRadius={6}
                />
                {/* Path del símbolo con fill interno */}
                <Path
                  data={svgPath}
                  fill={symFill}
                  stroke={symStroke}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Etiqueta del símbolo */}
                <Text
                  x={-4} y={68}
                  text={String(s.nombre || '').charAt(0).toUpperCase() + String(s.nombre || '').slice(1)}
                  fontSize={10}
                  fill={symStroke}
                  fontFamily="ui-sans-serif, system-ui, sans-serif"
                  fontStyle="600"
                  width={108}
                  align="center"
                />
              </Group>
            )
          })}

          <Transformer
            ref={transformerRef}
            rotateEnabled={false}
            keepRatio={false}
            rotationSnaps={ROTACION_SNAPS}
            rotationSnapTolerance={360}
            enabledAnchors={
              selectedShape?.tipo && tieneEspesorFijo(selectedShape.tipo)
                ? (Number(selectedShape.width) || 0) >= (Number(selectedShape.height) || 0)
                  ? ['middle-left', 'middle-right']
                  : ['middle-top', 'middle-bottom']
                : ['top-left', 'top-right', 'bottom-left', 'bottom-right']
            }
            borderStroke={isDark ? '#38BDF8' : '#0F172A'}
            anchorStroke={isDark ? '#38BDF8' : '#0F172A'}
            anchorFill={isDark ? '#0F172A' : '#FFFFFF'}
            boundBoxFunc={(oldBox, newBox) => {
              if (newBox.width < 6 || newBox.height < 6) return oldBox
              return newBox
            }}
          />
        </Layer>
      </Stage>
    </div>
  )
})
