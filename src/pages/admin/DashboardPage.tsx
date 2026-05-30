import React, { useState, useEffect, useMemo, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClinics } from '../../hooks/useClinics'
import { useProcedures } from '../../hooks/useProcedures'
import { useProcedureTracking, generateFollowupAlerts } from '../../hooks/useProcedureTracking'
import { useAppointmentsAnalytics } from '../../hooks/useAppointmentsAnalytics'
import { useRevenueAnalytics } from '../../hooks/useRevenueAnalytics'
import { StatsCards, defaultStatIcons } from '../../components/admin/dashboard'
import { AppointmentsChart } from '../../components/admin/dashboard/AppointmentsChart'
import { AlertsPanel } from '../../components/admin/dashboard/AlertsPanel'
import { ClinicWorkloadChart } from '../../components/admin/clinics/ClinicWorkloadChart'
import { DashboardFilter } from '../../components/admin/dashboard/DashboardFilter'
import type { DashboardFilters } from '../../components/admin/dashboard/DashboardFilter'
import { RevenueWidget } from '../../components/admin/dashboard/widgets/RevenueWidget'
import { PatientAnalytics } from '../../components/admin/dashboard/widgets/PatientAnalytics'
import { ProcedurePopularity } from '../../components/admin/dashboard/widgets/ProcedurePopularity'
import { exportToCSV } from '../../lib/exportUtils'
import type { ClinicWorkload } from '../../types'

// Memoizar componentes pesados para mejor rendimiento
const MemoizedStatsCards = memo(StatsCards)
const MemoizedAppointmentsChart = memo(AppointmentsChart)
const MemoizedAlertsPanel = memo(AlertsPanel)
const MemoizedClinicWorkloadChart = memo(ClinicWorkloadChart)
const MemoizedRevenueWidget = memo(RevenueWidget)
const MemoizedPatientAnalytics = memo(PatientAnalytics)
const MemoizedProcedurePopularity = memo(ProcedurePopularity)

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { calculateClinicWorkloads, clinics } = useClinics()
  const { procedures } = useProcedures(0, 200)
  const { records, isLoading: trackingLoading } = useProcedureTracking()
  const [workloads, setWorkloads] = useState<ClinicWorkload[]>([])
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day')

  const [filters, setFilters] = useState<DashboardFilters>({
    dateFrom: null,
    dateTo: null,
    clinicId: null,
    procedureId: null,
  })

  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointmentsAnalytics({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    clinicId: filters.clinicId,
    procedureId: filters.procedureId,
  })
  const { data: revenueData, isLoading: revenueLoading } = useRevenueAnalytics({
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    clinicId: filters.clinicId,
    procedureId: filters.procedureId,
  })

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0]
      const result = await calculateClinicWorkloads(today, 20)
      setWorkloads(result)
    }
    load()
  }, [calculateClinicWorkloads])

  // Memoizar cálculos de alertas
  const { overdueRecords, upcomingRecords } = useMemo(() => {
    const today = new Date()
    const overdue = generateFollowupAlerts(records, -1).filter((r) => {
      if (!r.next_followup_date) return false
      return new Date(r.next_followup_date) < today
    })
    const upcoming = generateFollowupAlerts(records, 3).filter((r) => {
      if (!r.next_followup_date) return false
      const d = new Date(r.next_followup_date)
      return d >= today
    })
    return { overdueRecords: overdue, upcomingRecords: upcoming }
  }, [records])

  const handleExport = () => {
    const exportData = [
      ...(appointmentsData?.appointmentsByDay.map(d => ({
        date: d.date,
        appointments: d.count,
      })) ?? []),
    ]
    exportToCSV(exportData, `dashboard-${new Date().toISOString().split('T')[0]}`)
  }

  // Memoizar stats para evitar recálculos innecesarios
  const stats = useMemo(() => [
    {
      label: 'Citas',
      value: appointmentsData?.totalAppointments || '—',
      icon: defaultStatIcons.appointments,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      onClick: () => navigate('/admin/appointments'),
    },
    {
      label: 'Ingresos',
      value: revenueData?.totalRevenue !== undefined ? `DOP ${revenueData.totalRevenue.toLocaleString()}` : '—',
      icon: defaultStatIcons.procedures,
      color: 'bg-green-50 text-green-700 border-green-200',
      onClick: () => navigate('/admin/appointments'),
    },
    {
      label: 'Pendientes',
      value: appointmentsData?.pendingAppointments || '—',
      icon: defaultStatIcons.pending,
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      onClick: () => navigate('/admin/appointments'),
    },
    {
      label: 'Seguimientos',
      value: overdueRecords.length + upcomingRecords.length || '—',
      icon: defaultStatIcons.followups,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      onClick: () => navigate('/admin/appointments'),
    },
  ], [appointmentsData, revenueData, overdueRecords.length, upcomingRecords.length, navigate])

  // Memoizar datos del gráfico
  const chartData = useMemo(() => {
    if (!appointmentsData?.appointmentsByDay) {
      return Array.from({ length: 6 }, (_, i) => ({
        label: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][i],
        count: 0,
        percentage: 0,
      }))
    }
    
    const maxCount = Math.max(...appointmentsData.appointmentsByDay.map((d) => d.count), 1)
    return appointmentsData.appointmentsByDay.map((day) => ({
      label: new Date(day.date).toLocaleDateString('es-DO', { weekday: 'short' }),
      count: day.count,
      percentage: Math.round((day.count / maxCount) * 100),
    }))
  }, [appointmentsData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-playfair text-navy">Panel de Control</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-1">
            Resumen general de la clínica
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 text-xs font-montserrat font-medium text-navy bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <DashboardFilter
        filters={filters}
        clinics={clinics}
        procedures={procedures}
        onFilterChange={setFilters}
      />

      <MemoizedStatsCards stats={stats} isLoading={appointmentsLoading || revenueLoading} />

      <div className="grid lg:grid-cols-2 gap-6">
        <MemoizedAppointmentsChart
          data={chartData}
          period={chartPeriod}
          onPeriodChange={setChartPeriod}
          isLoading={appointmentsLoading}
        />
        <MemoizedAlertsPanel
          records={records}
          overdueRecords={overdueRecords}
          upcomingRecords={upcomingRecords}
          isLoading={trackingLoading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <MemoizedRevenueWidget />
        <MemoizedPatientAnalytics />
        <MemoizedProcedurePopularity />
      </div>

      <MemoizedClinicWorkloadChart workloads={workloads} />
    </div>
  )
}