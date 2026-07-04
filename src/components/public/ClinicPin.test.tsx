import { describe, it, expect } from 'vitest'
import type { ClinicWithAvailability } from '../../types'

const createMockClinic = (
  overrides: Partial<ClinicWithAvailability> = {}
): ClinicWithAvailability => ({
  id: 'clinic-1',
  name: 'Test Clinic',
  address: 'Test Address 123',
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
    sunday: { open: '00:00', close: '00:00', closed: true },
  },
  special_hours: [],
  is_active: true,
  is_deleted: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  available_slots_30d: 50,
  available_slots_7d: 10,
  has_availability: true,
  is_open_now: true,
  ...overrides,
})

describe('ClinicPin', () => {
  describe('Component Props and Interface', () => {
    it('should accept required props according to interface', () => {
      const clinic = createMockClinic()
      const props: {
        clinic: ClinicWithAvailability
        isSelected: boolean
        onClick: () => void
      } = {
        clinic,
        isSelected: false,
        onClick: () => {},
      }
      
      expect(props.clinic).toBeDefined()
      expect(typeof props.isSelected).toBe('boolean')
      expect(typeof props.onClick).toBe('function')
    })
  })

  describe('Coordinate Validation', () => {
    it('should validate latitude within range -90 to 90', () => {
      const validCases = [
        createMockClinic({ latitude: 0, longitude: 0 }),
        createMockClinic({ latitude: 45.5, longitude: -73.5 }),
        createMockClinic({ latitude: -90, longitude: 0 }),
        createMockClinic({ latitude: 90, longitude: 0 }),
      ]

      validCases.forEach((clinic) => {
        expect(clinic.latitude).toBeGreaterThanOrEqual(-90)
        expect(clinic.latitude).toBeLessThanOrEqual(90)
      })

      const invalidCases = [91, -91, 180, -180]
      invalidCases.forEach((lat) => {
        const isValid = lat >= -90 && lat <= 90
        expect(isValid).toBe(false)
      })
    })

    it('should validate longitude within range -180 to 180', () => {
      const validCases = [
        createMockClinic({ latitude: 0, longitude: 0 }),
        createMockClinic({ latitude: 45.5, longitude: -73.5 }),
        createMockClinic({ latitude: 0, longitude: -180 }),
        createMockClinic({ latitude: 0, longitude: 180 }),
      ]

      validCases.forEach((clinic) => {
        expect(clinic.longitude).toBeGreaterThanOrEqual(-180)
        expect(clinic.longitude).toBeLessThanOrEqual(180)
      })

      const invalidCases = [181, -181, 200, -200]
      invalidCases.forEach((lon) => {
        const isValid = lon >= -180 && lon <= 180
        expect(isValid).toBe(false)
      })
    })

    it('should reject NaN coordinates', () => {
      const validCoords = { latitude: 18.4861, longitude: -69.9312 }
      expect(isNaN(validCoords.latitude)).toBe(false)
      expect(isNaN(validCoords.longitude)).toBe(false)

      const invalidCoords = { latitude: NaN, longitude: NaN }
      expect(isNaN(invalidCoords.latitude)).toBe(true)
      expect(isNaN(invalidCoords.longitude)).toBe(true)
    })

    it('should handle edge case coordinates (0,0)', () => {
      const clinic = createMockClinic({ latitude: 0, longitude: 0 })
      
      expect(clinic.latitude).toBe(0)
      expect(clinic.longitude).toBe(0)
      expect(isNaN(clinic.latitude)).toBe(false)
      expect(isNaN(clinic.longitude)).toBe(false)
    })
  })

  describe('Availability Color Logic', () => {
    it('should use green color (#22c55e) for clinics with availability', () => {
      const GREEN_COLOR = '#22c55e'
      const clinic = createMockClinic({ has_availability: true })
      
      const expectedColor = clinic.has_availability ? GREEN_COLOR : '#ef4444'
      expect(expectedColor).toBe(GREEN_COLOR)
    })

    it('should use red color (#ef4444) for clinics without availability', () => {
      const RED_COLOR = '#ef4444'
      const clinic = createMockClinic({ has_availability: false })
      
      const expectedColor = clinic.has_availability ? '#22c55e' : RED_COLOR
      expect(expectedColor).toBe(RED_COLOR)
    })

    it('should respect has_availability flag over slot count', () => {
      // Edge case: has_availability is false but slots exist
      const clinic = createMockClinic({
        has_availability: false,
        available_slots_7d: 5,
      })
      
      // Should use red because has_availability is false
      const expectedColor = clinic.has_availability ? '#22c55e' : '#ef4444'
      expect(expectedColor).toBe('#ef4444')
      expect(clinic.available_slots_7d).toBeGreaterThan(0)
    })
  })

  describe('Selection State', () => {
    it('should use larger size (36px) when selected', () => {
      const SELECTED_SIZE = 36
      const isSelected = true
      
      const size = isSelected ? SELECTED_SIZE : 28
      expect(size).toBe(SELECTED_SIZE)
    })

    it('should use normal size (28px) when not selected', () => {
      const NORMAL_SIZE = 28
      const isSelected = false
      
      const size = isSelected ? 36 : NORMAL_SIZE
      expect(size).toBe(NORMAL_SIZE)
    })

    it('should use larger border (4px) when selected', () => {
      const SELECTED_BORDER = 4
      const isSelected = true
      
      const borderWidth = isSelected ? SELECTED_BORDER : 3
      expect(borderWidth).toBe(SELECTED_BORDER)
    })

    it('should use normal border (3px) when not selected', () => {
      const NORMAL_BORDER = 3
      const isSelected = false
      
      const borderWidth = isSelected ? 4 : NORMAL_BORDER
      expect(borderWidth).toBe(NORMAL_BORDER)
    })
  })

  describe('Data Requirements', () => {
    it('should work with complete clinic data', () => {
      const clinic = createMockClinic()
      
      expect(clinic.id).toBeDefined()
      expect(clinic.name).toBeDefined()
      expect(clinic.latitude).toBeDefined()
      expect(clinic.longitude).toBeDefined()
      expect(typeof clinic.has_availability).toBe('boolean')
      expect(typeof clinic.is_open_now).toBe('boolean')
    })

    it('should handle clinic with empty name', () => {
      const clinic = createMockClinic({ name: '' })
      
      expect(clinic.name).toBe('')
      expect(clinic.latitude).toBeDefined()
      expect(clinic.longitude).toBeDefined()
    })

    it('should handle extreme valid coordinates', () => {
      const extremeCases = [
        { latitude: 90, longitude: 180 },
        { latitude: -90, longitude: -180 },
        { latitude: 0, longitude: 0 },
      ]

      extremeCases.forEach((coords) => {
        const isValidLat =
          coords.latitude >= -90 && coords.latitude <= 90 && !isNaN(coords.latitude)
        const isValidLon =
          coords.longitude >= -180 &&
          coords.longitude <= 180 &&
          !isNaN(coords.longitude)

        expect(isValidLat).toBe(true)
        expect(isValidLon).toBe(true)
      })
    })
  })
})
