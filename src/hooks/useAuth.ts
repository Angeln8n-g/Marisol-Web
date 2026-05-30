import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

// Timeout para operaciones de autenticación (10 segundos)
const AUTH_TIMEOUT = 10000

/**
 * Wrapper para agregar timeout a promesas
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operación timeout'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ])
}

/**
 * Obtiene el perfil del usuario desde la tabla users
 * Con timeout y manejo de errores mejorado
 */
async function fetchUserProfile(userId: string): Promise<User | null> {
  try {
    const result = await withTimeout(
      Promise.resolve(supabase.from('users').select('*').eq('id', userId).single()),
      AUTH_TIMEOUT,
      'Timeout al obtener perfil de usuario'
    )
    
    if (result.error) {
      console.warn('Error fetching user profile:', result.error.message)
      return null
    }
    
    return result.data as unknown as User
  } catch (err) {
    console.error('Failed to fetch user profile:', err)
    return null
  }
}

export function useAuth() {
  const navigate = useNavigate()
  const { session, user, isLoading, setSession, setSupabaseUser, setUser } = useAuthStore()

  const signIn = async (email: string, password: string) => {
    try {
      const result = await withTimeout(
        Promise.resolve(supabase.auth.signInWithPassword({ email, password })),
        AUTH_TIMEOUT,
        'La operación tardó demasiado. Intenta de nuevo.'
      )
      
      if (result.error) throw new Error('Credenciales inválidas')
      if (!result.data.session) throw new Error('No se pudo crear la sesión')

      // Actualizar estado de autenticación
      setSession(result.data.session)
      setSupabaseUser(result.data.user)
      
      // Fetch del perfil en segundo plano (no bloqueante)
      fetchUserProfile(result.data.user.id).then((profile) => {
        if (profile) setUser(profile)
      })
    } catch (err) {
      throw err
    }
  }

  const signOut = async () => {
    try {
      await withTimeout(
        Promise.resolve(supabase.auth.signOut()),
        AUTH_TIMEOUT,
        'Timeout al cerrar sesión'
      )
    } catch (err) {
      console.error('Error during sign out:', err)
    } finally {
      useAuthStore.getState().clearAuth()
      navigate('/')
    }
  }

  const requireAuth = (redirectTo?: string) => {
    if (!session) {
      const path = redirectTo || window.location.pathname
      navigate(`/admin/login?redirect=${encodeURIComponent(path)}`)
    }
  }

  return {
    session,
    user,
    isLoading,
    isAuthenticated: useAuthStore.getState().isAuthenticated,
    signIn,
    signOut,
    requireAuth,
  }
}

/**
 * Inicializa la autenticación al cargar la app
 * Optimizado para evitar bloqueos
 */
export async function initAuth() {
  const { setSession, setSupabaseUser, setUser, setLoading } = useAuthStore.getState()
  
  try {
    // Obtener sesión actual con timeout
    const result = await withTimeout(
      Promise.resolve(supabase.auth.getSession()),
      AUTH_TIMEOUT,
      'Timeout al obtener sesión'
    )
    
    if (result.error) {
      console.error('Error getting session:', result.error)
      setLoading(false)
      return
    }
    
    if (!result.data.session) {
      setLoading(false)
      return
    }

    // Actualizar sesión inmediatamente
    setSession(result.data.session)
    setSupabaseUser(result.data.session.user)
    
    // Marcar como cargado ANTES de fetch del perfil
    setLoading(false)
    
    // Fetch del perfil en segundo plano (no bloqueante)
    const profile = await fetchUserProfile(result.data.session.user.id)
    if (profile) setUser(profile)
    
  } catch (err) {
    console.error('Auth initialization failed:', err)
    setLoading(false)
  }
}

/**
 * Listener de cambios de autenticación
 * Optimizado para evitar fetches duplicados
 */
export function AuthListener() {
  useEffect(() => {
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔐 Auth event:', event, 'Session:', !!newSession)
        
        const { setSession, setSupabaseUser, setUser, clearAuth } = useAuthStore.getState()
        
        // Manejar cierre de sesión explícito
        if (event === 'SIGNED_OUT') {
          clearAuth()
          return
        }

        // Si no hay sesión pero el evento no es SIGNED_OUT, ignorar
        // (puede ser un evento intermedio durante la inicialización)
        if (!newSession) {
          console.warn('⚠️ No session but event is not SIGNED_OUT, ignoring')
          return
        }

        // Solo actualizar si la sesión cambió realmente
        const currentSession = useAuthStore.getState().session
        if (currentSession?.access_token === newSession.access_token) {
          console.log('✓ Session unchanged, skipping update')
          return // Evitar updates innecesarios
        }

        console.log('✓ Updating session')
        setSession(newSession)
        setSupabaseUser(newSession.user)
        
        // Solo fetch del perfil en eventos específicos
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const profile = await fetchUserProfile(newSession.user.id)
          if (profile) setUser(profile)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}