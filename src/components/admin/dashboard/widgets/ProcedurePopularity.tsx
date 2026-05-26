import React from 'react'
import { useProcedureAnalytics } from '../../../../hooks/useProcedureAnalytics'

export const ProcedurePopularity: React.FC = () => {
  const { data, isLoading, error } = useProcedureAnalytics()

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

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">Procedure Popularity</h3>
        <p className="text-red-500 text-sm font-montserrat">Error loading procedure data</p>
      </div>
    )
  }

  if (!data || data.proceduresByPopularity.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">Procedure Popularity</h3>
        <p className="text-gray-500 text-sm font-montserrat">No procedure data available</p>
      </div>
    )
  }

  const { totalProcedures, proceduresByPopularity, averageDuration, completionRate } = data

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-navy font-montserrat mb-2">Procedure Popularity</h3>

      <div className="flex items-center justify-between text-sm mb-4">
        <p className="font-montserrat text-gray-500">Total: {totalProcedures}</p>
        <p className="font-montserrat text-gray-500">
          Avg Duration: {averageDuration}m
        </p>
        <p className="font-montserrat text-gray-500">
          Completion: {completionRate}%
        </p>
      </div>

      <div className="space-y-2">
        {proceduresByPopularity.slice(0, 10).map((proc) => (
          <div key={proc.name}>
            <div className="flex items-center justify-between text-sm mb-0.5">
              <span className="text-navy font-montserrat truncate flex-1">{proc.name}</span>
              <span className="text-gray-500 font-montserrat ml-2">{proc.count}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gold transition-all duration-500"
                style={{ width: `${proc.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}