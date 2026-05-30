import { useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

/**
 * Hook para manejar timeout de sesión y renovación automática
 * 
 * Características:
 * - Detecta sesiones expiradas
 * - Renueva tokens automáticamente
 * - NO redirige automáticamente (eso lo maneja AuthListener)
 */
export function useSessionTimeout() {
  const { session } = useAuthStore()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!session) return

    const checkSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession()
        
        // Si hay error o no hay sesión, no hacer nada (AuthListener lo manejará)
        if (error || !currentSession) {
          console.warn('Session check failed:', error?.message)
          return
        }

        // Calcular tiempo hasta expiración
        const expiresAt = new Date(currentSession.expires_at || 0).getTime()
        const now = Date.now()
        const timeUntilExpiry = expiresAt - now

        // Si expira en menos de 5 minutos, renovar
        if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
          console.log('🔄 Refreshing session (expires in', Math.round(timeUntilExpiry / 1000 / 60), 'minutes)')
          await supabase.auth.refreshSession()
        }

        // Configurar timeout para próxima verificación (cada 5 minutos)
        timeoutRef.current = setTimeout(checkSession, 5 * 60 * 1000)
      } catch (err) {
        console.error('Session check error:', err)
      }
    }

    // Esperar 30 segundos antes de la primera verificación
    // Esto evita conflictos con la inicialización
    const initialTimeout = setTimeout(checkSession, 30000)

    return () => {
      clearTimeout(initialTimeout)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [session])
}
