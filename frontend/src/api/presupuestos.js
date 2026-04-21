import { http } from './config'

const BASE = '/api/presupuestos/'

export async function getPresupuestoItems() {
  const res = await http.get(`${BASE}items/`)
  return res.data
}
