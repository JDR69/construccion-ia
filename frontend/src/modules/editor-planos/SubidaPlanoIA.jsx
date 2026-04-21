import { useMemo, useRef, useState } from 'react'

export function SubidaPlanoIA({ isProcessing, onUpload }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const hint = useMemo(() => {
    if (isProcessing) return 'Procesando IA…'
    return 'Arrastra tu plano aquí o haz clic para seleccionar'
  }, [isProcessing])

  const onPick = () => {
    if (isProcessing) return
    inputRef.current?.click()
  }

  const handleFile = (file) => {
    if (!file || isProcessing) return
    onUpload?.(file)
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <div className="text-xl font-semibold text-white">Generar con IA</div>
          <div className="mt-1 text-sm text-slate-300">
            Sube una imagen del plano. Esto simula un procesamiento y llena el JSON.
          </div>
        </div>

        <button
          type="button"
          onClick={onPick}
          disabled={isProcessing}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setDragOver(false)
            const file = e.dataTransfer?.files?.[0]
            handleFile(file)
          }}
          className={[
            'w-full rounded-2xl border-2 border-dashed p-10 text-left transition',
            'bg-slate-950/60',
            dragOver ? 'border-indigo-400' : 'border-slate-700',
            isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:border-slate-500',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-6">
            <div>
              <div className="text-base font-semibold text-white">{hint}</div>
              <div className="mt-2 text-sm text-slate-300">
                Formatos: JPG, PNG (solo demo)
              </div>
            </div>

            {isProcessing ? (
              <div className="text-sm text-slate-200">Procesando…</div>
            ) : (
              <div className="text-sm text-slate-200">Subir</div>
            )}
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {isProcessing ? (
          <div className="mt-4 text-sm text-slate-300">Procesando IA…</div>
        ) : null}
      </div>
    </div>
  )
}
