import { Button } from './Button'

export function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cerrar
            </Button>
          </div>

          <div className="p-5">{children}</div>

          {footer && (
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
