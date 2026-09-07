import React from 'react'
import { NavLink } from 'react-router-dom'

interface NavGroup {
  title: string
  items: {
    to: string
    label: string
    icon: string
  }[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Menú Principal',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { to: '/admin/appointments', label: 'Citas y Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { to: '/admin/patients', label: 'Pacientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { to: '/admin/medical-records', label: 'Historiales Clínicos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ],
  },
  {
    title: 'Clínica & Servicios',
    items: [
      { to: '/admin/procedures', label: 'Procedimientos', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { to: '/admin/pricing', label: 'Lista de Precios', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { to: '/admin/budgets', label: 'Presupuestos', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { to: '/admin/inventory', label: 'Inventario & Kardex', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    ],
  },
  {
    title: 'Gestión Administrativa',
    items: [
      { to: '/admin/accounting', label: 'Contabilidad', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
      { to: '/admin/clinics', label: 'Sedes & Clínicas', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
      { to: '/admin/marketing', label: 'Marketing & Vouchers', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    ],
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-navy text-white flex flex-col justify-between transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-xl lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Cabecera de Marca con logotipo y nombre */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-gold flex items-center justify-center font-playfair font-bold text-xl border border-gold/30 shadow-sm">
                M
              </div>
              <div className="leading-tight">
                <span className="text-xl font-alex-brush text-gold block">Dra. García</span>
                <span className="text-[10px] font-montserrat tracking-wider text-gray-300 uppercase block">Clínica Dental</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
              aria-label="Cerrar menú"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menú de Navegación por Grupos */}
          <div className="p-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-montserrat font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {group.title}
                </p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-montserrat font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gold/20 text-gold font-semibold shadow-sm border border-gold/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                    </svg>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer del Sidebar con versión y enlace al portal */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between text-[11px] font-montserrat text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Sistema Online
            </span>
            <span className="text-gray-500">v2.4</span>
          </div>
        </div>
      </aside>
    </>
  )
}
