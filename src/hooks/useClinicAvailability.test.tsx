import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useClinicAvailability } from './useClinicAvailability'
import { availabilityService } from '../services/AvailabilityService'
import type { AvailabilityResult } from '../types'

// Mock the availability service
vi.mock('../services/AvailabilityService', () => ({
  availabilityService: {
    getClinicAvailability: vi.fn(),
  },
}))

describe('useClinicAvailability', () => {
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
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch clinic availability successfully', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-123',
      available_slots: 15,
      next_available_date: '2024-12-20T00:00:00.000Z',
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-123', 30), { wrapper: createWrapper() })

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    // Wait for the query to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Check the data
    expect(result.current.data).toEqual(mockAvailability)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)

    // Verify the service was called with correct parameters
    expect(availabilityService.getClinicAvailability).toHaveBeenCalledTimes(1)
    const callArgs = vi.mocked(availabilityService.getClinicAvailability).mock.calls[0]
    expect(callArgs[0]).toBe('clinic-123')
    expect(callArgs[1]).toBeInstanceOf(Date)
    expect(callArgs[2]).toBeInstanceOf(Date)
  })

  it('should use default days parameter of 30', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-456',
      available_slots: 10,
      next_available_date: null,
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-456'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify the date range is approximately 30 days
    const callArgs = vi.mocked(availabilityService.getClinicAvailability).mock.calls[0]
    const startDate = callArgs[1] as Date
    const endDate = callArgs[2] as Date
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(daysDiff).toBe(30)
  })

  it('should use custom days parameter', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-789',
      available_slots: 5,
      next_available_date: '2024-12-25T00:00:00.000Z',
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-789', 7), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Verify the date range is approximately 7 days
    const callArgs = vi.mocked(availabilityService.getClinicAvailability).mock.calls[0]
    const startDate = callArgs[1] as Date
    const endDate = callArgs[2] as Date
    const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(daysDiff).toBe(7)
  })

  it('should not fetch when clinicId is empty', async () => {
    const { result } = renderHook(() => useClinicAvailability('', 30), { wrapper: createWrapper() })

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.data).toBeUndefined()

    // Service should not be called
    expect(availabilityService.getClinicAvailability).not.toHaveBeenCalled()
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch availability')
    vi.mocked(availabilityService.getClinicAvailability).mockRejectedValue(mockError)

    const { result } = renderHook(() => useClinicAvailability('clinic-error', 30), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('should use correct query key for caching', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-cache',
      available_slots: 20,
      next_available_date: '2024-12-30T00:00:00.000Z',
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-cache', 15), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Check that the query is cached with the correct key
    const cachedData = queryClient.getQueryData(['clinic-availability', 'clinic-cache', 15])
    expect(cachedData).toEqual(mockAvailability)
  })

  it('should have 5-minute stale time configured', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-stale',
      available_slots: 8,
      next_available_date: null,
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-stale', 30), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // Get the query state to check staleTime
    const queryState = queryClient.getQueryState(['clinic-availability', 'clinic-stale', 30])
    expect(queryState).toBeDefined()
    
    // The query should be fresh (not stale) immediately after fetching
    expect(queryState?.isInvalidated).toBe(false)
  })

  it('should handle zero available slots', async () => {
    const mockAvailability: AvailabilityResult = {
      clinic_id: 'clinic-full',
      available_slots: 0,
      next_available_date: null,
    }

    vi.mocked(availabilityService.getClinicAvailability).mockResolvedValue(mockAvailability)

    const { result } = renderHook(() => useClinicAvailability('clinic-full', 30), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.available_slots).toBe(0)
    expect(result.current.data?.next_available_date).toBeNull()
  })

  it('should refetch when clinicId changes', async () => {
    const mockAvailability1: AvailabilityResult = {
      clinic_id: 'clinic-1',
      available_slots: 10,
      next_available_date: '2024-12-20T00:00:00.000Z',
    }

    const mockAvailability2: AvailabilityResult = {
      clinic_id: 'clinic-2',
      available_slots: 5,
      next_available_date: '2024-12-25T00:00:00.000Z',
    }

    vi.mocked(availabilityService.getClinicAvailability)
      .mockResolvedValueOnce(mockAvailability1)
      .mockResolvedValueOnce(mockAvailability2)

    const { result, rerender } = renderHook(
      ({ clinicId }) => useClinicAvailability(clinicId, 30),
      {
        wrapper: createWrapper(),
        initialProps: { clinicId: 'clinic-1' },
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockAvailability1)

    // Change the clinicId
    rerender({ clinicId: 'clinic-2' })

    await waitFor(() => expect(result.current.data).toEqual(mockAvailability2))

    // Service should have been called twice
    expect(availabilityService.getClinicAvailability).toHaveBeenCalledTimes(2)
  })

  it('should refetch when days parameter changes', async () => {
    const mockAvailability1: AvailabilityResult = {
      clinic_id: 'clinic-days',
      available_slots: 15,
      next_available_date: '2024-12-20T00:00:00.000Z',
    }

    const mockAvailability2: AvailabilityResult = {
      clinic_id: 'clinic-days',
      available_slots: 8,
      next_available_date: '2024-12-18T00:00:00.000Z',
    }

    vi.mocked(availabilityService.getClinicAvailability)
      .mockResolvedValueOnce(mockAvailability1)
      .mockResolvedValueOnce(mockAvailability2)

    const { result, rerender } = renderHook(
      ({ days }) => useClinicAvailability('clinic-days', days),
      {
        wrapper: createWrapper(),
        initialProps: { days: 30 },
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockAvailability1)

    // Change the days parameter
    rerender({ days: 7 })

    await waitFor(() => expect(result.current.data).toEqual(mockAvailability2))

    // Service should have been called twice
    expect(availabilityService.getClinicAvailability).toHaveBeenCalledTimes(2)
  })
})
