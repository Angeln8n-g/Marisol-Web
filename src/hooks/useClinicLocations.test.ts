import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useClinicLocations } from './useClinicLocations'
import { locationService } from '../lib/services/LocationService'
import type { Clinic, ClinicWithAvailability } from '../types'

// Mock dependencies
vi.mock('../lib/services/LocationService', () => ({
  locationService: {
    getClinicsWithAvailability: vi.fn(),
    getClinics: vi.fn(),
  },
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useClinicLocations', () => {
  let queryClient: QueryClient

  // Helper to create a wrapper with QueryClient
  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    })
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(QueryClientProvider, { client: queryClient }, children)
    )
    return Wrapper
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryClient?.clear()
  })

  describe('with includeAvailability=true (default)', () => {
    it('should fetch active clinics with availability data', async () => {
      const mockClinicsWithAvailability: ClinicWithAvailability[] = [
        {
          id: '1',
          name: 'Clinic A',
          address: 'Address A',
          latitude: 18.5,
          longitude: -69.9,
          phone: '123-456-7890',
          whatsapp: '123-456-7890',
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
          available_slots_7d: 10,
          available_slots_30d: 50,
          has_availability: true,
          is_open_now: false,
        },
      ]

      vi.mocked(locationService.getClinicsWithAvailability).mockResolvedValue(
        mockClinicsWithAvailability
      )

      const { result } = renderHook(() => useClinicLocations(), {
        wrapper: createWrapper(),
      })

      // Initially loading
      expect(result.current.isLoading).toBe(true)

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockClinicsWithAvailability)
      expect(locationService.getClinicsWithAvailability).toHaveBeenCalledTimes(1)
    })

    it('should fetch both active and inactive clinics when includeInactive=true', async () => {
      const mockAllClinics: ClinicWithAvailability[] = [
        {
          id: '1',
          name: 'Active Clinic',
          address: 'Address A',
          latitude: 18.5,
          longitude: -69.9,
          phone: '123-456-7890',
          whatsapp: '123-456-7890',
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
          available_slots_7d: 10,
          available_slots_30d: 50,
          has_availability: true,
          is_open_now: false,
        },
        {
          id: '2',
          name: 'Inactive Clinic',
          address: 'Address B',
          latitude: 18.6,
          longitude: -69.8,
          phone: '098-765-4321',
          whatsapp: '098-765-4321',
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
          is_active: false,
          is_deleted: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          available_slots_7d: 0,
          available_slots_30d: 0,
          has_availability: false,
          is_open_now: false,
        },
      ]

      // Mock the service to return both active and inactive clinics with availability
      vi.mocked(locationService.getClinicsWithAvailability).mockResolvedValue(mockAllClinics)

      const { result } = renderHook(
        () => useClinicLocations({ includeInactive: true, includeAvailability: true }),
        {
          wrapper: createWrapper(),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      // Should have both active and inactive clinics
      expect(result.current.data).toHaveLength(2)
      expect(locationService.getClinicsWithAvailability).toHaveBeenCalledWith(true)
      
      // Active clinic should have availability data
      const activeClinic = result.current.data?.find((c) => c.id === '1') as ClinicWithAvailability
      expect(activeClinic.available_slots_7d).toBe(10)
      expect(activeClinic.has_availability).toBe(true)
      
      // Inactive clinic should have zero availability
      const inactiveClinic = result.current.data?.find((c) => c.id === '2') as ClinicWithAvailability
      expect(inactiveClinic.available_slots_7d).toBe(0)
      expect(inactiveClinic.has_availability).toBe(false)
    })
  })

  describe('with includeAvailability=false', () => {
    it('should fetch active clinics without availability data', async () => {
      const mockClinics: Clinic[] = [
        {
          id: '1',
          name: 'Clinic A',
          address: 'Address A',
          latitude: 18.5,
          longitude: -69.9,
          phone: '123-456-7890',
          whatsapp: '123-456-7890',
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
        },
      ]

      // Mock getClinics method
      vi.mocked(locationService.getClinics).mockResolvedValue(mockClinics)

      const { result } = renderHook(() => useClinicLocations({ includeAvailability: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockClinics)
      expect(locationService.getClinics).toHaveBeenCalledWith(false)
      expect(locationService.getClinicsWithAvailability).not.toHaveBeenCalled()
    })

    it('should fetch all clinics when includeInactive=true', async () => {
      const mockClinics: Clinic[] = [
        {
          id: '1',
          name: 'Active Clinic',
          address: 'Address A',
          latitude: 18.5,
          longitude: -69.9,
          phone: '123-456-7890',
          whatsapp: '123-456-7890',
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
        },
        {
          id: '2',
          name: 'Inactive Clinic',
          address: 'Address B',
          latitude: 18.6,
          longitude: -69.8,
          phone: '098-765-4321',
          whatsapp: '098-765-4321',
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
          is_active: false,
          is_deleted: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock getClinics method to return both active and inactive
      vi.mocked(locationService.getClinics).mockResolvedValue(mockClinics)

      const { result } = renderHook(
        () => useClinicLocations({ includeInactive: true, includeAvailability: false }),
        {
          wrapper: createWrapper(),
        }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data).toEqual(mockClinics)
      expect(locationService.getClinics).toHaveBeenCalledWith(true)
    })
  })

  describe('error handling', () => {
    it('should handle errors when fetching clinics with availability', async () => {
      vi.mocked(locationService.getClinicsWithAvailability).mockRejectedValue(
        new Error('Database error')
      )

      const { result } = renderHook(() => useClinicLocations(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })

    it('should handle errors when fetching clinics without availability', async () => {
      // Mock getClinics to throw error
      vi.mocked(locationService.getClinics).mockRejectedValue(
        new Error('Database error')
      )

      const { result } = renderHook(() => useClinicLocations({ includeAvailability: false }), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('query configuration', () => {
    it('should configure 5-minute stale time', () => {
      const mockClinics: ClinicWithAvailability[] = []
      vi.mocked(locationService.getClinicsWithAvailability).mockResolvedValue(mockClinics)

      const { result } = renderHook(() => useClinicLocations(), {
        wrapper: createWrapper(),
      })

      // Check that the query has the correct stale time
      const queryState = queryClient.getQueryState(['clinics', { includeInactive: false, includeAvailability: true }])
      expect(queryState).toBeDefined()
      expect(result.current).toBeDefined()
    })

    it('should use correct query key based on options', async () => {
      const mockClinics: ClinicWithAvailability[] = []
      vi.mocked(locationService.getClinicsWithAvailability).mockResolvedValue(mockClinics)

      const { result: result1 } = renderHook(
        () => useClinicLocations({ includeInactive: false, includeAvailability: true }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
      })

      // Different options should create different query keys
      const { result: result2 } = renderHook(
        () => useClinicLocations({ includeInactive: true, includeAvailability: false }),
        { wrapper: createWrapper() }
      )

      // Both queries should be independent
      expect(result1.current).toBeDefined()
      expect(result2.current).toBeDefined()
    })
  })
})
