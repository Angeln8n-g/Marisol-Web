/**
 * Dependency Configuration Tests
 * 
 * Verifies that all required dependencies for clinic location management
 * are properly installed and configured.
 */

import { describe, it, expect } from 'vitest'
import L from 'leaflet'
import { z } from 'zod'
import { create } from 'zustand'
import { QueryClient } from '@tanstack/react-query'

describe('Dependencies Configuration', () => {
  describe('Leaflet', () => {
    it('should import Leaflet library', () => {
      expect(L).toBeDefined()
      expect(L.version).toBeDefined()
    })

    it('should create LatLng objects', () => {
      const latLng = L.latLng(51.505, -0.09)
      expect(latLng.lat).toBe(51.505)
      expect(latLng.lng).toBe(-0.09)
    })

    it('should validate coordinate ranges', () => {
      const validLat = L.latLng(45, 0)
      expect(validLat.lat).toBe(45)
      
      const validLng = L.latLng(0, 120)
      expect(validLng.lng).toBe(120)
    })
  })

  describe('Zod', () => {
    it('should import Zod library', () => {
      expect(z).toBeDefined()
    })

    it('should validate clinic coordinates', () => {
      const CoordinateSchema = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })

      const validCoords = { latitude: 45.5, longitude: -73.6 }
      expect(() => CoordinateSchema.parse(validCoords)).not.toThrow()

      const invalidLat = { latitude: 91, longitude: 0 }
      expect(() => CoordinateSchema.parse(invalidLat)).toThrow()

      const invalidLng = { latitude: 0, longitude: 181 }
      expect(() => CoordinateSchema.parse(invalidLng)).toThrow()
    })

    it('should validate clinic data structure', () => {
      const ClinicSchema = z.object({
        name: z.string().min(1),
        address: z.string().min(10),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        phone: z.string(),
      })

      const validClinic = {
        name: 'Test Clinic',
        address: '123 Main St, City, Country',
        latitude: 45.5,
        longitude: -73.6,
        phone: '+1234567890',
      }

      expect(() => ClinicSchema.parse(validClinic)).not.toThrow()
    })
  })

  describe('Zustand', () => {
    it('should import Zustand library', () => {
      expect(create).toBeDefined()
    })

    it('should create a store', () => {
      interface TestStore {
        count: number
        increment: () => void
      }

      const useTestStore = create<TestStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))

      expect(useTestStore).toBeDefined()
      expect(typeof useTestStore).toBe('function')
    })

    it('should manage state correctly', () => {
      interface CounterStore {
        count: number
        increment: () => void
        reset: () => void
      }

      const useCounterStore = create<CounterStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
        reset: () => set({ count: 0 }),
      }))

      const state1 = useCounterStore.getState()
      expect(state1.count).toBe(0)

      state1.increment()
      const state2 = useCounterStore.getState()
      expect(state2.count).toBe(1)

      state2.reset()
      const state3 = useCounterStore.getState()
      expect(state3.count).toBe(0)
    })
  })

  describe('TanStack Query', () => {
    it('should import QueryClient', () => {
      expect(QueryClient).toBeDefined()
    })

    it('should create QueryClient instance', () => {
      const queryClient = new QueryClient()
      expect(queryClient).toBeDefined()
      expect(queryClient).toBeInstanceOf(QueryClient)
    })

    it('should configure QueryClient with options', () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchInterval: 5 * 60 * 1000,
          },
        },
      })

      expect(queryClient).toBeDefined()
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(300000)
    })
  })

  describe('TypeScript Types', () => {
    it('should have Leaflet types available', () => {
      // Type checking - this will fail at compile time if types are missing
      const map: L.Map | null = null
      const latLng: L.LatLng = L.latLng(0, 0)
      const marker: L.Marker | null = null

      expect(map).toBeNull()
      expect(latLng).toBeDefined()
      expect(marker).toBeNull()
    })

    it('should have Zod types available', () => {
      // Type checking
      const schema: z.ZodObject<any> = z.object({
        test: z.string(),
      })

      expect(schema).toBeDefined()
    })
  })

  describe('Integration', () => {
    it('should work together for clinic validation', () => {
      // Define schema with Zod
      const ClinicSchema = z.object({
        name: z.string().min(1).max(200),
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })

      // Create Leaflet LatLng
      const coords = L.latLng(45.5, -73.6)

      // Validate with Zod
      const clinic = {
        name: 'Test Clinic',
        latitude: coords.lat,
        longitude: coords.lng,
      }

      const result = ClinicSchema.safeParse(clinic)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('Test Clinic')
        expect(result.data.latitude).toBe(45.5)
        expect(result.data.longitude).toBe(-73.6)
      }
    })

    it('should validate coordinates are within Leaflet bounds', () => {
      const CoordinateSchema = z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })

      // Test valid coordinates
      const validCoords = { latitude: 45.5, longitude: -73.6 }
      const latLng = L.latLng(validCoords.latitude, validCoords.longitude)
      
      expect(() => CoordinateSchema.parse(validCoords)).not.toThrow()
      expect(latLng.lat).toBe(validCoords.latitude)
      expect(latLng.lng).toBe(validCoords.longitude)
    })
  })
})
