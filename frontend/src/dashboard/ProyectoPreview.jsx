import { useNavigate } from 'react-router-dom'

import { VisualizacionProyecto } from '../modules/dashboard/VisualizacionProyecto'

export function ProyectoPreview({ proyecto, onClose }) {
  const navigate = useNavigate()

  return (
    <VisualizacionProyecto
      proyecto={proyecto}
      onClose={onClose}
      onEnterPlano={() => navigate(`/proyecto/${proyecto?.id}/editor`)}
    />
  )
}
