import { Button } from '../../shared/ui/Button'

export function ListaProyectos({ proyectos = [], onOpen }) {
  return (
    <section className="bg-slate-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Proyectos
        </h2>
        <Button className="text-sm px-3 py-1">Nuevo (mock)</Button>
      </div>

      <ul className="mt-3 space-y-2">
        {proyectos.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between bg-white dark:bg-[#1E293B] rounded-md p-3 border border-slate-200 dark:border-slate-800"
          >
            <div>
              <div className="font-medium text-slate-900 dark:text-white">
                {p.nombre}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                {p.direccion}
              </div>
            </div>
            <Button
              className="text-sm px-3 py-1"
              onClick={() => onOpen?.(p)}
            >
              Abrir
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
