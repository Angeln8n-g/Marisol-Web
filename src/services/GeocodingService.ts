import type { GeocodingResult } from '../types'

/**
 * Service for geocoding addresses and reverse geocoding coordinates.
 * Uses the Nominatim API (OpenStreetMap) for geocoding operations.
 * 
 * Note: Nominatim has usage limits. For production, consider using a commercial
 * geocoding service or setting up your own Nominatim instance.
 */
export class GeocodingService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org'
  private readonly userAgent = 'Marisol-Web-Clinic-Management/1.0'
  
  // Rate limiting: Nominatim requires max 1 request per second
  private lastRequestTime = 0
  private readonly minRequestInterval = 1000 // 1 second

  /**
   * Convert an address to geographic coordinates using Nominatim API.
   * 
   * @param address - The full address to geocode
   * @returns Geocoding result with coordinates, formatted address, and confidence level
   * @throws Error if geocoding fails or address is not found
   * 
   * **Validates: Requirements 7.2, 7.4**
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address cannot be empty')
    }

    try {
      // Respect rate limiting
      await this.waitForRateLimit()

      const params = new URLSearchParams({
        q: address.trim(),
        format: 'json',
        addressdetails: '1',
        limit: '1',
      })

      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error('Address not found. Please verify the address and try again.')
      }

      const result = data[0]

      // Determine confidence level based on importance score
      // Nominatim returns importance from 0 to 1
      const importance = parseFloat(result.importance) || 0
      let confidence: 'high' | 'medium' | 'low'
      
      if (importance >= 0.6) {
        confidence = 'high'
      } else if (importance >= 0.3) {
        confidence = 'medium'
      } else {
        confidence = 'low'
      }

      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        confidence,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Geocoding failed: ${error.message}`)
      }
      throw new Error('Geocoding failed: Unknown error')
    }
  }

  /**
   * Reverse geocode coordinates to get a formatted address.
   * 
   * @param latitude - Geographic latitude (-90 to 90)
   * @param longitude - Geographic longitude (-180 to 180)
   * @returns Formatted address string
   * @throws Error if coordinates are invalid or reverse geocoding fails
   * 
   * **Validates: Requirements 7.2, 7.4**
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    // Validate coordinates first
    if (!this.validateCoordinates(latitude, longitude)) {
      throw new Error(
        `Invalid coordinates: latitude must be between -90 and 90, longitude must be between -180 and 180`
      )
    }

    try {
      // Respect rate limiting
      await this.waitForRateLimit()

      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
      })

      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data || data.error) {
        throw new Error(data?.error || 'Location not found for the given coordinates')
      }

      return data.display_name
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Reverse geocoding failed: ${error.message}`)
      }
      throw new Error('Reverse geocoding failed: Unknown error')
    }
  }

  /**
   * Validate that coordinates are within valid geographic ranges.
   * 
   * @param latitude - Geographic latitude to validate
   * @param longitude - Geographic longitude to validate
   * @returns True if coordinates are valid, false otherwise
   * 
   * **Validates: Requirements 7.2**
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    // Check if values are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false
    }

    // Check if values are finite (not NaN, Infinity, or -Infinity)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return false
    }

    // Check valid ranges
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180
  }

  /**
   * Wait to respect rate limiting (1 request per second for Nominatim).
   * 
   * @private
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastRequestTime = Date.now()
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService()
