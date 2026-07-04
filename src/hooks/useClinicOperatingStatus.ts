import { useState, useEffect } from 'react'
import type { Clinic } from '../types'

/**
 * Hook to calculate if a clinic is currently open based on operating hours and special hours
 * Updates status every minute
 * 
 * @param clinic - The clinic to check operating status for
 * @returns boolean indicating if the clinic is currently open
 * 
 * Requirements: 8.1, 8.3, 8.4, 8.5
 */
export function useClinicOperatingStatus(clinic: Clinic | null | undefined): boolean {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!clinic) {
      setIsOpen(false)
      return
    }

    const checkStatus = () => {
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD format
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}` // HH:mm format
      const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof clinic.operating_hours

      // Check special hours first (holidays, exceptions)
      if (clinic.special_hours && clinic.special_hours.length > 0) {
        const specialHour = clinic.special_hours.find(sh => sh.date === currentDate)
        
        if (specialHour) {
          // If special hour exists for today
          if (specialHour.closed) {
            setIsOpen(false)
            return
          }
          
          // Check if current time is within special hours
          if (specialHour.open && specialHour.close) {
            const isWithinSpecialHours = isTimeInRange(currentTime, specialHour.open, specialHour.close)
            setIsOpen(isWithinSpecialHours)
            return
          }
        }
      }

      // Check regular operating hours
      const dayHours = clinic.operating_hours?.[dayName]
      
      if (!dayHours || dayHours.closed) {
        setIsOpen(false)
        return
      }

      // Check if current time is within operating hours
      const isWithinOperatingHours = isTimeInRange(currentTime, dayHours.open, dayHours.close)
      setIsOpen(isWithinOperatingHours)
    }

    // Initial check
    checkStatus()

    // Update every minute
    const interval = setInterval(checkStatus, 60000)

    return () => clearInterval(interval)
  }, [clinic])

  return isOpen
}

/**
 * Helper function to check if a time is within a range
 * Handles edge cases like:
 * - Equal start and end times (always closed)
 * - Times that cross midnight
 * 
 * @param currentTime - Current time in HH:mm format
 * @param openTime - Opening time in HH:mm format
 * @param closeTime - Closing time in HH:mm format
 * @returns boolean indicating if current time is within the range
 */
function isTimeInRange(currentTime: string, openTime: string, closeTime: string): boolean {
  // If open and close times are equal, treat as always closed
  if (openTime === closeTime) {
    return false
  }

  const current = timeToMinutes(currentTime)
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)

  // Handle times that cross midnight (e.g., 22:00 to 02:00)
  if (close < open) {
    // Current time is after opening or before closing
    return current >= open || current < close
  }

  // Normal case: opening and closing on the same day
  return current >= open && current < close
}

/**
 * Convert time string in HH:mm format to minutes since midnight
 * 
 * @param time - Time string in HH:mm format
 * @returns number of minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
