import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

interface RevenueAnalyticsOptions {
  dateFrom?: string | null
  dateTo?: string | null
  clinicId?: string | null
  procedureId?: string | null
}

export interface RevenueAnalytics {
  totalRevenue: number
  revenueByProcedure: Array<{ procedureName: string; revenue: number }>
  revenueByClinic: Array<{ clinicName: string; revenue: number }>
  revenueByDay: Array<{ date: string; revenue: number }>
  averageRevenuePerAppointment: number
  totalAppointmentsWithRevenue: number
}

export function useRevenueAnalytics(options: RevenueAnalyticsOptions = {}) {
  let { dateFrom, dateTo, clinicId, procedureId } = options

  if (!dateFrom && !dateTo) {
    const to = new Date()
    const from = new Date()
    from.setDate(from.getDate() - 30)
    dateFrom = from.toISOString().split('T')[0]
    dateTo = to.toISOString().split('T')[0]
  }

  const query = useQuery<RevenueAnalytics, Error>({
    queryKey: ['revenue-analytics', { dateFrom, dateTo, clinicId, procedureId }],
    queryFn: async () => {
      let appointmentsQuery = supabase
        .from('appointments')
        .select(`
          scheduled_at,
          procedure_id,
          clinic:clinic_id(name),
          procedure:procedure_id(name)
        `)
        .limit(1000)

      if (dateFrom) appointmentsQuery = appointmentsQuery.gte('scheduled_at', `${dateFrom}T00:00:00.000Z`)
      if (dateTo) appointmentsQuery = appointmentsQuery.lte('scheduled_at', `${dateTo}T23:59:59.999Z`)
      if (clinicId) appointmentsQuery = appointmentsQuery.eq('clinic_id', clinicId)
      if (procedureId) appointmentsQuery = appointmentsQuery.eq('procedure_id', procedureId)

      const { data: appointmentsData, error: appointmentsError } = await appointmentsQuery
      if (appointmentsError) throw appointmentsError

      type RawRevenueAppt = {
        scheduled_at: string
        procedure_id: string
        clinic: { name: string } | null
        procedure: { name: string } | null
      }
      const appointments = (appointmentsData ?? []) as unknown as RawRevenueAppt[]

      const { data: procedurePricesData, error: procedurePricesError } = await supabase
        .from('procedure_prices')
        .select('procedure_id, price, effective_from, effective_to')

      if (procedurePricesError) throw procedurePricesError

      type PriceEntry = {
        procedure_id: string
        price: number
        effective_from: string
        effective_to: string | null
      }
      const procedurePrices = (procedurePricesData ?? []) as unknown as PriceEntry[]

      const getProcedurePrice = (procId: string, dateString: string): number => {
        const relevantPrices = procedurePrices
          .filter(price => price.procedure_id === procId)
          .filter(price => {
            const effectiveFrom = new Date(price.effective_from)
            const effectiveTo = price.effective_to ? new Date(price.effective_to) : null
            const date = new Date(dateString)
            if (effectiveTo) {
              return date >= effectiveFrom && date <= effectiveTo
            }
            return date >= effectiveFrom
          })

        relevantPrices.sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())
        return relevantPrices[0]?.price ?? 0
      }

      let totalRevenue = 0
      const revenueByProcedureMap: Record<string, number> = {}
      const revenueByClinicMap: Record<string, number> = {}
      const revenueByDayMap: Record<string, number> = {}
      let appointmentsWithRevenue = 0

      for (const appointment of appointments) {
        const price = getProcedurePrice(appointment.procedure_id, appointment.scheduled_at)
        if (price <= 0) continue

        appointmentsWithRevenue++
        totalRevenue += price

        const procedureName = appointment.procedure?.name || 'Unknown Procedure'
        revenueByProcedureMap[procedureName] = (revenueByProcedureMap[procedureName] || 0) + price

        const clinicName = appointment.clinic?.name || 'Unknown Clinic'
        revenueByClinicMap[clinicName] = (revenueByClinicMap[clinicName] || 0) + price

        const date = appointment.scheduled_at.split('T')[0]
        revenueByDayMap[date] = (revenueByDayMap[date] || 0) + price
      }

      const revenueByProcedure = Object.entries(revenueByProcedureMap)
        .map(([procedureName, revenue]) => ({ procedureName, revenue }))
        .sort((a, b) => b.revenue - a.revenue)

      const revenueByClinic = Object.entries(revenueByClinicMap)
        .map(([clinicName, revenue]) => ({ clinicName, revenue }))
        .sort((a, b) => b.revenue - a.revenue)

      const revenueByDay = Object.entries(revenueByDayMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const averageRevenuePerAppointment = appointmentsWithRevenue > 0
        ? totalRevenue / appointmentsWithRevenue
        : 0

      return {
        totalRevenue,
        revenueByProcedure,
        revenueByClinic,
        revenueByDay,
        averageRevenuePerAppointment,
        totalAppointmentsWithRevenue: appointmentsWithRevenue,
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  return {
    ...query,
    data: query.data,
  }
}