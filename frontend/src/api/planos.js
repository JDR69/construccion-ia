import { http } from './config'

const BASE = '/api/planos/'

// Nota: en esta app el editor navega por proyectoId.
// Esta función devuelve el primer plano del proyecto; si no existe, crea uno.
export async function getPlano(proyectoId) {
  const res = await http.get(BASE, { params: { proyecto: proyectoId } })
  const list = Array.isArray(res.data) ? res.data : []
  if (list.length > 0) return list[0]

  const created = await http.post(BASE, {
    proyecto: proyectoId,
    nombre: 'Plano principal',
    datos_vectoriales: {},
  })
  return created.data
}

export async function updateDatosVectoriales(planoId, json) {
  const res = await http.patch(`${BASE}${planoId}/`, {
    datos_vectoriales: json,
  })
  return res.data
}

// Simulación IA: retorna JSON de prueba (no llama al backend).
export async function procesarPlanoIA(_planoId, _file) {
  await new Promise((r) => setTimeout(r, 1200))

  return [
    { id: 1, tipo: 'muro', x: 80, y: 100, width: 320, height: 18 },
    { id: 2, tipo: 'muro', x: 80, y: 160, width: 260, height: 18 },
    { id: 3, tipo: 'muro', x: 80, y: 220, width: 420, height: 18 },
  ]
}
