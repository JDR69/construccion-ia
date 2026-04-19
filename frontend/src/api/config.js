import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
const ACCESS_TOKEN_KEY = 'dpap.access'

function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export const http = axios.create({
  baseURL: API_BASE_URL,
})

http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (!token) return config

  config.headers = config.headers ?? {}
  config.headers.Authorization = `Bearer ${token}`
  return config
})
