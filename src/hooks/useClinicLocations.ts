import { useQuery } from '@tanstack/react-query'
import { locationService } from '../lib/services/LocationService'
import type { Clinic, ClinicWithAvailability } from '../types'

/**
 * Options for fetching clinic locations
 */
export interface UseClinicLocationsOptions {
  /**
   * Whether to include inactive clinics in the results
   * @default false
   */
  includeInactive?: boolean
  
  /**
   * Whether to include availability data (slots, open status)
   * @default true
   */
  includeAvailability?: boolean
}

/**
 * Custom hook for fetching clinic location data.
 * 
 * Queries the database to retrieve clinic locations with optional filtering
 * and availability information. Configured with 5-minute stale time and
 * automatic refresh to ensure data freshness.
 * 
 * @param options - Configuration options for the query
 * @returns Query result with clinic data, loading state, and error state
 * 
 * **Validates: Requirements 2.1, 2.2, 6.5**
 * 
 * @example
 * ```tsx
 * // Fetch active clinics with availability (default)
 * const { data, isLoading } = useClinicLocations()
 * 
 * // Fetch all clinics including inactive, without availability
 * const { data } = useClinicLocations({ 
 *   includeInactive: true, 
 *   includeAvailability: false 
 * })
 * ```
 */
export function useClinicLocations(options?: UseClinicLocationsOptions) {
  const { includeInactive = false, includeAvailability = true } = options || {}

  return useQuery<Clinic[] | ClinicWithAvailability[]>({
    queryKey: ['clinics', { includeInactive, includeAvailability }],
    queryFn: async () => {
      if (includeAvailability) {
        // Fetch clinics with availability data
        return await locationService.getClinicsWithAvailability(includeInactive)
      } else {
        // Fetch basic clinic data without availability
        return await locationService.getClinics(includeInactive)
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (Requirement 6.5)
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes (Requirement 6.5)
  })
}
