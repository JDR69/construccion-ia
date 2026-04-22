import { forwardRef, useImperativeHandle, useRef } from 'react'

import { CanvasBoard } from './CanvasBoard'
import { EditorToolbar } from './EditorToolbar'

export const EditorWorkspace = forwardRef(function EditorWorkspace({
  datosVectoriales,
  onChange,
  onBack,
  onClear,
  onSave,
  onAdd,
  exportTitulo,
  exportSubtitulo,
  exportUbicacion,
  exportDescripcion,
  saving,
  isDark,
  onToggleTheme,
}, ref) {
  const canvasRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      exportarJpg: () => canvasRef.current?.exportarJpg?.(),
      exportarPdf: () => canvasRef.current?.exportarPdf?.(),
    }),
    []
  )

  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0">
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

      <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none">
        <div className="pointer-events-auto">
          <EditorToolbar
            onBack={onBack}
            onClear={onClear}
            onSave={onSave}
            onAdd={onAdd}
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
