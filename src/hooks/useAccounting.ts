import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Invoice, BillPayable, BillCategory } from '../types'

interface UseInvoicesParams {
  clinicId?: string
  status?: string
  patientId?: string
}

export function useInvoices(params: UseInvoicesParams = {}) {
  const { clinicId, status, patientId } = params

  return useQuery({
    queryKey: ['invoices', clinicId, status, patientId],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, patient:patients(id, full_name, phone), clinic:clinics(id, name), items:invoice_items(*), payments:payments_received(*)')
        .order('created_at', { ascending: false })

      if (clinicId) query = query.eq('clinic_id', clinicId)
      if (status && status !== 'all') query = query.eq('status', status)
      if (patientId) query = query.eq('patient_id', patientId)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as Invoice[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

interface UseBillsParams {
  clinicId?: string
  category?: BillCategory | 'all'
  status?: string
}

export function useBillsPayable(params: UseBillsParams = {}) {
  const { clinicId, category, status } = params

  return useQuery({
    queryKey: ['bills-payable', clinicId, category, status],
    queryFn: async () => {
      let query = supabase
        .from('bills_payable')
        .select('*, clinic:clinics(id, name), payments:payments_made(*)')
        .order('due_date', { ascending: true })

      if (clinicId) query = query.eq('clinic_id', clinicId)
      if (category && category !== 'all') query = query.eq('category', category)
      if (status && status !== 'all') query = query.eq('status', status)

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as BillPayable[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useAccountingSummary(clinicId?: string) {
  return useQuery({
    queryKey: ['accounting-summary', clinicId],
    queryFn: async () => {
      // Receivables
      let invQuery = supabase.from('invoices').select('total, balance_due, status')
      if (clinicId) invQuery = invQuery.eq('clinic_id', clinicId)
      const { data: invoices } = await invQuery
      const invList = (invoices || []) as any[]

      const totalReceivable = invList.reduce((sum, i) => sum + Number(i.balance_due || 0), 0)
      const totalInvoiced = invList.reduce((sum, i) => sum + Number(i.total || 0), 0)

      // Payables
      let billQuery = supabase.from('bills_payable').select('total, balance_due, status, category')
      if (clinicId) billQuery = billQuery.eq('clinic_id', clinicId)
      const { data: bills } = await billQuery
      const billList = (bills || []) as any[]

      const totalPayable = billList.reduce((sum, b) => sum + Number(b.balance_due || 0), 0)
      const totalBilled = billList.reduce((sum, b) => sum + Number(b.total || 0), 0)

      // Collected payments
      let payRecQuery = supabase.from('payments_received').select('amount, payment_date')
      if (clinicId) payRecQuery = payRecQuery.eq('clinic_id', clinicId)
      const { data: paymentsRec } = await payRecQuery
      const payRecList = (paymentsRec || []) as any[]

      const totalCollected = payRecList.reduce((sum, p) => sum + Number(p.amount || 0), 0)

      // Outgoing payments
      let payMadeQuery = supabase.from('payments_made').select('amount, payment_date')
      if (clinicId) payMadeQuery = payMadeQuery.eq('clinic_id', clinicId)
      const { data: paymentsMade } = await payMadeQuery
      const payMadeList = (paymentsMade || []) as any[]

      const totalDisbursed = payMadeList.reduce((sum, p) => sum + Number(p.amount || 0), 0)

      return {
        totalReceivable,
        totalInvoiced,
        totalPayable,
        totalBilled,
        totalCollected,
        totalDisbursed,
        netOperatingIncome: totalCollected - totalDisbursed,
      }
    },
    staleTime: 3 * 60 * 1000,
  })
}

export function useAccountingMutations() {
  const queryClient = useQueryClient()

  // Create Invoice with items
  const createInvoice = useMutation({
    mutationFn: async (payload: {
      patient_id: string
      clinic_id?: string
      items: Array<{ procedure_id?: string; description: string; quantity: number; unit_price: number }>
      discount?: number
      tax?: number
      notes?: string
      due_date?: string
    }) => {
      const subtotal = payload.items.reduce((s, it) => s + (it.quantity * it.unit_price), 0)
      const discount = payload.discount || 0
      const tax = payload.tax || 0
      const total = Math.max(0, subtotal - discount + tax)
      const invoiceNumber = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          patient_id: payload.patient_id,
          clinic_id: payload.clinic_id || null,
          subtotal,
          discount,
          tax,
          total,
          balance_due: total,
          status: 'issued',
          notes: payload.notes || null,
          due_date: payload.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        } as never)
        .select()
        .single()

      if (invError) throw invError

      const itemsToInsert = payload.items.map((it) => ({
        invoice_id: (invoice as unknown as Invoice).id,
        procedure_id: it.procedure_id || null,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        total: it.quantity * it.unit_price,
      }))

      const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert as never)
      if (itemsError) throw itemsError

      return invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  // Register payment from patient
  const registerPaymentReceived = useMutation({
    mutationFn: async (payment: {
      invoice_id: string
      patient_id: string
      clinic_id?: string
      amount: number
      payment_method: string
      reference_number?: string
      notes?: string
    }) => {
      const { data: inv } = (await supabase
        .from('invoices')
        .select('balance_due, total')
        .eq('id', payment.invoice_id)
        .single()) as { data: { balance_due: number; total: number } | null }

      if (!inv) throw new Error('Factura no encontrada')

      const newBalance = Math.max(0, Number(inv.balance_due) - Number(payment.amount))
      const newStatus = newBalance === 0 ? 'paid' : 'partial'

      const { data, error } = await supabase
        .from('payments_received')
        .insert({
          invoice_id: payment.invoice_id,
          patient_id: payment.patient_id,
          clinic_id: payment.clinic_id || null,
          amount: payment.amount,
          payment_method: payment.payment_method,
          reference_number: payment.reference_number || null,
          notes: payment.notes || null,
        } as never)
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('invoices')
        .update({ balance_due: newBalance, status: newStatus } as never)
        .eq('id', payment.invoice_id)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  // Create Bill Payable (Vendors / Utilities)
  const createBill = useMutation({
    mutationFn: async (bill: Partial<BillPayable>) => {
      const total = Number(bill.total) || 0
      const billNumber = bill.bill_number || `GTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`

      const { data, error } = await supabase
        .from('bills_payable')
        .insert({
          bill_number: billNumber,
          vendor_name: bill.vendor_name,
          category: bill.category,
          clinic_id: bill.clinic_id || null,
          bill_date: bill.bill_date || new Date().toISOString().split('T')[0],
          due_date: bill.due_date,
          subtotal: bill.subtotal || total,
          tax: bill.tax || 0,
          total,
          balance_due: total,
          status: 'pending',
          notes: bill.notes || null,
        } as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-payable'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  // Register payment to vendor / utility
  const registerPaymentMade = useMutation({
    mutationFn: async (payment: {
      bill_id: string
      clinic_id?: string
      amount: number
      payment_method: string
      reference_number?: string
      notes?: string
    }) => {
      const { data: bill } = (await supabase
        .from('bills_payable')
        .select('balance_due, total')
        .eq('id', payment.bill_id)
        .single()) as { data: { balance_due: number; total: number } | null }

      if (!bill) throw new Error('Cuenta por pagar no encontrada')

      const newBalance = Math.max(0, Number(bill.balance_due) - Number(payment.amount))
      const newStatus = newBalance === 0 ? 'paid' : 'partial'

      const { data, error } = await supabase
        .from('payments_made')
        .insert({
          bill_id: payment.bill_id,
          clinic_id: payment.clinic_id || null,
          amount: payment.amount,
          payment_method: payment.payment_method,
          reference_number: payment.reference_number || null,
          notes: payment.notes || null,
        } as never)
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('bills_payable')
        .update({ balance_due: newBalance, status: newStatus } as never)
        .eq('id', payment.bill_id)

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills-payable'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  return {
    createInvoice: createInvoice.mutateAsync,
    isCreatingInvoice: createInvoice.isPending,
    registerPaymentReceived: registerPaymentReceived.mutateAsync,
    isRegisteringPaymentReceived: registerPaymentReceived.isPending,
    createBill: createBill.mutateAsync,
    isCreatingBill: createBill.isPending,
    registerPaymentMade: registerPaymentMade.mutateAsync,
    isRegisteringPaymentMade: registerPaymentMade.isPending,
  }
}
