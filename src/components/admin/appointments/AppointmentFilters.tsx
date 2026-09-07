import React from 'react'
import { useAppointmentStore } from '../../../store/appointmentStore'
import { useClinics } from '../../../hooks/useClinics'
import type { AppointmentStatus } from '../../../types'

const statusOptions: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'in_progress', label: 'En Progreso / En Sillón' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'rescheduled', label: 'Reprogramada' },
]

export const AppointmentFilters: React.FC = () => {
  const {
    filters,
    setClinicFilter,
    setStatusFilter,
    setDateRangeFilter,
    setSearchQuery,
    clearFilters,
  } = useAppointmentStore()

  const { activeClinics } = useClinics()

  const handleQuickToday = () => {
    const today = new Date().toISOString().split('T')[0]
    setDateRangeFilter(today, today)
  }

  const handleQuickWeek = () => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    setDateRangeFilter(
      startOfWeek.toISOString().split('T')[0],
      endOfWeek.toISOString().split('T')[0]
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm space-y-4">
      {/* Top row: search & quick filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de paciente o teléfono..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-montserrat text-navy placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy/10 transition-colors"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {filters.searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-montserrat hidden sm:inline font-medium">Accesos rápidos:</span>
          <button
            type="button"
            onClick={handleQuickToday}
            className="px-3.5 py-2 text-xs font-semibold text-navy bg-gray-100 hover:bg-navy hover:text-white rounded-xl transition-colors font-montserrat shadow-2xs"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleQuickWeek}
            className="px-3.5 py-2 text-xs font-semibold text-navy bg-gray-100 hover:bg-navy hover:text-white rounded-xl transition-colors font-montserrat shadow-2xs"
          >
            Esta Semana
          </button>
        </div>
      </div>

      {/* Second row: select filters */}
      <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-100">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="clinic-filter" className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-montserrat">
            Clínica / Sede
          </label>
          <select
            id="clinic-filter"
            value={filters.clinicId || ''}
            onChange={(e) => setClinicFilter(e.target.value || null)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy/10 font-montserrat font-medium text-navy bg-gray-50 hover:bg-white transition-colors cursor-pointer"
          >
            <option value="">Todas las clínicas</option>
            {activeClinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[180px]">
          <label htmlFor="status-filter" className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-montserrat">
            Estado de Cita
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) =>
              setStatusFilter(
                e.target.value ? (e.target.value as AppointmentStatus) : null
              )
            }
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy/10 font-montserrat font-medium text-navy bg-gray-50 hover:bg-white transition-colors cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date-from" className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-montserrat">
            Desde
          </label>
          <input
            id="date-from"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              setDateRangeFilter(
                e.target.value || null,
                filters.dateTo
              )
            }
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy/10 font-montserrat text-navy bg-gray-50"
          />
        </div>

        <div>
          <label htmlFor="date-to" className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-montserrat">
            Hasta
          </label>
          <input
            id="date-to"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              setDateRangeFilter(
                filters.dateFrom,
                e.target.value || null
              )
            }
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-navy/10 font-montserrat text-navy bg-gray-50"
          />
        </div>

        {(filters.clinicId || filters.status || filters.dateFrom || filters.dateTo || filters.searchQuery) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors font-montserrat"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  )
}
