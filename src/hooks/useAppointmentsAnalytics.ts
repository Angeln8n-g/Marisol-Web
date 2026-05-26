import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface AppointmentAnalyticsOptions {
  dateFrom?: string | null
  dateTo?: string | null
  clinicId?: string | null
  procedureId?: string | null
}

export interface AppointmentAnalytics {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  pendingAppointments: number
  confirmedAppointments: number
  inProgressAppointments: number
  appointmentsByStatus: Record<string, number>
  appointmentsByDay: Array<{ date: string; count: number }>
  appointmentsByClinic: Array<{ clinicName: string; count: number }>
  appointmentsByProcedure: Array<{ procedureName: string; count: number }>
  averageDuration: number
}

export function useAppointmentsAnalytics(options: AppointmentAnalyticsOptions = {}) {
  let { dateFrom, dateTo, clinicId, procedureId } = options

  if (!dateFrom && !dateTo) {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    dateFrom = from.toISOString().split('T')[0]
    dateTo = to.toISOString().split('T')[0]
  }

  const query = useQuery<AppointmentAnalytics, Error>({
    queryKey: ['appointments-analytics', { dateFrom, dateTo, clinicId, procedureId }],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          scheduled_at,
          status,
          duration_minutes,
          clinic:clinic_id(name),
          procedure:procedure_id(name)
        `)
        .limit(1000)

      if (dateFrom) query = query.gte('scheduled_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) query = query.lte('scheduled_at', `${dateTo}T23:59:59.999Z`)
      if (clinicId) query = query.eq('clinic_id', clinicId)
      if (procedureId) query = query.eq('procedure_id', procedureId)

      const { data, error } = await query

      if (error) throw error

      type RawAppointment = {
        scheduled_at: string
        status: string
        duration_minutes: number
        clinic: { name: string } | null
        procedure: { name: string } | null
      }
      const appointments = (data ?? []) as unknown as RawAppointment[]

      // Calculate basic stats
      const totalAppointments = appointments.length
      const completedAppointments = appointments.filter(a => a.status === 'completed').length
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length
      const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length
      const inProgressAppointments = appointments.filter(a => a.status === 'in_progress').length

      // Group by status
      const appointmentsByStatus: Record<string, number> = {}
      appointments.forEach(appointment => {
        const status = appointment.status
        appointmentsByStatus[status] = (appointmentsByStatus[status] || 0) + 1
      })

      // Group by day (for the last 30 days)
      const appointmentsByDay: Array<{ date: string; count: number }> = []
      const dayCounts: Record<string, number> = {}
      
      appointments.forEach(appointment => {
        const date = appointment.scheduled_at.split('T')[0] // Extract YYYY-MM-DD
        dayCounts[date] = (dayCounts[date] || 0) + 1
      })
      
      Object.keys(dayCounts).forEach(date => {
        appointmentsByDay.push({ date, count: dayCounts[date] })
      })
      
      // Sort by date
      appointmentsByDay.sort((a, b) => a.date.localeCompare(b.date))

      // Group by clinic
      const appointmentsByClinicMap: Record<string, number> = {}
      appointments.forEach(appointment => {
        const clinicName = appointment.clinic?.name || 'Unknown Clinic'
        appointmentsByClinicMap[clinicName] = (appointmentsByClinicMap[clinicName] || 0) + 1
      })
      
      const appointmentsByClinic = Object.entries(appointmentsByClinicMap)
        .map(([clinicName, count]) => ({ clinicName, count }))
        .sort((a, b) => b.count - a.count)

      // Group by procedure
      const appointmentsByProcedureMap: Record<string, number> = {}
      appointments.forEach(appointment => {
        const procedureName = appointment.procedure?.name || 'Unknown Procedure'
        appointmentsByProcedureMap[procedureName] = (appointmentsByProcedureMap[procedureName] || 0) + 1
      })
      
      const appointmentsByProcedure = Object.entries(appointmentsByProcedureMap)
        .map(([procedureName, count]) => ({ procedureName, count }))
        .sort((a, b) => b.count - a.count)

      // Calculate average duration
      const totalDuration = appointments.reduce((sum, appointment) => {
        return sum + (appointment.duration_minutes || 0)
      }, 0)
      const averageDuration = totalAppointments > 0 ? totalDuration / totalAppointments : 0

      return {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        pendingAppointments,
        confirmedAppointments,
        inProgressAppointments,
        appointmentsByStatus,
        appointmentsByDay,
        appointmentsByClinic,
        appointmentsByProcedure,
        averageDuration
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    ...query,
    data: query.data,
  }
}