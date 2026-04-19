import { useNavigate } from 'react-router-dom'
import { FormularioLogin } from '../features/auth/FormularioLogin'

export function LoginPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-6 py-12">
      <FormularioLogin
        onLogin={() => {
          navigate('/dashboard')
        }}
      />
    </div>
  )
}
