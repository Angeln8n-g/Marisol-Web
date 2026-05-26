import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

export function useAuth() {
  const navigate = useNavigate()
  const { session, user, isLoading, setSession, setSupabaseUser, setUser } = useAuthStore()

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) setUser(data as unknown as User)
    } catch {
      // User profile not in local table
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Credenciales inválidas')

    if (data.session) {
      setSession(data.session)
      setSupabaseUser(data.user)
      await fetchUserProfile(data.user.id)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    useAuthStore.getState().clearAuth()
    navigate('/')
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

export async function initAuth() {
  try {
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession) {
      useAuthStore.getState().setLoading(false)
      return
    }
    const { setSession, setSupabaseUser, setUser } = useAuthStore.getState()
    setSession(currentSession)
    setSupabaseUser(currentSession.user)
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .single()
      if (data) setUser(data as unknown as User)
    } catch {
      // User profile not in local table yet
    }
  } catch (err) {
    console.error('Auth initialization failed:', err)
  } finally {
    useAuthStore.getState().setLoading(false)
  }
}

export function AuthListener() {
  useEffect(() => {
    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        const { setSession, setSupabaseUser, setUser, clearAuth } = useAuthStore.getState()
        if (newSession) {
          setSession(newSession)
          setSupabaseUser(newSession.user)
          try {
            const { data } = await supabase
              .from('users')
              .select('*')
              .eq('id', newSession.user.id)
              .single()
            if (data) setUser(data as unknown as User)
          } catch {
            // User profile not in local table yet
          }
        } else {
          clearAuth()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return null
}