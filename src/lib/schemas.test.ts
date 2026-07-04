// src/lib/schemas.test.ts
import { describe, it, expect } from 'vitest'
import {
  DayHoursSchema,
  OperatingHoursSchema,
  SpecialHourSchema,
  CreateClinicSchema,
  UpdateClinicSchema,
  GeocodingResultSchema,
  AvailabilityQuerySchema,
  AvailabilityResultSchema
} from './schemas'

describe('DayHoursSchema', () => {
  it('should validate valid day hours', () => {
    const validData = {
      open: '08:00',
      close: '18:00',
      closed: false
    }
    expect(() => DayHoursSchema.parse(validData)).not.toThrow()
  })

  it('should validate closed day', () => {
    const validData = {
      open: '00:00',
      close: '00:00',
      closed: true
    }
    expect(() => DayHoursSchema.parse(validData)).not.toThrow()
  })

  it('should reject invalid time format', () => {
    const invalidData = {
      open: '8:00', // Missing leading zero
      close: '18:00',
      closed: false
    }
    expect(() => DayHoursSchema.parse(invalidData)).toThrow()
  })

  it('should reject time out of range', () => {
    const invalidData = {
      open: '25:00', // Invalid hour
      close: '18:00',
      closed: false
    }
    expect(() => DayHoursSchema.parse(invalidData)).toThrow()
  })
})

