import { forwardRef, useImperativeHandle, useRef } from 'react'

import { CanvasBoard } from './CanvasBoard'
import { EditorToolbar } from './EditorToolbar'
import { ElementsPalette } from './ElementsPalette'

export const EditorWorkspace = forwardRef(function EditorWorkspace(
  {
    datosVectoriales,
    onChange,
    onBack,
    onClear,
    onSave,
    onAddElemento,   // fn(tipo)              — rect simples
    onAddTexto,      // fn(x, y, texto)
    onAddCota,       // fn(x1,y1,x2,y2,valor)
    onAddSimbolo,    // fn(x, y, nombre)
    exportTitulo,
    exportSubtitulo,
    exportUbicacion,
    exportDescripcion,
    saving,
    isDark,
    onToggleTheme,
  },
  ref,
) {
  const canvasRef     = useRef(null)
  const canvasDivRef  = useRef(null)   // div contenedor del Stage (para getBoundingClientRect)

  useImperativeHandle(
    ref,
    () => ({
      exportarJpg: () => canvasRef.current?.exportarJpg?.(),
      exportarPdf: () => canvasRef.current?.exportarPdf?.(),
    }),
    [],
  )

  // ── Drag-and-drop desde el pallete al canvas ─────────────────────────────
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (e) => {
    e.preventDefault()

    const raw = e.dataTransfer.getData('application/x-plano-element')
    if (!raw) return

    let parsed
    try { parsed = JSON.parse(raw) } catch { return }

    // Calcular coordenadas relativas dentro del canvas
    const rect = canvasDivRef.current?.getBoundingClientRect()
    const x = rect ? e.clientX - rect.left : 100
    const y = rect ? e.clientY - rect.top  : 100

    const { tipo, payload = {} } = parsed

    if (tipo === 'muro' || tipo === 'puerta' || tipo === 'ventana') {
      // addElemento crea el elemento con posición por defecto;
      // para que aparezca donde se soltó lo inyectamos directamente al array.
      const PX_POR_METRO = 100
      const espesores   = { muro: 0.2, puerta: 0.15, ventana: 0.1 }
      const largos      = { muro: 1,   puerta: 0.9,  ventana: 1.2 }
      const espesorPx   = (espesores[tipo] ?? 0.18) * PX_POR_METRO
      const largoPx     = (largos[tipo]    ?? 1)    * PX_POR_METRO
      const nuevo = {
        id: Date.now(),
        tipo,
        x: x - largoPx / 2,
        y: y - espesorPx / 2,
        width:  largoPx,
        height: espesorPx,
        rotation: 0,
        ...payload,
      }
      onChange?.([...(Array.isArray(datosVectoriales) ? datosVectoriales : []), nuevo])
      return
    }

    if (tipo === 'texto') {
      onAddTexto?.(x, y, payload.texto ?? 'Texto', payload.tamano_fuente ?? 16)
      return
    }

    if (tipo === 'cota') {
      // Cota horizontal de 200px centrada en el punto de drop
      const off = 100
      const newX1 = x - off
      const newX2 = x + off
      const newY1 = y
      const newY2 = y
      // Calcular valor real en metros desde la distancia en px
      const distPx = Math.hypot(newX2 - newX1, newY2 - newY1)
      const metros = distPx / 100  // PX_POR_METRO = 100
      const valorCalculado = `${metros.toFixed(2)} m`
      onAddCota?.(newX1, newY1, newX2, newY2, valorCalculado, payload.orientacion ?? 'horizontal')
      return
    }

    if (tipo === 'simbolo') {
      onAddSimbolo?.(x - 50, y - 30, payload.nombre ?? 'cama', payload.categoria ?? 'mueble', payload.rotacion ?? 0, payload.escala ?? 1)
      return
    }
  }

  return (
    <div className="relative w-full h-full">
      {/* ── Canvas principal ──────────────────────────────────────────── */}
      <div
        ref={canvasDivRef}
        className="absolute inset-0"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CanvasBoard
          ref={canvasRef}
          datosVectoriales={datosVectoriales}
          onChange={onChange}
          isDark={isDark}
          exportTitulo={exportTitulo}
          exportSubtitulo={exportSubtitulo}
          exportUbicacion={exportUbicacion}
          exportDescripcion={exportDescripcion}
        />
      </div>

      {/* ── Panel de elementos — lado derecho ────────────────────────── */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto">
        <ElementsPalette isDark={isDark} />
      </div>

      {/* ── Toolbar inferior ─────────────────────────────────────────── */}
      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <EditorToolbar
            onBack={onBack}
            onClear={onClear}
            onSave={onSave}
            onExportJpg={() => canvasRef.current?.exportarJpg?.()}
            onExportPdf={() => canvasRef.current?.exportarPdf?.()}
            saving={saving}
            isDark={isDark}
            onToggleTheme={onToggleTheme}
          />
        </div>
      </div>
    </div>
  )
})
