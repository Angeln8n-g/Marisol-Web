import { useMutation } from '@tanstack/react-query'
import { geocodingService } from '../services/GeocodingService'
import type { GeocodingResult } from '../types'

/**
 * Custom hook for geocoding addresses to geographic coordinates.
 * 
 * Uses the GeocodingService to convert an address string into
 * latitude/longitude coordinates with a formatted address and confidence level.
 * 
 * @returns Mutation object with geocode function and loading/error states
 * 
 * **Validates: Requirements 7.4**
 * 
 * @example
 * ```tsx
 * const { mutate: geocode, isPending, error, data } = useGeocode()
 * 
 * const handleGeocode = () => {
 *   geocode('123 Main St, City, Country', {
 *     onSuccess: (result) => {
 *       console.log('Coordinates:', result.latitude, result.longitude)
 *     },
 *     onError: (error) => {
 *       console.error('Geocoding failed:', error)
 *     }
 *   })
 * }
 * ```
 */
export function useGeocode() {
  return useMutation<GeocodingResult, Error, string>({
    mutationFn: async (address: string) => {
      return await geocodingService.geocodeAddress(address)
    },
  })
}
