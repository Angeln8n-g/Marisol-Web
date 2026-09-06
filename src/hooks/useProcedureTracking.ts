import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ProcedureTracking } from '../types'

export function generateFollowupAlerts(
  records: ProcedureTracking[],
  daysAhead: number
): ProcedureTracking[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + daysAhead)
  cutoff.setHours(23, 59, 59, 999)

  return records.filter((r) => {
    if (!r.next_followup_date) return false
    if (r.status === 'completed' || r.status === 'cancelled') return false
    if (r.alert_sent) return false

    const followupDate = new Date(r.next_followup_date)
    return followupDate <= cutoff
  })
}

export function useProcedureTracking(patientId?: string) {
  const queryClient = useQueryClient()
  const queryKey = ['procedure-tracking', patientId]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let dbQuery = supabase
        .from('procedure_tracking')
        .select(`
          id,
          patient_id,
          procedure_id,
          appointment_id,
          status,
          start_date,
          expected_end_date,
          actual_end_date,
          progress_notes,
          next_followup_date,
          alert_sent,
          billing_status,
          budget_id,
          invoice_id,
          patient:patients(full_name, phone),
          procedure:procedures(name, category),
          budget:budgets(id, budget_number)
        `)
        .order('created_at', { ascending: false })
        .limit(200)

      if (patientId) {
        dbQuery = dbQuery.eq('patient_id', patientId)
      }

      const { data, error } = await dbQuery
      if (error) throw error
      return data as unknown as (ProcedureTracking & {
        patient: { full_name: string; phone?: string }
        procedure: { name: string; category?: string }
        budget?: { id: string; budget_number: string }
      })[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (tracking: {
      patient_id: string
      procedure_id: string
      start_date: string
      expected_end_date?: string
      progress_notes?: string
      next_followup_date?: string
      budget_id?: string
      billing_status?: string
    }) => {
      const insertData = { ...tracking, status: 'scheduled' as const, billing_status: tracking.billing_status || 'unbilled' }
      const { data, error } = await supabase.from('procedure_tracking').insert(insertData as never).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] }),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('procedure_tracking').update(updates as never).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] }),
  })

  const billProcedureSession = useMutation({
    mutationFn: async (payload: {
      tracking_id: string
      patient_id: string
      procedure_id: string
      procedure_name: string
      clinic_id?: string
      amount: number
      budget_id?: string
      immediate_payment?: boolean
      payment_method?: string
      reference_number?: string
      notes?: string
    }) => {
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const total = payload.amount

      // 1. Create Invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: payload.patient_id,
          clinic_id: payload.clinic_id || null,
          budget_id: payload.budget_id || null,
          subtotal: total,
          total,
          balance_due: payload.immediate_payment ? 0 : total,
          status: payload.immediate_payment ? 'paid' : 'issued',
          due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          notes: payload.notes || `Facturación de procedimiento: ${payload.procedure_name}`,
        } as never)
        .select()
        .single()

      if (invError) throw invError

      const invoiceId = (invoice as any).id

      // 2. Create Invoice Item
      await supabase.from('invoice_items').insert({
        invoice_id: invoiceId,
        procedure_id: payload.procedure_id,
        description: payload.procedure_name,
        quantity: 1,
        unit_price: total,
        total,
      } as never)

      // 3. Register payment if immediate
      if (payload.immediate_payment) {
        await supabase.from('payments_received').insert({
          invoice_id: invoiceId,
          patient_id: payload.patient_id,
          clinic_id: payload.clinic_id || null,
          amount: total,
          payment_method: payload.payment_method || 'cash',
          reference_number: payload.reference_number || null,
          notes: 'Cobro de procedimiento odontológico.',
        } as never)
      }

      // 4. Update procedure tracking record
      await supabase
        .from('procedure_tracking')
        .update({
          invoice_id: invoiceId,
          budget_id: payload.budget_id || null,
          billing_status: payload.immediate_payment ? 'paid' : 'invoiced',
        } as never)
        .eq('id', payload.tracking_id)

      return invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  const markAlertsSent = async (ids: string[]) => {
    if (ids.length === 0) return
    const { error } = await supabase
      .from('procedure_tracking')
      .update({ alert_sent: true } as never)
      .in('id', ids)
    if (error) throw error
    queryClient.invalidateQueries({ queryKey: ['procedure-tracking'] })
  }

  return {
    records: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    createTracking: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateTracking: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    billProcedureSession: billProcedureSession.mutateAsync,
    isBillingProcedure: billProcedureSession.isPending,
    markAlertsSent,
    refetch: query.refetch,
  }
}
