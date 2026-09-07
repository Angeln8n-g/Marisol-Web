import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { useAuthStore } from '../../../store/authStore'

interface TopBarProps {
  onMenuToggle: () => void
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const { signOut } = useAuth()
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/admin/patients?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const doctorName = user?.full_name || 'Dra. Marisol García'

  return (
    <header className="h-20 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-xs sticky top-0 z-20">
      {/* Lado izquierdo: Botón hamburguesa y buscador rápido */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-gray-600 hover:text-navy rounded-xl hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Formulario de Búsqueda Rápida estilo DigiClinic */}
        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar pacientes, citas o teléfono..."
              className="w-full pl-10 pr-10 py-2 text-xs font-montserrat bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-navy/10 text-navy placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Lado derecho: Enlace público, notificaciones y perfil */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Botón Ver Sitio Público */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-montserrat font-medium text-gray-600 hover:text-navy bg-gray-50 hover:bg-gray-100 border border-gray-200/80 rounded-xl transition-colors"
          title="Abrir sitio web público en nueva pestaña"
        >
          <svg className="w-3.5 h-3.5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Sitio Público</span>
        </a>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-200 hidden sm:block" />

        {/* Perfil del Usuario */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-navy font-montserrat">
              {doctorName}
            </p>
            <p className="text-[11px] text-gray-400 font-montserrat capitalize">
              {user?.role === 'admin' ? 'Directora Clínica' : user?.role || 'Especialista'}
            </p>
          </div>

          <div className="relative">
            <img
              src="/Marisol_picture.jpeg"
              alt={doctorName}
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-gold/40 shadow-xs"
              onError={(e) => {
                const target = e.target as HTMLElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
            />
            <div className="hidden w-9 h-9 rounded-xl bg-navy text-gold flex items-center justify-center text-xs font-bold font-montserrat ring-2 ring-gold/40 shadow-xs">
              {doctorName.charAt(0)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>

          {/* Botón Salir */}
          <button
            onClick={signOut}
            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-1"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
