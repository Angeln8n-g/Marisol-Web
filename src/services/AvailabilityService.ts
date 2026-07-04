import { supabase } from '../lib/supabase'
import type { AvailabilityResult, Clinic, OperatingHours, SpecialHour } from '../types'

/**
 * Service for checking appointment availability at clinic locations.
 * Integrates with the existing appointment system to determine slot availability.
 */
export class AvailabilityService {
  /**
   * Get appointment availability for a clinic within a date range.
   * 
   * @param clinicId - The clinic identifier
   * @param startDate - Start of the date range
   * @param endDate - End of the date range
   * @returns Availability data including slot counts and next available date
   * 
   * **Validates: Requirements 3.1, 3.2, 6.1, 6.2**
   */
  async getClinicAvailability(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AvailabilityResult> {
    try {
      // Fetch the clinic to get operating hours
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single()

      if (clinicError || !clinic) {
        throw new Error(`Clinic not found or inactive: ${clinicId}`)
      }

      // Fetch all appointments for this clinic in the date range
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('scheduled_at, duration_minutes, status')
        .eq('clinic_id', clinicId)
        .gte('scheduled_at', startDate.toISOString())
        .lte('scheduled_at', endDate.toISOString())
        .in('status', ['pending', 'confirmed', 'in_progress'])

      if (appointmentsError) {
        throw appointmentsError
      }

      // Calculate total available slots based on operating hours
      const totalSlots = this.calculateTotalSlots(
        clinic as Clinic,
        startDate,
        endDate
      )

      // Count booked slots
      const bookedSlots = appointments?.length ?? 0

      // Calculate available slots
      const availableSlots = Math.max(0, totalSlots - bookedSlots)

      // Find next available date
      const nextAvailableDate = await this.getNextAvailableDate(clinicId)

      return {
        clinic_id: clinicId,
        available_slots: availableSlots,
        next_available_date: nextAvailableDate ? nextAvailableDate.toISOString() : null,
      }
    } catch (error) {
      // Handle appointment system unavailability (Requirement 6.4)
      console.error('Error fetching clinic availability:', error)
      throw error
    }
  }

  /**
   * Check if a clinic has any availability in the next N days.
   * This is a quick check used for map pin indicators.
   * 
   * @param clinicId - The clinic identifier
   * @param days - Number of days to check (default: 30)
   * @returns True if clinic has at least one available slot
   * 
   * **Validates: Requirements 3.2, 6.1**
   */
  async hasAvailability(clinicId: string, days: number = 30): Promise<boolean> {
    try {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + days)

      const availability = await this.getClinicAvailability(clinicId, startDate, endDate)
      return availability.available_slots > 0
    } catch (error) {
      // If appointment system is unavailable, return false (Requirement 6.4)
      console.error('Error checking availability:', error)
      return false
    }
  }

  /**
   * Get the next available appointment date for a clinic.
   * Searches day by day until an available slot is found.
   * 
   * @param clinicId - The clinic identifier
   * @returns The next available date, or null if no availability in next 90 days
   * 
   * **Validates: Requirements 3.5, 6.2**
   */
  async getNextAvailableDate(clinicId: string): Promise<Date | null> {
    try {
      // Fetch the clinic to get operating hours
      const { data: clinic, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('id', clinicId)
        .eq('is_active', true)
        .eq('is_deleted', false)
        .single()

      if (clinicError || !clinic) {
        return null
      }

      const typedClinic = clinic as Clinic
      const maxDaysToCheck = 90
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Check each day for availability
      for (let dayOffset = 0; dayOffset < maxDaysToCheck; dayOffset++) {
        const checkDate = new Date(today)
        checkDate.setDate(checkDate.getDate() + dayOffset)

        // Check if clinic is open on this day
        if (!this.isClinicOpenOnDate(typedClinic, checkDate)) {
          continue
        }

        // Check if there are available slots on this day
        const dayStart = new Date(checkDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(checkDate)
        dayEnd.setHours(23, 59, 59, 999)

        const { data: appointments } = await supabase
          .from('appointments')
          .select('scheduled_at, duration_minutes')
          .eq('clinic_id', clinicId)
          .gte('scheduled_at', dayStart.toISOString())
          .lte('scheduled_at', dayEnd.toISOString())
          .in('status', ['pending', 'confirmed', 'in_progress'])

        const dailySlots = this.calculateDailySlots(typedClinic, checkDate)
        const bookedSlots = appointments?.length ?? 0

        if (bookedSlots < dailySlots) {
          return checkDate
        }
      }

      return null
    } catch (error) {
      console.error('Error finding next available date:', error)
      return null
    }
  }

  /**
   * Calculate total available slots for a clinic in a date range.
   * Based on operating hours and assuming 30-minute slots.
   * 
   * @private
   */
  private calculateTotalSlots(clinic: Clinic, startDate: Date, endDate: Date): number {
    let totalSlots = 0
    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
      if (this.isClinicOpenOnDate(clinic, currentDate)) {
        totalSlots += this.calculateDailySlots(clinic, currentDate)
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return totalSlots
  }

  /**
   * Calculate available slots for a single day.
   * Assumes 30-minute appointment slots.
   * 
   * @private
   */
  private calculateDailySlots(clinic: Clinic, date: Date): number {
    const hours = this.getOperatingHoursForDate(clinic, date)
    if (!hours || hours.closed) {
      return 0
    }

    // Parse open and close times
    const [openHour, openMinute] = hours.open.split(':').map(Number)
    const [closeHour, closeMinute] = hours.close.split(':').map(Number)

    // Calculate total minutes open
    const openMinutes = openHour * 60 + openMinute
    const closeMinutes = closeHour * 60 + closeMinute

    // Handle edge case where open and close times are equal (always closed)
    if (openMinutes === closeMinutes) {
      return 0
    }

    const totalMinutes = closeMinutes - openMinutes

    // Assuming 30-minute slots
    const slotsPerDay = Math.floor(totalMinutes / 30)

    return Math.max(0, slotsPerDay)
  }

  /**
   * Check if clinic is open on a specific date.
   * Considers both regular operating hours and special hours.
   * 
   * @private
   */
  private isClinicOpenOnDate(clinic: Clinic, date: Date): boolean {
    const hours = this.getOperatingHoursForDate(clinic, date)
    return hours !== null && !hours.closed
  }

  /**
   * Get operating hours for a specific date.
   * Checks special hours first, then falls back to regular operating hours.
   * 
   * @private
   */
  private getOperatingHoursForDate(
    clinic: Clinic,
    date: Date
  ): { open: string; close: string; closed: boolean } | null {
    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0]

    // Check special hours first
    if (clinic.special_hours && Array.isArray(clinic.special_hours)) {
      const specialHour = clinic.special_hours.find(
        (sh: SpecialHour) => sh.date === dateStr
      )
      if (specialHour) {
        return {
          open: specialHour.open ?? '00:00',
          close: specialHour.close ?? '00:00',
          closed: specialHour.closed,
        }
      }
    }

    const dayName = date
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as keyof OperatingHours

    const operatingHours = clinic.operating_hours
    if (!operatingHours || !operatingHours[dayName]) {
      return null
    }

    return operatingHours[dayName]
  }
}

// Export singleton instance
export const availabilityService = new AvailabilityService()
