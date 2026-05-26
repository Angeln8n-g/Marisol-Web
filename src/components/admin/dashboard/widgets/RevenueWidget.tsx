import React from 'react'
import { useRevenueAnalytics } from '../../../../hooks/useRevenueAnalytics'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface RevenueWidgetProps {
  dateFrom?: string | null
  dateTo?: string | null
  clinicId?: string | null
}

export const RevenueWidget: React.FC<RevenueWidgetProps> = ({ dateFrom, dateTo, clinicId }) => {
  const { data, isLoading, error } = useRevenueAnalytics({
    dateFrom,
    dateTo,
    clinicId
  })

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
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">
          Revenue Overview
        </h3>
        <p className="text-red-500 text-sm font-montserrat">Error loading revenue data</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-4">
          Revenue Overview
        </h3>
        <p className="text-gray-500 text-sm font-montserrat">No revenue data available</p>
      </div>
    )
  }

  const { totalRevenue, revenueByDay, averageRevenuePerAppointment } = data

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-navy font-montserrat mb-2">
          Revenue Overview
        </h3>
        <div className="flex items-center justify-between text-sm">
          <p className="font-montserrat">Total Revenue</p>
          <p className="font-playfair font-bold text-navy">DOP {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
          <p>Average per Appointment</p>
          <p>DOP {averageRevenuePerAppointment.toLocaleString()}</p>
        </div>
      </div>

      <div className="h-48">
        {revenueByDay.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={revenueByDay}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => {
                // Format date to show only day/month for readability
                const d = new Date(date)
                return `${d.getDate()}/${d.getMonth() + 1}`
              }} />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="revenue" stroke="#FFD700" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 text-sm font-montserrat py-8">
            No revenue data for the selected period
          </p>
        )}
      </div>
    </div>
  )
}