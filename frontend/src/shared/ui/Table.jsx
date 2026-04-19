export function Table({ className = '', ...props }) {
  return (
    <div className={['w-full overflow-x-auto', className].join(' ')}>
      <table
        className="w-full text-sm text-left text-slate-700 dark:text-slate-200"
        {...props}
      />
    </div>
  )
}