describe('OperatingHoursSchema', () => {
  it('should validate complete weekly hours', () => {
    const validData = {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    }
    expect(() => OperatingHoursSchema.parse(validData)).not.toThrow()
  })

  it('should reject missing day', () => {
    const invalidData = {
      monday: { open: '08:00', close: '18:00', closed: false },
      tuesday: { open: '08:00', close: '18:00', closed: false },
      wednesday: { open: '08:00', close: '18:00', closed: false },
      thursday: { open: '08:00', close: '18:00', closed: false },
      friday: { open: '08:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false }
      // Missing sunday
    }
    expect(() => OperatingHoursSchema.parse(invalidData)).toThrow()
  })
})

describe('SpecialHourSchema', () => {
  it('should validate special hour with custom times', () => {
    const validData = {
      date: '2024-12-31',
      reason: "New Year's Eve",
      open: '08:00',
      close: '14:00',
      closed: false
    }
    expect(() => SpecialHourSchema.parse(validData)).not.toThrow()
  })

  it('should validate closed special day', () => {
    const validData = {
      date: '2024-12-25',
      reason: 'Christmas',
      closed: true
    }
    expect(() => SpecialHourSchema.parse(validData)).not.toThrow()
  })

  it('should reject invalid date format', () => {
    const invalidData = {
      date: '12/25/2024', // Wrong format
      reason: 'Christmas',
      closed: true
    }
    expect(() => SpecialHourSchema.parse(invalidData)).toThrow()
  })

  it('should reject empty reason', () => {
    const invalidData = {
      date: '2024-12-25',
      reason: '',
      closed: true
    }
    expect(() => SpecialHourSchema.parse(invalidData)).toThrow()
  })

  it('should reject reason exceeding 200 characters', () => {
    const invalidData = {
      date: '2024-12-25',
      reason: 'A'.repeat(201),
      closed: true
    }
    expect(() => SpecialHourSchema.parse(invalidData)).toThrow()
  })
})

describe('CreateClinicSchema', () => {
  const validOperatingHours = {
    monday: { open: '08:00', close: '18:00', closed: false },
    tuesday: { open: '08:00', close: '18:00', closed: false },
    wednesday: { open: '08:00', close: '18:00', closed: false },
    thursday: { open: '08:00', close: '18:00', closed: false },
    friday: { open: '08:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  }

  it('should validate complete clinic data', () => {
    const validData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should validate clinic with special hours', () => {
    const validData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours,
      special_hours: [
        { date: '2024-12-25', reason: 'Christmas', closed: true }
      ]
    }
    expect(() => CreateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should reject coordinates at (0,0)', () => {
    const invalidData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 0,
      longitude: 0,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow(/Coordinates \(0,0\)/)
  })

  it('should reject latitude out of range', () => {
    const invalidData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 91, // Out of range
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow()
  })

  it('should reject longitude out of range', () => {
    const invalidData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -181, // Out of range
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow()
  })

  it('should accept latitude at boundary values', () => {
    const validData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: -90,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should accept longitude at boundary values', () => {
    const validData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: 180,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should reject empty clinic name', () => {
    const invalidData = {
      name: '',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow()
  })

  it('should reject short address', () => {
    const invalidData = {
      name: 'Dental Clinic Downtown',
      address: 'Short', // Less than 10 characters
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-0100',
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow()
  })

  it('should reject invalid phone format', () => {
    const invalidData = {
      name: 'Dental Clinic Downtown',
      address: '123 Main Street, Santo Domingo, 10001',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: 'invalid-phone', // Contains letters
      whatsapp: '+1-809-555-0100',
      operating_hours: validOperatingHours
    }
    expect(() => CreateClinicSchema.parse(invalidData)).toThrow()
  })

  it('should accept various phone formats', () => {
    const formats = [
      '+1-809-555-0100',
      '809-555-0100',
      '(809) 555-0100',
      '+18095550100',
      '809 555 0100'
    ]

    formats.forEach(phone => {
      const validData = {
        name: 'Dental Clinic Downtown',
        address: '123 Main Street, Santo Domingo, 10001',
        latitude: 18.4861,
        longitude: -69.9312,
        phone,
        whatsapp: phone,
        operating_hours: validOperatingHours
      }
      expect(() => CreateClinicSchema.parse(validData)).not.toThrow()
    })
  })
})

describe('UpdateClinicSchema', () => {
  it('should validate partial update with only name', () => {
    const validData = {
      name: 'Updated Clinic Name'
    }
    expect(() => UpdateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should validate partial update with coordinates', () => {
    const validData = {
      latitude: 18.5,
      longitude: -70.0
    }
    expect(() => UpdateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should validate empty update object', () => {
    const validData = {}
    expect(() => UpdateClinicSchema.parse(validData)).not.toThrow()
  })

  it('should reject invalid latitude in partial update', () => {
    const invalidData = {
      latitude: 100 // Out of range
    }
    expect(() => UpdateClinicSchema.parse(invalidData)).toThrow()
  })
})

describe('GeocodingResultSchema', () => {
  it('should validate geocoding result', () => {
    const validData = {
      latitude: 18.4861,
      longitude: -69.9312,
      formatted_address: '123 Main Street, Santo Domingo, Dominican Republic',
      confidence: 'high' as const
    }
    expect(() => GeocodingResultSchema.parse(validData)).not.toThrow()
  })

  it('should accept all confidence levels', () => {
    const levels = ['high', 'medium', 'low'] as const
    levels.forEach(confidence => {
      const validData = {
        latitude: 18.4861,
        longitude: -69.9312,
        formatted_address: '123 Main Street',
        confidence
      }
      expect(() => GeocodingResultSchema.parse(validData)).not.toThrow()
    })
  })

  it('should reject invalid confidence level', () => {
    const invalidData = {
      latitude: 18.4861,
      longitude: -69.9312,
      formatted_address: '123 Main Street',
      confidence: 'invalid'
    }
    expect(() => GeocodingResultSchema.parse(invalidData)).toThrow()
  })
})

describe('AvailabilityQuerySchema', () => {
  it('should validate availability query', () => {
    const validData = {
      clinic_id: '123e4567-e89b-12d3-a456-426614174000',
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    }
    expect(() => AvailabilityQuerySchema.parse(validData)).not.toThrow()
  })

  it('should reject invalid UUID', () => {
    const invalidData = {
      clinic_id: 'not-a-uuid',
      start_date: '2024-01-01',
      end_date: '2024-01-31'
    }
    expect(() => AvailabilityQuerySchema.parse(invalidData)).toThrow()
  })

  it('should reject invalid date format', () => {
    const invalidData = {
      clinic_id: '123e4567-e89b-12d3-a456-426614174000',
      start_date: '01/01/2024', // Wrong format
      end_date: '2024-01-31'
    }
    expect(() => AvailabilityQuerySchema.parse(invalidData)).toThrow()
  })
})

describe('AvailabilityResultSchema', () => {
  it('should validate availability result with next date', () => {
    const validData = {
      clinic_id: '123e4567-e89b-12d3-a456-426614174000',
      available_slots: 10,
      next_available_date: '2024-01-15'
    }
    expect(() => AvailabilityResultSchema.parse(validData)).not.toThrow()
  })

  it('should validate availability result with null next date', () => {
    const validData = {
      clinic_id: '123e4567-e89b-12d3-a456-426614174000',
      available_slots: 0,
      next_available_date: null
    }
    expect(() => AvailabilityResultSchema.parse(validData)).not.toThrow()
  })

  it('should reject negative available slots', () => {
    const invalidData = {
      clinic_id: '123e4567-e89b-12d3-a456-426614174000',
      available_slots: -5,
      next_available_date: null
    }
    expect(() => AvailabilityResultSchema.parse(invalidData)).toThrow()
  })
})
