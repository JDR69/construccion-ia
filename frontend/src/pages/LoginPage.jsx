import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth.jsx'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error } = useAuth()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    await login({ correo, password })
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-lg font-semibold">Iniciar sesión</div>
          <div className="mt-1 text-sm text-white/60">
            Usa tu correo y contraseña.
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-5 space-y-4">
            <Input
              label="Correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-4 text-xs text-white/50">
            Tip: si no tienes usuario, créalo en backend con `/api/auth/register/`.
          </div>
        </div>
    </div>
  )
}
