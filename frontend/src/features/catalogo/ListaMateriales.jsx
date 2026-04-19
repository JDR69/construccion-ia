export function ListaMateriales({ materiales = [] }) {
  return (
    <section className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border border-slate-200 dark:border-slate-800">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Catálogo (mock)
      </h2>
      <ul className="mt-3 space-y-2">
        {materiales.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between text-sm border border-slate-200 dark:border-slate-800 rounded-md p-2"
          >
            <span className="text-slate-900 dark:text-white">{m.nombre}</span>
            <span className="text-slate-600 dark:text-slate-300">Bs {m.precioUnitario}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
