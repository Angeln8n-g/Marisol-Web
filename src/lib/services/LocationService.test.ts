import { describe, it, expect, vi, beforeEach } from 'vitest'
import { locationService } from './LocationService'
import { supabase } from '../supabase'
import { availabilityService } from '../../services/AvailabilityService'
import type { Clinic, CreateClinicDTO, UpdateClinicDTO } from '../../types'

// Mock dependencies
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../../services/AvailabilityService', () => ({
  availabilityService: {
    getClinicAvailability: vi.fn(),
  },
}))

describe('LocationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockClinic: Clinic = {
    id: '1',
    name: 'Test Clinic',
    address: 'Calle Test 123, Santo Domingo',
    latitude: 18.5,
    longitude: -69.9,
    phone: '+1-809-555-1234',
    whatsapp: '+1-809-555-1234',
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
  }

  describe('getClinicsWithAvailability', () => {
    it('should fetch active clinics with availability data', async () => {
      // Mock Supabase query chain
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockClinic],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any)

      // Mock availability service
      vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue({
        clinic_id: '1',
        available_slots: 50,
        next_available_date: '2024-01-15T00:00:00Z',
      })

      const result = await locationService.getClinicsWithAvailability()

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        ...mockClinic,
        available_slots_7d: 50,
        available_slots_30d: 50,
        has_availability: true,
        is_open_now: false,
      })

      expect(supabase.from).toHaveBeenCalledWith('clinics')
      expect(mockSelect).toHaveBeenCalledWith('*')
      expect(mockEq).toHaveBeenCalledWith('is_active', true)
      expect(mockEq).toHaveBeenCalledWith('is_deleted', false)
      expect(mockOrder).toHaveBeenCalledWith('name')
    })

    it('should return empty array when no clinics exist', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any)

      const result = await locationService.getClinicsWithAvailability()

      expect(result).toEqual([])
    })

    it('should throw error when database query fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any)

      await expect(locationService.getClinicsWithAvailability()).rejects.toThrow(
        'Failed to fetch clinics: Database error'
      )
    })

    it('should handle availability service failure gracefully', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [mockClinic],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
      } as any)

      // Mock availability service to fail
      vi.mocked(availabilityService.getClinicAvailability).mockRejectedValue(
        new Error('Availability service error')
      )

      const result = await locationService.getClinicsWithAvailability()

      // Should return clinic with zero availability instead of failing
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        ...mockClinic,
        available_slots_7d: 0,
        available_slots_30d: 0,
        has_availability: false,
      })
    })
  })

  describe('createClinic', () => {
    const validClinicData: CreateClinicDTO = {
      name: 'New Clinic',
      address: 'Calle Nueva 456, Santo Domingo, DR',
      latitude: 18.4861,
      longitude: -69.9312,
      phone: '+1-809-555-5678',
      whatsapp: '+1-809-555-5678',
      operating_hours: {
        monday: { open: '08:00', close: '17:00', closed: false },
        tuesday: { open: '08:00', close: '17:00', closed: false },
        wednesday: { open: '08:00', close: '17:00', closed: false },
        thursday: { open: '08:00', close: '17:00', closed: false },
        friday: { open: '08:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '13:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      special_hours: [],
    }

    it('should create a new clinic with valid data', async () => {
      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...validClinicData, id: '2', is_active: true, is_deleted: false },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any)

      const result = await locationService.createClinic(validClinicData)

      expect(result.name).toBe(validClinicData.name)
      expect(result.address).toBe(validClinicData.address)
      expect(supabase.from).toHaveBeenCalledWith('clinics')
      expect(mockInsert).toHaveBeenCalled()
    })

    it('should throw error for invalid phone number format', async () => {
      const invalidData = {
        ...validClinicData,
        phone: 'invalid-phone',
      }

      await expect(locationService.createClinic(invalidData)).rejects.toThrow(
        'Validation failed'
      )
    })

    it('should throw error for coordinates outside valid range', async () => {
      const invalidData = {
        ...validClinicData,
        latitude: 95, // Invalid: > 90
      }

      await expect(locationService.createClinic(invalidData)).rejects.toThrow(
        'Validation failed'
      )
    })

    it('should throw error for address that is too short', async () => {
      const invalidData = {
        ...validClinicData,
        address: 'Short', // Invalid: < 10 characters
      }

      await expect(locationService.createClinic(invalidData)).rejects.toThrow(
        'Validation failed'
      )
    })

    it('should reject coordinates at (0,0)', async () => {
      const invalidData = {
        ...validClinicData,
        latitude: 0,
        longitude: 0,
      }

      await expect(locationService.createClinic(invalidData)).rejects.toThrow(
        'Validation failed'
      )
    })

    it('should throw error when database insert fails', async () => {
      const mockInsert = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
        select: mockSelect,
        single: mockSingle,
      } as any)

      await expect(locationService.createClinic(validClinicData)).rejects.toThrow(
        'Failed to create clinic: Insert failed'
      )
    })
  })

  describe('updateClinic', () => {
    const updateData: UpdateClinicDTO = {
      name: 'Updated Clinic Name',
      phone: '+1-809-555-9999',
    }

    it('should update clinic with valid data', async () => {
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { ...mockClinic, ...updateData },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any)

      const result = await locationService.updateClinic('1', updateData)

      expect(result.name).toBe(updateData.name)
      expect(result.phone).toBe(updateData.phone)
      expect(supabase.from).toHaveBeenCalledWith('clinics')
      expect(mockUpdate).toHaveBeenCalled()
      expect(mockEq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error for invalid update data', async () => {
      const invalidData = {
        latitude: 100, // Invalid: > 90
      }

      await expect(locationService.updateClinic('1', invalidData)).rejects.toThrow(
        'Validation failed'
      )
    })

    it('should throw error when database update fails', async () => {
      const mockUpdate = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
        eq: mockEq,
        select: mockSelect,
        single: mockSingle,
      } as any)

      await expect(locationService.updateClinic('1', updateData)).rejects.toThrow(
        'Failed to update clinic: Update failed'
      )
    })
  })

  describe('deleteClinic', () => {
    it('should soft delete an active clinic', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_active: true, is_deleted: false },
        error: null,
      })
      const mockUpdate = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any)

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      await locationService.deleteClinic('1')

      expect(mockUpdate).toHaveBeenCalledWith({
        is_deleted: true,
        is_active: false,
      })
    })

    it('should soft delete an inactive clinic', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_active: false, is_deleted: false },
        error: null,
      })
      const mockUpdate = vi.fn().mockReturnThis()

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any)

      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: vi.fn().mockResolvedValue({ error: null }),
      } as any)

      await locationService.deleteClinic('1')

      expect(mockUpdate).toHaveBeenCalledWith({
        is_deleted: true,
      })
    })

    it('should throw error when clinic is not found', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any)

      await expect(locationService.deleteClinic('999')).rejects.toThrow(
        'Clinic not found'
      )
    })

    it('should throw error when database update fails', async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { is_active: true, is_deleted: false },
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
      } as any)

      const mockUpdate = vi.fn().mockReturnThis()
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: mockUpdate,
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      } as any)

      await expect(locationService.deleteClinic('1')).rejects.toThrow(
        'Failed to delete clinic: Delete failed'
      )
    })
  })

  describe('validateAddress', () => {
    it('should validate a complete address', () => {
      const result = locationService.validateAddress(
        'Calle Abraham Lincoln 123, Santo Domingo, República Dominicana'
      )

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject address that is too short', () => {
      const result = locationService.validateAddress('Short')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Address is too short (minimum 10 characters)')
    })

    it('should reject address without street number', () => {
      const result = locationService.validateAddress('Calle Sin Numero, Santo Domingo')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('street number'))).toBe(true)
    })

    it('should reject address without street type indicator', () => {
      const result = locationService.validateAddress('123 Unknown Location')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('street type'))).toBe(true)
    })

    it('should reject address without city', () => {
      const result = locationService.validateAddress('Calle Test 123')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('city'))).toBe(true)
    })

    it('should accept address with common Dominican street types', () => {
      const addresses = [
        'Avenida Winston Churchill 123, Santo Domingo',
        'Calle El Conde 456, Santo Domingo',
        'Av. Abraham Lincoln 789, Santo Domingo',
      ]

      addresses.forEach((address) => {
        const result = locationService.validateAddress(address)
        expect(result.valid).toBe(true)
      })
    })
  })

  describe('checkCoordinateConsistency', () => {
    it('should reject coordinates outside valid ranges', async () => {
      const result = await locationService.checkCoordinateConsistency(
        'Test Address',
        95,
        -69.9
      )

      expect(result.consistent).toBe(false)
      expect(result.warning).toContain('outside valid ranges')
    })

    it('should warn about (0,0) coordinates', async () => {
      const result = await locationService.checkCoordinateConsistency('Test Address', 0, 0)

      expect(result.consistent).toBe(false)
      expect(result.warning).toContain('(0,0)')
    })

    it('should warn when DR address has coordinates outside DR', async () => {
      const result = await locationService.checkCoordinateConsistency(
        'Calle Test, Santo Domingo, República Dominicana',
        40.7128, // New York latitude
        -74.006 // New York longitude
      )

      expect(result.consistent).toBe(false)
      expect(result.warning).toContain('outside Dominican Republic')
    })

    it('should accept valid DR coordinates', async () => {
      const result = await locationService.checkCoordinateConsistency(
        'Calle Test, Santo Domingo',
        18.4861,
        -69.9312
      )

      expect(result.consistent).toBe(true)
      expect(result.warning).toBeUndefined()
    })

    it('should accept coordinates outside DR if address does not mention DR', async () => {
      const result = await locationService.checkCoordinateConsistency(
        'Test Street 123, New York',
        40.7128,
        -74.006
      )

      expect(result.consistent).toBe(true)
    })
  })
})
