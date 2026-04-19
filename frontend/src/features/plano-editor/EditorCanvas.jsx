import { useEffect, useRef } from 'react'

export function EditorCanvas() {
  const hostRef = useRef(null)

  useEffect(() => {
    // Preparado para integrar Konva.js o Fabric.js en el futuro:
    // - Este hostRef será el contenedor donde se monte el Stage/Canvas.
    // - Aquí se puede inicializar y luego limpiar en el return.
    return () => {}
  }, [])

  return (
    <section className="h-full bg-slate-100 dark:bg-[#0F172A] rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Plano (Editor)
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Placeholder listo para Konva/Fabric.
        </p>
      </div>

      <div
        ref={hostRef}
        className="h-[520px] w-full flex items-center justify-center"
      >
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Área de canvas
        </div>
      </div>
    </section>
  )
}
