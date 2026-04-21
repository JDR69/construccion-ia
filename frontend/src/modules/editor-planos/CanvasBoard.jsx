import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva'

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

function rectangulosSeSolapan(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
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
  const [idEnConflicto, setIdEnConflicto] = useState(null)
  const [modoExport, setModoExport] = useState(false)

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

  const muroTieneConflicto = (id, rectCandidate) => {
    if (!rectCandidate) return false
    return shapes.some((s) => {
      if (!s) return false
      if (s.id === id) return false
      if (s.tipo !== 'muro') return false

      const otherNode = shapeRefs.current[s.id]
      const otherRect =
        clientRectDeNode(otherNode) ??
        {
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
    const node = selectedId ? shapeRefs.current[selectedId] : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()

    // Evita quedarse "pegado" en rojo tras cambiar selección
    setIdEnConflicto(null)
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
      // púrpura (similar a text-purple-600)
      return isDark
        ? { fill: '#9333EA', opacity: 0.78 }
        : { fill: '#9333EA', opacity: 0.65 }
    }
    if (tipo === 'ventana') {
      return isDark
        ? { fill: '#38BDF8', opacity: 0.7 }
        : { fill: '#38BDF8', opacity: 0.75 }
    }

    return isDark
      ? { fill: '#38BDF8', opacity: 0.9 }
      : { fill: '#1E293B', opacity: 0.75 }
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-white dark:bg-[#0F172A]">
      {selectedShape ? (
        <div className="absolute right-3 top-3 z-10 rounded-xl border border-slate-800 bg-slate-950 text-white px-3 py-2">
          <div className="text-xs text-slate-300">Rotación</div>
          <div className="mt-1 flex items-center gap-2">
            <select
              className="h-9 rounded-lg bg-slate-900 border border-slate-700 px-2 text-sm"
              value={snapGrados(Number(selectedShape.rotation) || 0)}
              onChange={(e) => aplicarRotacionSeleccion(e.target.value)}
            >
              {ROTACION_SNAPS.map((deg) => (
                <option key={deg} value={deg}>
                  {deg}°
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-400">{selectedShape.tipo}</div>
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
          {shapes.map((s) => (
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
                const rect = clientRectDeNode(e.target)
                setIdEnConflicto(muroTieneConflicto(s.id, rect) ? s.id : null)
              }}
              onDragEnd={(e) => {
                setIdEnConflicto(null)

                const ok = actualizarForma(s.id, { x: e.target.x(), y: e.target.y() })
                if (!ok) {
                  // Revertir visualmente (sin esperar re-render)
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
                  // Revertir visualmente
                  node.position({ x: Number(s.x) || 0, y: Number(s.y) || 0 })
                  node.width(Number(s.width) || 0)
                  node.height(Number(s.height) || 0)
                  node.rotation(Number(s.rotation) || 0)
                  node.getLayer()?.batchDraw()
                }
              }}
            />
          ))}

          {shapes.map((s) => {
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
