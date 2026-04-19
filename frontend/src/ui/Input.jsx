export function Input({ label, className = '', error, ...props }) {
  return (
    <label className="block">
      {label && (
        <div className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </div>
      )}
      <input
        className={[
          'w-full h-10 rounded-lg px-3',
          'bg-white dark:bg-slate-900',
          'text-slate-900 dark:text-white',
          'border border-slate-200 dark:border-slate-700',
          'outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500',
          className,
        ].join(' ')}
        {...props}
      />
      {error && (
        <div className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</div>
      )}
    </label>
  )
}
