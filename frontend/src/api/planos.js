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
    datos_vectoriales: [],
  })
  return created.data
}

export async function updateDatosVectoriales(planoId, json) {
  const res = await http.patch(`${BASE}${planoId}/`, {
    datos_vectoriales: json,
  })
  return res.data
}

// IA real: envía una imagen al backend para que Gemini genere datos vectoriales.
export async function procesarPlanoIA(planoId, file) {
  const form = new FormData()
  form.append('file', file)

  const res = await http.post(`${BASE}${planoId}/procesar-ia/`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return res.data
}
