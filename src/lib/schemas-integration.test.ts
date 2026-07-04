// src/lib/schemas-integration.test.ts
import { describe, it, expect } from 'vitest'
import { CreateClinicSchema, UpdateClinicSchema } from './schemas'
import type { CreateClinicDTO, UpdateClinicDTO, OperatingHours, SpecialHour } from '../types'

describe('Schema and Type Integration', () => {
  it('should validate CreateClinicDTO with CreateClinicSchema', () => {
    const clinicData: CreateClinicDTO = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      special_hours: [
        { date: '2024-12-25', reason: 'Christmas', closed: true }
      ]
    }

    const result = CreateClinicSchema.safeParse(clinicData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe(clinicData.name)
      expect(result.data.latitude).toBe(clinicData.latitude)
    }
  })

  it('should validate UpdateClinicDTO with UpdateClinicSchema', () => {
    const updateData: UpdateClinicDTO = {
      name: 'Updated Clinic Name',
      is_active: false
    }

    const result = UpdateClinicSchema.safeParse(updateData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe(updateData.name)
    }
  })

  it('should validate OperatingHours type structure', () => {
    const hours: OperatingHours = {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    }

    // Type check passes at compile time
    expect(hours.monday.open).toBe('08:00')
    expect(hours.sunday.closed).toBe(true)
  })

  it('should validate SpecialHour type structure', () => {
    const specialHour: SpecialHour = {
      date: '2024-12-25',
      reason: 'Christmas',
      closed: true
    }

    // Type check passes at compile time
    expect(specialHour.date).toBe('2024-12-25')
    expect(specialHour.closed).toBe(true)
  })

  it('should handle validation errors gracefully', () => {
    const invalidData = {
      name: '', // Empty name should fail
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      }
    }

    const result = CreateClinicSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
      expect(result.error.issues[0].path).toContain('name')
    }
  })

  it('should provide detailed error messages', () => {
    const invalidData = {
      name: 'Clinic',
      address: 'Short', // Too short
      latitude: 100, // Out of range
      longitude: -69.9312,
      phone: 'invalid', // Invalid format
      whatsapp: '+1-809-555-0100',
      operating_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      }
    }

    const result = CreateClinicSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = result.error.issues
      expect(errors.some(e => e.path.includes('address'))).toBe(true)
      expect(errors.some(e => e.path.includes('latitude'))).toBe(true)
      expect(errors.some(e => e.path.includes('phone'))).toBe(true)
    }
  })
})
