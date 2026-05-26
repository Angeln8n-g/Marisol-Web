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

export const DashboardFilter: React.FC<DashboardFilterProps> = ({ filters, clinics, procedures, onFilterChange }) => {
  const [activePreset, setActivePreset] = React.useState<string>('last30')

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset)
    const range = getPresetRange(preset)
    if (range) {
      onFilterChange({ ...filters, dateFrom: range.dateFrom, dateTo: range.dateTo })
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activePreset === preset.value
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {activePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value || null })}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md font-montserrat focus:outline-none focus:border-gold"
            />
            <span className="text-xs text-gray-400 font-montserrat">a</span>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value || null })}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md font-montserrat focus:outline-none focus:border-gold"
            />
          </div>
        )}

        <select
          value={filters.clinicId || ''}
          onChange={(e) => onFilterChange({ ...filters, clinicId: e.target.value || null })}
          className="px-3 py-1 text-xs border border-gray-300 rounded-md font-montserrat focus:outline-none focus:border-gold bg-white"
        >
          <option value="">Todas las Clínicas</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
          ))}
        </select>

        <select
          value={filters.procedureId || ''}
          onChange={(e) => onFilterChange({ ...filters, procedureId: e.target.value || null })}
          className="px-3 py-1 text-xs border border-gray-300 rounded-md font-montserrat focus:outline-none focus:border-gold bg-white"
        >
          <option value="">Todos los Procedimientos</option>
          {procedures.map((proc) => (
            <option key={proc.id} value={proc.id}>{proc.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}