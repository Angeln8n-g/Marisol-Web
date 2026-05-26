import React from 'react'
import { useAuth } from '../../../hooks/useAuth'
import { useAuthStore } from '../../../store/authStore'

interface TopBarProps {
  onMenuToggle: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const { signOut } = useAuth()
  const user = useAuthStore((s) => s.user)

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-600 hover:text-navy"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h2 className="text-lg font-playfair text-navy hidden sm:block">
          Panel Administrativo
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-navy font-montserrat">
            {user?.full_name || 'Usuario'}
          </p>
          <p className="text-xs text-gray-500 font-montserrat capitalize">
            {user?.role || '—'}
          </p>
        </div>

        <div className="w-9 h-9 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold font-montserrat">
          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
        </div>

        <button
          onClick={signOut}
          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  )
}
