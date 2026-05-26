import React from 'react'
import { useAppointmentStore } from '../../../store/appointmentStore'
import type { AppointmentStatus } from '../../../types'

const statusOptions: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'in_progress', label: 'En Progreso' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'rescheduled', label: 'Reprogramada' },
]

export const AppointmentFilters: React.FC = () => {
  const { filters, setStatusFilter, setDateRangeFilter, clearFilters } =
    useAppointmentStore()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="status-filter" className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">
            Estado
          </label>
          <select
            id="status-filter"
            value={filters.status || ''}
            onChange={(e) =>
              setStatusFilter(
                e.target.value ? (e.target.value as AppointmentStatus) : null
              )
            }
            className="px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date-from" className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">
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
            className="px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <div>
          <label htmlFor="date-to" className="block text-xs font-medium text-gray-600 mb-1 font-montserrat">
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
            className="px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>

        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-montserrat"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  )
}
