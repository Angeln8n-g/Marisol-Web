import React from 'react'
import type { ProcedureTracking } from '../../../types'
import { formatDate } from '../../../lib/utils'

interface ProcedureTrackingTimelineProps {
  records: (ProcedureTracking & { patient?: { full_name: string }; procedure?: { name: string } })[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700 border-green-200' },
  on_hold: { label: 'En Espera', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
}

export const ProcedureTrackingTimeline: React.FC<ProcedureTrackingTimelineProps> = ({ records }) => {
  const today = new Date()

  const getFollowupStyle = (nextDate: string | null): string | null => {
    if (!nextDate) return null
    const followup = new Date(nextDate)
    const diffDays = Math.ceil((followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'border-red-400 bg-red-50' // Vencido
    if (diffDays <= 3) return 'border-yellow-400 bg-yellow-50' // Próximo 3 días
    return null
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <p className="text-sm text-gray-500 font-montserrat mt-3">No hay seguimientos de procedimientos</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const statusCfg = statusLabels[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-700' }
        const followupStyle = getFollowupStyle(record.next_followup_date)

        return (
          <div
            key={record.id}
            className={`bg-white rounded-lg border-2 p-4 transition-colors ${followupStyle || 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-navy">
                  {record.procedure?.name || 'Procedimiento'}
                </p>
                {record.patient && (
                  <p className="text-xs text-gray-500 font-montserrat">{record.patient.full_name}</p>
                )}
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs font-montserrat text-gray-500">
              {record.start_date && <span>Inicio: {formatDate(record.start_date)}</span>}
              {record.expected_end_date && <span>Fin estimado: {formatDate(record.expected_end_date)}</span>}
              {record.next_followup_date && (
                <span className={getFollowupStyle(record.next_followup_date) ? 'font-semibold' : ''}>
                  Próximo seguimiento: {formatDate(record.next_followup_date)}
                </span>
              )}
            </div>

            {record.progress_notes && (
              <p className="mt-2 text-xs text-gray-600 font-montserrat border-t border-gray-100 pt-2">
                {record.progress_notes}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
