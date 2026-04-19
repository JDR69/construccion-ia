export function Button({ className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={[
        'px-4 py-2 rounded-md text-white',
        'bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-500',
        'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...props}
    />
  )
}
