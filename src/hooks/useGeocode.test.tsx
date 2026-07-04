import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useGeocode } from './useGeocode'
import { geocodingService } from '../services/GeocodingService'
import type { GeocodingResult } from '../types'

// Mock the GeocodingService
vi.mock('../services/GeocodingService', () => ({
  geocodingService: {
    geocodeAddress: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useGeocode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should successfully geocode an address', async () => {
    const mockResult: GeocodingResult = {
      latitude: 40.7128,
      longitude: -74.0060,
      formatted_address: 'New York, NY, United States',
      confidence: 'high',
    }

    vi.mocked(geocodingService.geocodeAddress).mockResolvedValue(mockResult)

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.data).toBeUndefined()

    result.current.mutate('New York, NY')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockResult)
    expect(geocodingService.geocodeAddress).toHaveBeenCalledWith('New York, NY')
    expect(geocodingService.geocodeAddress).toHaveBeenCalledTimes(1)
  })

  it('should handle geocoding errors', async () => {
    const errorMessage = 'Address not found'
    vi.mocked(geocodingService.geocodeAddress).mockRejectedValue(
      new Error(errorMessage)
    )

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('Invalid Address 123')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(errorMessage)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle empty address', async () => {
    vi.mocked(geocodingService.geocodeAddress).mockRejectedValue(
      new Error('Address cannot be empty')
    )

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toBe('Address cannot be empty')
  })

  it('should show loading state while geocoding', async () => {
    const mockResult: GeocodingResult = {
      latitude: 51.5074,
      longitude: -0.1278,
      formatted_address: 'London, UK',
      confidence: 'high',
    }

    vi.mocked(geocodingService.geocodeAddress).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockResult), 100)
        })
    )

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('London, UK')

    // Should be pending immediately after mutation
    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Should complete after promise resolves
    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockResult)
  })

  it('should return different confidence levels', async () => {
    const addresses = [
      {
        address: 'Exact Address',
        result: {
          latitude: 40.7128,
          longitude: -74.0060,
          formatted_address: 'Exact Address',
          confidence: 'high' as const,
        },
      },
      {
        address: 'General Area',
        result: {
          latitude: 40.7128,
          longitude: -74.0060,
          formatted_address: 'General Area',
          confidence: 'medium' as const,
        },
      },
      {
        address: 'Vague Location',
        result: {
          latitude: 40.7128,
          longitude: -74.0060,
          formatted_address: 'Vague Location',
          confidence: 'low' as const,
        },
      },
    ]

    for (const { address, result: mockResult } of addresses) {
      vi.mocked(geocodingService.geocodeAddress).mockResolvedValue(mockResult)

      const { result } = renderHook(() => useGeocode(), {
        wrapper: createWrapper(),
      })

      result.current.mutate(address)

      await waitFor(() => {
        expect(result.current.isPending).toBe(false)
      })

      expect(result.current.data?.confidence).toBe(mockResult.confidence)
    }
  })

  it('should allow multiple consecutive geocoding operations', async () => {
    const mockResults: GeocodingResult[] = [
      {
        latitude: 40.7128,
        longitude: -74.0060,
        formatted_address: 'New York, NY',
        confidence: 'high',
      },
      {
        latitude: 51.5074,
        longitude: -0.1278,
        formatted_address: 'London, UK',
        confidence: 'high',
      },
    ]

    vi.mocked(geocodingService.geocodeAddress)
      .mockResolvedValueOnce(mockResults[0])
      .mockResolvedValueOnce(mockResults[1])

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    // First geocoding operation
    result.current.mutate('New York, NY')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockResults[0])

    // Second geocoding operation
    result.current.mutate('London, UK')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.data).toEqual(mockResults[1])
    expect(geocodingService.geocodeAddress).toHaveBeenCalledTimes(2)
  })

  it('should handle network errors', async () => {
    vi.mocked(geocodingService.geocodeAddress).mockRejectedValue(
      new Error('Geocoding API error: 500 Internal Server Error')
    )

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('123 Main St')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Geocoding API error')
  })

  it('should call onSuccess callback when provided', async () => {
    const mockResult: GeocodingResult = {
      latitude: 40.7128,
      longitude: -74.0060,
      formatted_address: 'New York, NY',
      confidence: 'high',
    }

    vi.mocked(geocodingService.geocodeAddress).mockResolvedValue(mockResult)

    const onSuccess = vi.fn()

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('New York, NY', { onSuccess })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // TanStack Query passes 4 arguments: data, variables, undefined, context
    expect(onSuccess).toHaveBeenCalledTimes(1)
    const callArgs = onSuccess.mock.calls[0]
    expect(callArgs[0]).toEqual(mockResult)
    expect(callArgs[1]).toBe('New York, NY')
  })

  it('should call onError callback when provided', async () => {
    const errorMessage = 'Address not found'
    vi.mocked(geocodingService.geocodeAddress).mockRejectedValue(
      new Error(errorMessage)
    )

    const onError = vi.fn()

    const { result } = renderHook(() => useGeocode(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('Invalid Address', { onError })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    // TanStack Query passes 4 arguments: error, variables, undefined, context
    expect(onError).toHaveBeenCalledTimes(1)
    const callArgs = onError.mock.calls[0]
    expect(callArgs[0]).toBeInstanceOf(Error)
    expect(callArgs[0].message).toBe(errorMessage)
    expect(callArgs[1]).toBe('Invalid Address')
  })
})
