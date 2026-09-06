import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAppointmentConflicts } from './useAppointmentConflicts'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useAppointmentConflicts', () => {
  let queryClient: QueryClient

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
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

  it('returns no conflict if clinicId or scheduledAt is missing', () => {
    const { result } = renderHook(
      () => useAppointmentConflicts({ clinicId: null, scheduledAt: null }),
      { wrapper: createWrapper() }
    )

    expect(result.current.hasConflict).toBe(false)
    expect(result.current.conflicts).toEqual([])
  })

  it('detects overlapping appointment in the same clinic', async () => {
    const existingAppointment = {
      id: 'apt-1',
      scheduled_at: '2026-09-10T10:00:00.000Z',
      duration_minutes: 60,
      status: 'confirmed',
      patient: { id: 'p1', full_name: 'Carlos Ruiz', phone: '8095551111' },
      procedure: { id: 'pr1', name: 'Limpieza Dental' },
    }

    const mockChain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [existingAppointment], error: null }),
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain)

    // Check slot: 10:30 (overlaps with 10:00-11:00)
    const { result } = renderHook(
      () =>
        useAppointmentConflicts({
          clinicId: 'clinic-1',
          scheduledAt: '2026-09-10T10:30:00.000Z',
          durationMinutes: 45,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.hasConflict).toBe(true))
    expect(result.current.conflicts.length).toBe(1)
    expect(result.current.conflicts[0].id).toBe('apt-1')
  })

  it('does not report conflict when appointments do not overlap in time', async () => {
    const existingAppointment = {
      id: 'apt-1',
      scheduled_at: '2026-09-10T08:00:00.000Z',
      duration_minutes: 45, // Ends at 08:45
      status: 'confirmed',
      patient: { id: 'p1', full_name: 'Carlos Ruiz' },
      procedure: { id: 'pr1', name: 'Limpieza' },
    }

    const mockChain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ data: [existingAppointment], error: null }),
    }

    vi.mocked(supabase.from).mockReturnValue(mockChain)

    // Check slot: 09:00 (after 08:45)
    const { result } = renderHook(
      () =>
        useAppointmentConflicts({
          clinicId: 'clinic-1',
          scheduledAt: '2026-09-10T09:00:00.000Z',
          durationMinutes: 45,
        }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.hasConflict).toBe(false)
    expect(result.current.conflicts).toEqual([])
  })
})
