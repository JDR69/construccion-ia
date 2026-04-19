export function Input({ className = '', ...props }) {
  return (
    <input
      className={[
        'w-full rounded-md border border-slate-300 dark:border-slate-700',
        'bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100',
        'px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
