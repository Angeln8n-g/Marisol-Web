import React from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

interface ChartBar {
  label: string
  count: number
  percentage: number
}

interface AppointmentsChartProps {
  data: ChartBar[]
  period: 'day' | 'week' | 'month'
  onPeriodChange: (period: 'day' | 'week' | 'month') => void
  isLoading?: boolean
}

export const AppointmentsChart: React.FC<AppointmentsChartProps> = ({
  data,
  period,
  onPeriodChange,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat">
          Citas por Período
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                period === p
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-6 w-6 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500 font-montserrat">No hay datos para este período</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis dataKey="label" tickFormatter={(label) => {
                // Format label based on period
                if (period === 'day') {
                  // Show full day name for day view
                  const dayMap: Record<string, string> = {
                    'Lun': 'Lunes',
                    'Mar': 'Martes',
                    'Mié': 'Miércoles',
                    'Jue': 'Jueves',
                    'Vie': 'Viernes',
                    'Sáb': 'Sábado',
                    'Dom': 'Domingo'
                  }
                  return dayMap[label] || label
                }
                return label
              }} />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="count" fill="#FFD700" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}