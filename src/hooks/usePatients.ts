import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Patient } from '../types'

interface UsePatientsOptions {
  search?: string
  page?: number
  pageSize?: number
}

export function usePatients({ search = '', page = 0, pageSize = 25 }: UsePatientsOptions = {}) {
  const queryClient = useQueryClient()
  const queryKey = ['patients', search, page, pageSize]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let dbQuery = supabase
        .from('patients')
        .select('*', { count: 'estimated' })
        .order('full_name', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (search) {
        dbQuery = dbQuery.or(
          `full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        )
      }

      const { data, error, count } = await dbQuery

      if (error) throw error

      return {
        data: data as unknown as Patient[],
        count: count ?? 0,
        hasNextPage: (page + 1) * pageSize < (count ?? 0),
        hasPreviousPage: page > 0,
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async (patient: {
      full_name: string
      phone: string
      email?: string
      birth_date?: string
      gender?: string
      medical_alerts?: string
    }) => {
      const { data, error } = await supabase.from('patients').insert(patient as never).select().single()
      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('Ya existe un paciente con este correo electrónico')
        }
        throw error
      }
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('patients').update(updates as never).eq('id', id).select().single()
      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          throw new Error('Ya existe un paciente con este correo electrónico')
        }
        throw error
      }
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['patients'] }),
  })

  const patientQuery = (id: string) =>
    useQuery({
      queryKey: ['patient', id],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single()
        if (error) throw error
        return data as unknown as Patient
      },
      enabled: !!id,
    })

  return {
    patients: query.data?.data ?? [],
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.data?.hasNextPage ?? false,
    hasPreviousPage: query.data?.hasPreviousPage ?? false,
    createPatient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePatient: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    refetch: query.refetch,
    usePatient: patientQuery,
  }
}
