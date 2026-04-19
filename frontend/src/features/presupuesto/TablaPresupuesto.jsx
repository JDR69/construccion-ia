import { Table } from '../../shared/ui/Table'

export function TablaPresupuesto({ items = [] }) {
  const total = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0)

  return (
    <section className="bg-white dark:bg-[#1E293B] rounded-lg p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Presupuesto
        </h3>
        <div className="text-sm text-slate-700 dark:text-slate-200">
          Total: <span className="font-semibold">Bs {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-3">
        <Table>
          <thead className="text-xs uppercase text-slate-600 dark:text-slate-300">
            <tr>
              <th className="py-2 pr-2">Material</th>
              <th className="py-2 pr-2">Unidad</th>
              <th className="py-2 pr-2">Cant.</th>
              <th className="py-2 pr-2">P/U</th>
              <th className="py-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.id}
                className="border-t border-slate-200 dark:border-slate-800"
              >
                <td className="py-2 pr-2 text-slate-900 dark:text-white">
                  {it.nombre}
                </td>
                <td className="py-2 pr-2">{it.unidad}</td>
                <td className="py-2 pr-2">{it.cantidad}</td>
                <td className="py-2 pr-2">Bs {it.precioUnitario}</td>
                <td className="py-2">Bs {(it.cantidad * it.precioUnitario).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </section>
  )
}
