import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface ProcedureAnalyticsOptions {
  dateFrom?: string | null
  dateTo?: string | null
  clinicId?: string | null
}

export interface ProcedureAnalytics {
  totalProcedures: number
  proceduresByPopularity: Array<{ name: string; count: number; percentage: number }>
  averageDuration: number
  completionRate: number
}

export function useProcedureAnalytics(options: ProcedureAnalyticsOptions = {}) {
  let { dateFrom, dateTo, clinicId } = options

  if (!dateFrom && !dateTo) {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    dateFrom = from.toISOString().split('T')[0]
    dateTo = to.toISOString().split('T')[0]
  }

  const query = useQuery<ProcedureAnalytics, Error>({
    queryKey: ['procedure-analytics', { dateFrom, dateTo, clinicId }],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          duration_minutes,
          status,
          procedure:procedure_id(name)
        `)
        .limit(1000)

      if (dateFrom) query = query.gte('scheduled_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) query = query.lte('scheduled_at', `${dateTo}T23:59:59.999Z`)
      if (clinicId) query = query.eq('clinic_id', clinicId)

      const { data, error } = await query
      if (error) throw error

      type RawProcAppt = {
        duration_minutes: number
        status: string
        procedure: { name: string } | null
      }
      const appointments = (data ?? []) as unknown as RawProcAppt[]

      const totalProcedures = appointments.length

      const procedureCounts: Record<string, number> = {}
      appointments.forEach(a => {
        const name = a.procedure?.name || 'Unknown'
        procedureCounts[name] = (procedureCounts[name] || 0) + 1
      })

      const maxCount = Math.max(...Object.values(procedureCounts), 1)
      const proceduresByPopularity = Object.entries(procedureCounts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / maxCount) * 100),
        }))
        .sort((a, b) => b.count - a.count)

      const durations = appointments.map(a => a.duration_minutes).filter(d => d > 0)
      const averageDuration = durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : 0

      const completed = appointments.filter(a => a.status === 'completed').length
      const completionRate = totalProcedures > 0
        ? Math.round((completed / totalProcedures) * 100)
        : 0

      return { totalProcedures, proceduresByPopularity, averageDuration, completionRate }
    },
    staleTime: 5 * 60 * 1000,
  })

  return { ...query, data: query.data }
}