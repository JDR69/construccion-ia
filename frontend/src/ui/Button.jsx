const VARIANT = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary:
    'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
}

const SIZE = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition disabled:opacity-60 disabled:cursor-not-allowed',
        SIZE[size] ?? SIZE.md,
        VARIANT[variant] ?? VARIANT.primary,
        className,
      ].join(' ')}
      {...props}
    />
  )
}
