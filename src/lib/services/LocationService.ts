// src/lib/services/LocationService.ts

import { supabase } from '../supabase'
import { CreateClinicSchema, UpdateClinicSchema } from '../schemas'
import { availabilityService } from '../../services/AvailabilityService'
import type {
  Clinic,
  ClinicWithAvailability,
  CreateClinicDTO,
  UpdateClinicDTO,
} from '../../types'

/**
 * LocationService handles all clinic location management operations
 * including CRUD operations, validation, and coordinate consistency checks.
 * 
 * **Implements: Requirements 1.1, 1.2, 1.3, 1.4, 5.1, 5.2, 5.3, 7.1, 7.3**
 */
export class LocationService {
  /**
   * Fetch clinics without availability data (lightweight query)
   * 
   * **Implements: Requirements 1.1, 5.1, 5.2**
   * 
   * @param includeInactive - Whether to include inactive clinics
   * @returns Promise resolving to array of clinics
   * @throws Error if database query fails
   */
  async getClinics(includeInactive: boolean = false): Promise<Clinic[]> {
    let query = supabase
      .from('clinics')
      .select('*')
      .eq('is_deleted', false)

    // Filter by active status if not including inactive
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: clinics, error } = await query.order('name')

    if (error) {
      throw new Error(`Failed to fetch clinics: ${error.message}`)
    }

