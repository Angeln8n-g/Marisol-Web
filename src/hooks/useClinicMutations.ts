import { useMutation, useQueryClient } from '@tanstack/react-query'
import { locationService } from '../lib/services/LocationService'
import type { Clinic, CreateClinicDTO, UpdateClinicDTO } from '../types'

/**
 * Custom hook for creating a new clinic location
 * 
 * **Implements: Requirement 1.2**
 * 
 * Features:
 * - Validates clinic data using Zod schema
 * - Creates clinic in database
 * - Automatically invalidates clinic queries to trigger refetch
 * - Provides loading and error states
 * 
 * @returns Mutation object with mutate/mutateAsync functions and state
 * 
 * @example
 * ```tsx
 * const { mutateAsync: createClinic, isPending } = useCreateClinic()
 * 
 * const handleCreate = async (data: CreateClinicDTO) => {
 *   try {
 *     const newClinic = await createClinic(data)
 *     console.log('Clinic created:', newClinic)
 *   } catch (error) {
 *     console.error('Failed to create clinic:', error)
 *   }
 * }
 * ```
 */
export function useCreateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateClinicDTO): Promise<Clinic> => {
      return await locationService.createClinic(data)
    },
    onSuccess: () => {
      // Invalidate all clinic-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['clinics'] })
      queryClient.invalidateQueries({ queryKey: ['clinic-availability'] })
    },
  })
}

/**
 * Custom hook for updating an existing clinic location
 * 
 * **Implements: Requirement 1.3**
 * 
 * Features:
 * - Validates partial clinic data using Zod schema
 * - Updates clinic in database
 * - Automatically invalidates clinic queries to trigger refetch
 * - Provides loading and error states
 * 
 * @returns Mutation object with mutate/mutateAsync functions and state
 * 
 * @example
 * ```tsx
 * const { mutateAsync: updateClinic, isPending } = useUpdateClinic()
 * 
 * const handleUpdate = async (id: string, data: UpdateClinicDTO) => {
 *   try {
 *     const updatedClinic = await updateClinic({ id, data })
 *     console.log('Clinic updated:', updatedClinic)
 *   } catch (error) {
 *     console.error('Failed to update clinic:', error)
 *   }
 * }
 * ```
 */
export function useUpdateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string
      data: UpdateClinicDTO 
    }): Promise<Clinic> => {
      return await locationService.updateClinic(id, data)
    },
    onSuccess: () => {
      // Invalidate all clinic-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['clinics'] })
      queryClient.invalidateQueries({ queryKey: ['clinic-availability'] })
    },
  })
}

/**
 * Custom hook for deleting a clinic location (soft delete)
 * 
 * **Implements: Requirement 1.4**
 * 
 * Features:
 * - Performs soft delete by setting is_deleted flag
 * - Handles both active and inactive clinics appropriately
 * - Automatically invalidates clinic queries to trigger refetch
 * - Provides loading and error states
 * 
 * Note: This performs a soft delete, meaning the clinic is not removed from
 * the database but is marked as deleted and hidden from active listings.
 * 
 * @returns Mutation object with mutate/mutateAsync functions and state
 * 
 * @example
 * ```tsx
 * const { mutateAsync: deleteClinic, isPending } = useDeleteClinic()
 * 
 * const handleDelete = async (id: string) => {
 *   try {
 *     await deleteClinic(id)
 *     console.log('Clinic deleted successfully')
 *   } catch (error) {
 *     console.error('Failed to delete clinic:', error)
 *   }
 * }
 * ```
 */
export function useDeleteClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await locationService.deleteClinic(id)
    },
    onSuccess: () => {
      // Invalidate all clinic-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['clinics'] })
      queryClient.invalidateQueries({ queryKey: ['clinic-availability'] })
    },
  })
}
