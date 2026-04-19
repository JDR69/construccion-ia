import { http } from './config'

export async function login(credentials) {
  const res = await http.post('/api/auth/login/', credentials)
  return res.data
}

export async function me() {
  const res = await http.get('/api/auth/me/')
  return res.data
}
