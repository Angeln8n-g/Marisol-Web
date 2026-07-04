import { useQuery } from '@tanstack/react-query'
import { availabilityService } from '../services/AvailabilityService'
import type { AvailabilityResult } from '../types'

/**
 * Custom hook for fetching clinic availability data.
 * 
 * Queries the appointment system to determine available slots for a specific clinic
 * within a configurable date range. Used for displaying availability indicators
 * on the interactive map and in clinic detail views.
 * 
 * @param clinicId - The clinic identifier to fetch availability for
 * @param days - Number of days to check for availability (default: 30)
 * @returns Query result with availability data, loading state, and error state
 * 
 * **Validates: Requirements 3.1, 3.2, 3.6**
 * 
 * @example
 * ```tsx
 * const { data, isLoading, isError } = useClinicAvailability('clinic-123', 30)
 * if (data) {
 *   console.log(`Available slots: ${data.available_slots}`)
 * }
 * ```
 */
export function useClinicAvailability(clinicId: string, days: number = 30) {
  return useQuery<AvailabilityResult>({
    queryKey: ['clinic-availability', clinicId, days],
    queryFn: async () => {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      return await availabilityService.getClinicAvailability(
        clinicId,
        startDate,
        endDate
      )
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (Requirement 3.5)
    enabled: !!clinicId, // Only run query when clinicId is provided
  })
}
