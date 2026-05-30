import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import type { UserRole } from '../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { session, user, isLoading } = useAuthStore()
  const location = useLocation()

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-gold"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-gray-600 font-montserrat">Verificando sesión...</span>
        </div>
      </div>
    )
  }

  // Redirigir al login si no hay sesión
  if (!session) {
    console.log('🔒 No session, redirecting to login')
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  // Verificación de roles (si se especifica)
  // Solo verificar roles si el perfil de usuario ya se cargó
  if (requiredRole && user) {
    if (user.role !== requiredRole) {
      console.log('🚫 Access denied - required role:', requiredRole, 'user role:', user.role)
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-playfair text-navy mb-2">Acceso Denegado</h2>
            <p className="text-sm text-gray-600 font-montserrat mb-6">
              No tienes permisos para acceder a esta sección.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-gold text-white font-montserrat font-semibold rounded-md hover:bg-gold/90 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      )
    }
  }

  // Si hay sesión, permitir acceso
  console.log('✅ Access granted')
  return <>{children}</>
}
