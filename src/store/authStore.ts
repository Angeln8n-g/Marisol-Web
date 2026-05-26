// src/store/authStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'
import type { User, UserRole } from '../types'

interface AuthState {
  // Estado de sesión
  session: Session | null
  user: User | null
  supabaseUser: SupabaseUser | null
  isLoading: boolean
  
  // Acciones
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
  setSupabaseUser: (user: SupabaseUser | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  
  // Helpers
  isAuthenticated: () => boolean
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
}

/**
 * Store de autenticación global usando Zustand.
 * 
 * Gestiona el estado de sesión JWT, usuario autenticado y roles.
 * La sesión se persiste en localStorage para mantener el login entre recargas.
 * 
 * @example
 * const { user, isAuthenticated, setSession } = useAuthStore()
 * 
 * if (isAuthenticated()) {
 *   console.log('Usuario autenticado:', user?.full_name)
 * }
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      session: null,
      user: null,
      supabaseUser: null,
      isLoading: true,
      
      // Acciones
      setSession: (session) => set({ session }),
      
      setUser: (user) => set({ user }),
      
      setSupabaseUser: (supabaseUser) => set({ supabaseUser }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      clearAuth: () => set({
        session: null,
        user: null,
        supabaseUser: null,
        isLoading: false,
      }),
      
      // Helpers
      isAuthenticated: () => {
        const state = get()
        return !!(state.session && state.user)
      },
      
      hasRole: (role: UserRole) => {
        const state = get()
        return state.user?.role === role
      },
      
      isAdmin: () => {
        const state = get()
        return state.user?.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        session: state.session,
        user: state.user,
        supabaseUser: state.supabaseUser,
      }),
    }
  )
)
