import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface AppointmentConflictItem {
  id: string
  scheduled_at: string
  duration_minutes: number
  status: string
  patient?: {
    id?: string
    full_name?: string
    phone?: string
  } | null
  procedure?: {
    id?: string
    name?: string
  } | null
}

export interface UseAppointmentConflictsParams {
  clinicId?: string | null
  scheduledAt?: string | null
  durationMinutes?: number
  excludeAppointmentId?: string | null
  enabled?: boolean
}

export function useAppointmentConflicts({
  clinicId,
  scheduledAt,
  durationMinutes = 45,
  excludeAppointmentId,
  enabled = true,
}: UseAppointmentConflictsParams) {
  const isValidDate = scheduledAt && !isNaN(new Date(scheduledAt).getTime())
  const isQueryEnabled = Boolean(enabled && clinicId && isValidDate)

  const query = useQuery({
    queryKey: ['appointment-conflicts', clinicId, scheduledAt, durationMinutes, excludeAppointmentId],
    queryFn: async (): Promise<AppointmentConflictItem[]> => {
      if (!clinicId || !scheduledAt) return []

      const targetDate = new Date(scheduledAt)
      if (isNaN(targetDate.getTime())) return []

      const targetStart = targetDate.getTime()
      const targetEnd = targetStart + (durationMinutes || 45) * 60 * 1000

      // Get appointments around the same date (start of day to end of day)
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0).toISOString()
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999).toISOString()

      let q = supabase
        .from('appointments')
        .select('id, scheduled_at, duration_minutes, status, patient:patients(id, full_name, phone), procedure:procedures(id, name)')
        .eq('clinic_id', clinicId)
        .neq('status', 'cancelled')
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd)

      if (excludeAppointmentId) {
        q = q.neq('id', excludeAppointmentId)
      }

      const { data, error } = await q
      if (error) throw error

      const list = (data || []) as unknown as AppointmentConflictItem[]

      // Filter appointments that overlap in time
      const overlapping = list.filter((apt) => {
        const aptStart = new Date(apt.scheduled_at).getTime()
        const aptDuration = apt.duration_minutes || 45
        const aptEnd = aptStart + aptDuration * 60 * 1000

        return targetStart < aptEnd && aptStart < targetEnd
      })

      return overlapping
    },
    enabled: isQueryEnabled,
    staleTime: 10 * 1000,
  })

  return {
    conflicts: query.data || [],
    hasConflict: (query.data?.length ?? 0) > 0,
    isLoading: query.isLoading && isQueryEnabled,
    refetch: query.refetch,
  }
}
