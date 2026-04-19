const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const contentType = res.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? await res.json()
    : await res.text()

  if (!res.ok) {
    const message =
      typeof body === 'string'
        ? body
        : body?.message ?? `HTTP ${res.status}`
    throw new Error(message)
  }

  return body
}