    return (clinics || []) as unknown as Clinic[]
  }

  /**
   * Fetch all active clinics with availability data
   * 
   * **Implements: Requirements 1.1, 5.1, 5.2, 3.1, 3.2, 3.5**
   * 
   * @param includeInactive - Whether to include inactive clinics
   * @returns Promise resolving to array of clinics with availability information
   * @throws Error if database query fails
   */
  async getClinicsWithAvailability(includeInactive: boolean = false): Promise<ClinicWithAvailability[]> {
    // 1. Fetch clinics from Supabase
    let query = supabase
      .from('clinics')
      .select('*')
      .eq('is_deleted', false)

    // Filter by active status if not including inactive
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: clinics, error } = await query.order('name')

    if (error) {
      throw new Error(`Failed to fetch clinics: ${error.message}`)
    }

    if (!clinics || clinics.length === 0) {
      return []
    }

    // 2. For each clinic, query availability data from AvailabilityService
    const clinicsWithAvailability: ClinicWithAvailability[] = await Promise.all(
      (clinics as Clinic[]).map(async (clinic) => {
        try {
          // Calculate date ranges for availability checks
          const now = new Date()
          const sevenDaysLater = new Date()
          sevenDaysLater.setDate(now.getDate() + 7)
          const thirtyDaysLater = new Date()
          thirtyDaysLater.setDate(now.getDate() + 30)

          // Query 7-day and 30-day availability
          const [availability7d, availability30d] = await Promise.all([
            availabilityService.getClinicAvailability(clinic.id, now, sevenDaysLater),
            availabilityService.getClinicAvailability(clinic.id, now, thirtyDaysLater),
          ])

          return {
            ...clinic,
            available_slots_7d: availability7d.available_slots,
            available_slots_30d: availability30d.available_slots,
            has_availability: availability30d.available_slots > 0,
            is_open_now: this.calculateIsOpenNow(clinic),
          }
        } catch (error) {
          // If availability check fails, return clinic with zero availability
          // This handles Requirement 6.4 (appointment system unavailability)
          console.error(`Failed to fetch availability for clinic ${clinic.id}:`, error)
          return {
            ...clinic,
            available_slots_7d: 0,
            available_slots_30d: 0,
            has_availability: false,
            is_open_now: this.calculateIsOpenNow(clinic),
          }
        }
      })
    )

    return clinicsWithAvailability
  }

  /**
   * Create a new clinic location
   * 
   * **Implements: Requirements 1.2, 1.6, 5.1, 5.2, 7.1**
   * 
   * @param data - Clinic data to create
   * @returns Promise resolving to the created clinic
   * @throws Error if validation fails or database insert fails
   */
  async createClinic(data: CreateClinicDTO): Promise<Clinic> {
    // 1. Validate with Zod schema
    const validationResult = CreateClinicSchema.safeParse(data)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${errors}`)
    }

    // 2. Insert into Supabase
    const { data: clinic, error } = await supabase
      .from('clinics')
      .insert({
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        whatsapp: data.whatsapp,
        operating_hours: data.operating_hours,
        special_hours: data.special_hours || [],
        is_active: true,
        is_deleted: false,
      } as never)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create clinic: ${error.message}`)
    }

    // 3. Return created clinic
    return clinic as unknown as Clinic
  }

  /**
   * Update an existing clinic
   * 
   * **Implements: Requirements 1.3, 1.6, 5.2, 7.1**
   * 
   * @param id - Clinic ID to update
   * @param data - Partial clinic data to update
   * @returns Promise resolving to the updated clinic
   * @throws Error if validation fails or database update fails
   */
  async updateClinic(id: string, data: UpdateClinicDTO): Promise<Clinic> {
    // 1. Validate with Zod schema
    const validationResult = UpdateClinicSchema.safeParse(data)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      throw new Error(`Validation failed: ${errors}`)
    }

    // 2. Update in Supabase
    const { data: clinic, error } = await supabase
      .from('clinics')
      .update(data as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update clinic: ${error.message}`)
    }

    // 3. Return updated clinic
    return clinic as unknown as Clinic
  }

  /**
   * Soft delete a clinic
   * 
   * **Implements: Requirements 1.4, 5.3, 5.4**
   * 
   * Sets is_deleted = true for active clinics, or uses a separate flag if already inactive.
   * This preserves historical data while removing the clinic from active listings.
   * 
   * @param id - Clinic ID to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if database update fails
   */
  async deleteClinic(id: string): Promise<void> {
    // 1. Check current status of the clinic
    const { data: clinic, error: fetchError } = await supabase
      .from('clinics')
      .select('is_active, is_deleted')
      .eq('id', id)
      .single()

    if (fetchError) {
      throw new Error(`Failed to fetch clinic: ${fetchError.message}`)
    }

    if (!clinic) {
      throw new Error('Clinic not found')
    }

    // Cast clinic to proper type
    const typedClinic = clinic as unknown as Clinic

    // 2. Determine deletion strategy based on current status
    // If already inactive, set is_deleted flag
    // If active, set is_deleted flag (can also set is_active to false)
    const updates: { is_deleted: boolean; is_active?: boolean } = {
      is_deleted: true,
    }

    // Optionally also deactivate if currently active
    if (typedClinic.is_active) {
      updates.is_active = false
    }

    // 3. Perform soft delete
    const { error: updateError } = await supabase
      .from('clinics')
      .update(updates as never)
      .eq('id', id)

    if (updateError) {
      throw new Error(`Failed to delete clinic: ${updateError.message}`)
    }
  }

  /**
   * Validate address format
   * 
   * **Implements: Requirements 7.1**
   * 
   * Checks that the address contains essential components:
   * - Street information
   * - City
   * - Postal code (optional but recommended)
   * 
   * @param address - Address string to validate
   * @returns Object with validation result and any error messages
   */
  validateAddress(address: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check minimum length
    if (address.length < 10) {
      errors.push('Address is too short (minimum 10 characters)')
    }

    // Check for basic components using simple heuristics
    // This is a basic validation - more sophisticated validation could use geocoding
    const hasNumbers = /\d/.test(address)
    const hasCommas = address.includes(',')
    
    if (!hasNumbers) {
      errors.push('Address should include a street number')
    }

    // Check for common address components
    const addressLower = address.toLowerCase()
    const hasStreetIndicator = /\b(calle|avenida|ave|av|street|st|road|rd|boulevard|blvd)\b/i.test(address)
    
    if (!hasStreetIndicator && !hasCommas) {
      errors.push('Address should include street type (e.g., Calle, Avenida, Street)')
    }

    // Check for city/region indicators (common in Dominican Republic)
    const hasCityIndicator = /\b(santo domingo|santiago|la vega|san cristóbal|puerto plata|san pedro|la romana)\b/i.test(addressLower)
    
    if (!hasCityIndicator && address.split(',').length < 2) {
      errors.push('Address should include city or municipality')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Check coordinate-address consistency
   * 
   * **Implements: Requirements 7.3**
   * 
   * Performs a reverse geocoding check to verify that the provided coordinates
   * correspond to a location near the provided address. This helps catch data entry errors.
   * 
   * Note: This method requires the GeocodingService to be implemented.
   * For now, it performs basic validation checks.
   * 
   * @param address - Address string
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @returns Promise resolving to consistency check result with optional warning
   */
  async checkCoordinateConsistency(
    address: string,
    latitude: number,
    longitude: number
  ): Promise<{ consistent: boolean; warning?: string }> {
    // Basic validation: check if coordinates are valid
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        consistent: false,
        warning: 'Coordinates are outside valid ranges',
      }
    }

    // Check for suspicious (0,0) coordinates
    if (latitude === 0 && longitude === 0) {
      return {
        consistent: false,
        warning: 'Coordinates (0,0) are unlikely to be correct for a clinic location',
      }
    }

    // Check if coordinates are within Dominican Republic bounds (approximate)
    // DR is roughly between 17.5°N to 19.9°N and -72.0°W to -68.3°W
    const isDominicanRepublic = 
      latitude >= 17.5 && latitude <= 19.9 &&
      longitude >= -72.0 && longitude <= -68.3

    if (!isDominicanRepublic) {
      // Check if address mentions Dominican Republic
      const mentionsDR = /\b(república dominicana|dominican republic|rd|dom rep)\b/i.test(address)
      
      if (mentionsDR) {
        return {
          consistent: false,
          warning: 'Coordinates appear to be outside Dominican Republic, but address mentions DR',
        }
      }
    }

    // TODO: Implement full reverse geocoding check using GeocodingService
    // This would involve:
    // 1. Reverse geocode the coordinates to get an address
    // 2. Compare the reverse-geocoded address with the provided address
    // 3. Calculate similarity score
    // 4. Return warning if similarity is low

    // For now, return consistent if basic checks pass
    return {
      consistent: true,
    }
  }

  /**
   * Calculate if a clinic is currently open based on operating hours and special hours
   * 
   * **Helper method for Requirements 8.4, 8.5**
   * 
   * @param clinic - Clinic with operating hours
   * @returns Boolean indicating if clinic is currently open
   */
  private calculateIsOpenNow(clinic: Clinic): boolean {
    const now = new Date()
    const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5) // HH:mm
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof clinic.operating_hours

    // 1. Check special hours first (holidays, exceptions)
    if (clinic.special_hours && clinic.special_hours.length > 0) {
      const specialHour = clinic.special_hours.find((sh) => sh.date === currentDate)
      
      if (specialHour) {
        if (specialHour.closed) {
          return false
        }
        
        // Check if within special hours
        if (specialHour.open && specialHour.close) {
          return currentTime >= specialHour.open && currentTime < specialHour.close
        }
      }
    }

    // 2. Check regular operating hours
    const dayHours = clinic.operating_hours[dayName]
    
    if (!dayHours || dayHours.closed) {
      return false
    }

    // 3. Check if current time is within operating hours
    // Handle edge case where open === close (always closed)
    if (dayHours.open === dayHours.close) {
      return false
    }

    return currentTime >= dayHours.open && currentTime < dayHours.close
  }
}

// Export singleton instance
export const locationService = new LocationService()

