import { useQuery } from '@tanstack/react-query'
import { availabilityService } from '../services/AvailabilityService'

export function useClinicTimeSlots(
  clinicId: string | undefined,
  date: Date | null,
  durationMinutes: number = 30
) {
  const dateStr = date ? date.toISOString().split('T')[0] : null

  return useQuery({
    queryKey: ['clinic-time-slots', clinicId, dateStr, durationMinutes],
    queryFn: async () => {
      if (!clinicId || !date) return { isOpen: false, slots: [] }
      return availabilityService.getAvailableTimeSlots(clinicId, date, durationMinutes)
    },
    enabled: Boolean(clinicId && date),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useClinicMonthAvailability(
  clinicId: string | undefined,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: ['clinic-month-availability', clinicId, year, month],
    queryFn: async () => {
      if (!clinicId) return {}
      return availabilityService.getMonthDaysStatus(clinicId, year, month)
    },
    enabled: Boolean(clinicId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
