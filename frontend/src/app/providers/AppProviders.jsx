import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'

export function AppProviders({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}
