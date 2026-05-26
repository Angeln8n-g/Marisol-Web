import React from 'react'
import type { ProcedureTracking } from '../../../types'
import { formatDate } from '../../../lib/utils'

interface AlertsPanelProps {
  records: (ProcedureTracking & { patient?: { full_name: string }; procedure?: { name: string } })[]
  overdueRecords: ProcedureTracking[]
  upcomingRecords: ProcedureTracking[]
  isLoading?: boolean
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  records,
  overdueRecords,
  upcomingRecords,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">
        Alertas de Seguimiento
      </h3>

      {records.length === 0 ? (
        <div className="text-center py-8">
          <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-gray-500 font-montserrat">No hay alertas pendientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {overdueRecords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 font-montserrat mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Vencidos ({overdueRecords.length})
              </p>
              <div className="space-y-2">
                {overdueRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-md bg-red-50 border border-red-200">
                    <p className="text-sm font-medium text-red-800">{r.procedure?.name || 'Procedimiento'}</p>
                    <p className="text-xs text-red-600 font-montserrat mt-0.5">
                      {r.patient?.full_name} · Seguimiento: {formatDate(r.next_followup_date!)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingRecords.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-yellow-700 font-montserrat mb-2 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Próximos 3 días ({upcomingRecords.length})
              </p>
              <div className="space-y-2">
                {upcomingRecords.map((r) => (
                  <div key={r.id} className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800">{r.procedure?.name || 'Procedimiento'}</p>
                    <p className="text-xs text-yellow-600 font-montserrat mt-0.5">
                      {r.patient?.full_name} · Seguimiento: {formatDate(r.next_followup_date!)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overdueRecords.length === 0 && upcomingRecords.length === 0 && (
            <p className="text-sm text-gray-500 font-montserrat text-center py-4">
              Todos los seguimientos están al día
            </p>
          )}
        </div>
      )}
    </div>
  )
}
