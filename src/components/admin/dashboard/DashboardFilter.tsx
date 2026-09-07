import React from 'react'
import type { Clinic } from '../../../types'
import type { Procedure } from '../../../types'

export interface DashboardFilters {
  dateFrom: string | null
  dateTo: string | null
  clinicId: string | null
  procedureId: string | null
}

interface DashboardFilterProps {
  filters: DashboardFilters
  clinics: Clinic[]
  procedures: Procedure[]
  onFilterChange: (filters: DashboardFilters) => void
}

const DATE_PRESETS = [
  { label: 'Hoy', value: 'today' },
  { label: '7 días', value: 'last7' },
  { label: '30 días', value: 'last30' },
  { label: 'Este mes', value: 'thisMonth' },
  { label: 'Personalizado', value: 'custom' },
]

function getPresetRange(preset: string): { dateFrom: string; dateTo: string } | null {
  const now = new Date()
  const end = now.toISOString().split('T')[0]

  switch (preset) {
    case 'today':
      return { dateFrom: end, dateTo: end }
    case 'last7': {
      const start = new Date(now)
      start.setDate(start.getDate() - 7)
      return { dateFrom: start.toISOString().split('T')[0], dateTo: end }
    }
    case 'last30': {
      const start = new Date(now)
      start.setDate(start.getDate() - 30)
      return { dateFrom: start.toISOString().split('T')[0], dateTo: end }
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { dateFrom: start.toISOString().split('T')[0], dateTo: end }
    }
    default:
      return null
  }
}

export const DashboardFilter: React.FC<DashboardFilterProps> = ({
  filters,
  clinics,
  procedures,
  onFilterChange,
}) => {
  const [activePreset, setActivePreset] = React.useState<string>('last30')

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset)
    const range = getPresetRange(preset)
    if (range) {
      onFilterChange({ ...filters, dateFrom: range.dateFrom, dateTo: range.dateTo })
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm transition-all duration-200">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Pastillas de Período Temporal */}
        <div className="flex items-center gap-1 bg-gray-100/90 rounded-xl p-1 border border-gray-200/40">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`px-3 py-1.5 text-xs font-montserrat font-medium rounded-lg transition-all whitespace-nowrap ${
                activePreset === preset.value
                  ? 'bg-white text-navy shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Rango Personalizado */}
        {activePreset === 'custom' && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200/60">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || null })}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg font-montserrat focus:outline-none focus:ring-1 focus:ring-gold bg-white text-navy"
            />
            <span className="text-xs text-gray-400 font-montserrat">a</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || null })}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg font-montserrat focus:outline-none focus:ring-1 focus:ring-gold bg-white text-navy"
            />
          </div>
        )}

        {/* Selectores de Sede y Procedimiento */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={filters.clinicId || ''}
              onChange={(e) => onFilterChange({ ...filters, clinicId: e.target.value || null })}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs border border-gray-200 rounded-xl font-montserrat font-medium text-navy focus:outline-none focus:ring-2 focus:ring-navy/10 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
            >
              <option value="">Todas las Clínicas</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={filters.procedureId || ''}
              onChange={(e) => onFilterChange({ ...filters, procedureId: e.target.value || null })}
              className="appearance-none pl-3.5 pr-8 py-2 text-xs border border-gray-200 rounded-xl font-montserrat font-medium text-navy focus:outline-none focus:ring-2 focus:ring-navy/10 bg-gray-50 hover:bg-white transition-colors cursor-pointer"
            >
              <option value="">Todos los Procedimientos</option>
              {procedures.map((proc) => (
                <option key={proc.id} value={proc.id}>{proc.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}