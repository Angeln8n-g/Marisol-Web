import React from 'react'
import type { ClinicWorkload } from '../../../types'

interface ClinicWorkloadChartProps {
  workloads: ClinicWorkload[]
}

function getBarColor(percentage: number): string {
  if (percentage <= 50) return 'bg-green-500'
  if (percentage <= 80) return 'bg-yellow-500'
  return 'bg-red-500'
}

export const ClinicWorkloadChart: React.FC<ClinicWorkloadChartProps> = ({ workloads }) => {
  if (workloads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500 font-montserrat">No hay datos de carga laboral</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">
        Carga Laboral por Clínica
      </h3>

      <div className="space-y-4">
        {workloads.map((w) => (
          <div key={w.clinic.id}>
            <div className="flex items-center justify-between text-sm font-montserrat mb-1">
              <span className="text-navy font-medium">{w.clinic.name}</span>
              <span className="text-gray-600">{w.capacity_percentage}%</span>
            </div>

            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(w.capacity_percentage)}`}
                style={{ width: `${Math.min(w.capacity_percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-montserrat">
              <span>{w.confirmed_appointments} confirmadas</span>
              <span>{w.pending_appointments} pendientes</span>
              <span>{w.total_appointments} total</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100 text-xs font-montserrat">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-gray-600">≤ 50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-gray-600">51-80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">&gt; 80%</span>
        </div>
      </div>
    </div>
  )
}
