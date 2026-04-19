import { Link, useParams } from 'react-router-dom'
import { EditorCanvas } from '../features/plano-editor/EditorCanvas'
import { TablaPresupuesto } from '../features/presupuesto/TablaPresupuesto'

const mockItems = [
  { id: 'IT-001', nombre: 'Cemento 50kg', unidad: 'bolsa', cantidad: 30, precioUnitario: 55 },
  { id: 'IT-002', nombre: 'Arena', unidad: 'm³', cantidad: 3, precioUnitario: 120 },
  { id: 'IT-003', nombre: 'Ladrillo 6h', unidad: 'u', cantidad: 800, precioUnitario: 1.2 },
]

export function WorkspacePage() {
  const { projectId } = useParams()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 dark:bg-[#0F172A] rounded-lg p-4 border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Workspace
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Proyecto: <span className="font-semibold">{projectId}</span>
          </p>
        </div>

        <Link
          to="/dashboard"
          className="text-sm text-purple-600 dark:text-[#38BDF8] hover:underline"
        >
          ← Volver al Dashboard
        </Link>
      </div>

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="min-h-[520px]">
          <EditorCanvas />
        </div>
        <div>
          <TablaPresupuesto items={mockItems} />
        </div>
      </div>
    </div>
  )
}
