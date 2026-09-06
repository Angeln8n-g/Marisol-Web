import React, { useState } from 'react'
import {
  ProcedureList,
  ProcedureTrackingTimeline,
  ProfitabilityOverviewHeader,
  ProcedureProfitabilityModal,
} from '../../components/admin/procedures'
import { useProcedureTracking } from '../../hooks/useProcedureTracking'
import { useProceduresProfitability } from '../../hooks/useProcedureProfitability'
import type { Procedure } from '../../types'

export const ProceduresPage: React.FC = () => {
  const { records, isLoading: isTrackingLoading } = useProcedureTracking()
  const { clinicKpis, isLoading: isProfitabilityLoading } = useProceduresProfitability()
  const [selectedSimProcedure, setSelectedSimProcedure] = useState<Procedure | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-playfair text-navy">Procedimientos & Unit Economics</h1>
        <p className="text-sm text-gray-600 font-montserrat mt-1">
          Gestión clínica de servicios, bandejas de instrumental, rentabilidad neta por sillón y seguimiento
        </p>
      </div>

      {/* KPI Overview de Rentabilidad Odontológica */}
      <ProfitabilityOverviewHeader
        kpis={clinicKpis}
        isLoading={isProfitabilityLoading}
        onSelectProcedure={(prof) => setSelectedSimProcedure(prof.procedure)}
      />

      <ProcedureList onSimulateProfitability={(proc) => setSelectedSimProcedure(proc)} />

      <div>
        <h2 className="text-lg font-playfair text-navy mb-4">Seguimientos</h2>
        {isTrackingLoading ? (
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

      {/* Modal interactivo de Unit Economics al hacer clic en los KPIs */}
      <ProcedureProfitabilityModal
        isOpen={Boolean(selectedSimProcedure)}
        onClose={() => setSelectedSimProcedure(null)}
        procedure={selectedSimProcedure}
      />
    </div>
  )
}
