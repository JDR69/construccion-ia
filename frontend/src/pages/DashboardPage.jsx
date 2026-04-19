import { useNavigate } from 'react-router-dom'
import { ListaProyectos } from '../features/dashboard/ListaProyectos'
import { ListaMateriales } from '../features/catalogo/ListaMateriales'

const mockProyectos = [
  { id: 'PRJ-001', nombre: 'Casa 120m²', direccion: 'Av. Banzer #123' },
  { id: 'PRJ-002', nombre: 'Local comercial', direccion: '2do Anillo #45' },
]

const mockMateriales = [
  { id: 'MAT-001', nombre: 'Cemento 50kg', precioUnitario: 55 },
  { id: 'MAT-002', nombre: 'Arena (m³)', precioUnitario: 120 },
  { id: 'MAT-003', nombre: 'Ladrillo 6h', precioUnitario: 1.2 },
]

export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <ListaProyectos
          proyectos={mockProyectos}
          onOpen={(p) => navigate(`/workspace/${p.id}`)}
        />
      </div>

      <div>
        <ListaMateriales materiales={mockMateriales} />
      </div>
    </div>
  )
}
