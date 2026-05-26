import React from 'react'
import { ProcedureList, ProcedureTrackingTimeline } from '../../components/admin/procedures'
import { useProcedureTracking } from '../../hooks/useProcedureTracking'

export const ProceduresPage: React.FC = () => {
  const { records, isLoading } = useProcedureTracking()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Procedimientos</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestiona el catálogo de procedimientos y seguimientos
        </p>
      </div>

      <ProcedureList />

      <div>
        <h2 className="text-lg font-playfair text-navy mb-4">Seguimientos</h2>
        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : (
          <ProcedureTrackingTimeline records={records} />
        )}
      </div>
    </div>
  )
}
