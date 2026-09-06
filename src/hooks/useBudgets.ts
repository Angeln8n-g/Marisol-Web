import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Budget,
  BudgetStatus,
  CreateBudgetDTO,
  UpdateBudgetDTO,
  SignBudgetDTO,
  PaymentModality,
} from '../types'

export interface UseBudgetsFilters {
  clinicId?: string
  patientId?: string
  status?: BudgetStatus | 'all'
  searchQuery?: string
  dateFrom?: string
  dateTo?: string
}

export function useBudgets(filters: UseBudgetsFilters = {}) {
  const { clinicId, patientId, status, searchQuery, dateFrom, dateTo } = filters

  return useQuery({
    queryKey: ['budgets', clinicId, patientId, status, searchQuery, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          patient:patients(id, full_name, phone, email, identification_number),
          clinic:clinics(id, name, phone, address),
          items:budget_items(*),
          installments:budget_installments(*),
          invoices:invoices(id, invoice_number, total, balance_due, status)
        `)
        .order('created_at', { ascending: false })

      if (clinicId) query = query.eq('clinic_id', clinicId)
      if (patientId) query = query.eq('patient_id', patientId)
      if (status && status !== 'all') query = query.eq('status', status)
      if (dateFrom) query = query.gte('issue_date', dateFrom)
      if (dateTo) query = query.lte('issue_date', dateTo)

      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim()
        query = query.or(`budget_number.ilike.%${q}%,patient_name.ilike.%${q}%,patient_phone.ilike.%${q}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as Budget[]
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useBudget(id?: string) {
  return useQuery({
    queryKey: ['budget', id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          patient:patients(*),
          clinic:clinics(*),
          items:budget_items(*),
          installments:budget_installments(*),
          invoices:invoices(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as unknown as Budget
    },
  })
}

export function useBudgetMutations() {
  const queryClient = useQueryClient()

  // 1. Create Budget with items and optional installments
  const createBudget = useMutation({
    mutationFn: async (dto: CreateBudgetDTO) => {
      const year = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      const budgetNumber = dto.budget_number || `COT-${year}-${rand}`

      const subtotal = dto.subtotal ?? dto.items.reduce((acc, it) => acc + (it.quantity * it.unit_price), 0)
      const discountPercent = dto.discount_percent || 0
      const discountAmount = dto.discount_amount ?? (subtotal * (discountPercent / 100))
      const tax = dto.tax || 0
      const total = dto.total ?? Math.max(0, subtotal - discountAmount + tax)

      const budgetData = {
        budget_number: budgetNumber,
        patient_id: dto.patient_id || null,
        patient_name: dto.patient_name || null,
        patient_phone: dto.patient_phone || null,
        patient_email: dto.patient_email || null,
        patient_id_number: dto.patient_id_number || null,
        clinic_id: dto.clinic_id || null,
        issue_date: dto.issue_date || new Date().toISOString().split('T')[0],
        valid_until: dto.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax,
        total,
        payment_modality: dto.payment_modality || 'single_payment',
        down_payment_amount: dto.down_payment_amount || 0,
        installments_count: dto.installments_count || 1,
        payment_frequency: dto.payment_frequency || 'monthly',
        status: dto.status || 'draft',
        notes: dto.notes || null,
        terms_and_conditions: dto.terms_and_conditions || null,
        patient_signature_url: dto.patient_signature_url || null,
        patient_signed_at: dto.patient_signed_at || null,
        patient_signed_name: dto.patient_signed_name || null,
        patient_signed_id_doc: dto.patient_signed_id_doc || null,
        patient_signed_role: dto.patient_signed_role || 'patient',
        doctor_signature_url: dto.doctor_signature_url || null,
        doctor_signed_at: dto.doctor_signed_at || null,
        doctor_signed_name: dto.doctor_signed_name || null,
      }

      const { data: newBudget, error: budgetError } = await supabase
        .from('budgets')
        .insert(budgetData as never)
        .select()
        .single()

      if (budgetError) throw budgetError

      const budgetId = (newBudget as unknown as Budget).id

      // Insert Items
      if (dto.items && dto.items.length > 0) {
        const itemsToInsert = dto.items.map((it) => ({
          budget_id: budgetId,
          procedure_id: it.procedure_id || null,
          name: it.name,
          category: it.category || null,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount || 0,
          total: it.total ?? (it.quantity * it.unit_price - (it.discount || 0)),
          sessions_estimated: it.sessions_estimated || 1,
          notes: it.notes || null,
        }))

        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(itemsToInsert as never)

        if (itemsError) throw itemsError
      }

      // Insert Installments if specified
      if (dto.installments && dto.installments.length > 0) {
        const installmentsToInsert = dto.installments.map((inst, idx) => ({
          budget_id: budgetId,
          installment_number: inst.installment_number || idx + 1,
          concept: inst.concept,
          due_date: inst.due_date || null,
          amount: inst.amount,
          status: 'pending',
        }))

        const { error: instError } = await supabase
          .from('budget_installments')
          .insert(installmentsToInsert as never)

        if (instError) throw instError
      }

      return newBudget as unknown as Budget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // 2. Update Budget
  const updateBudget = useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateBudgetDTO }) => {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      }

      if (dto.patient_id !== undefined) updatePayload.patient_id = dto.patient_id
      if (dto.patient_name !== undefined) updatePayload.patient_name = dto.patient_name
      if (dto.patient_phone !== undefined) updatePayload.patient_phone = dto.patient_phone
      if (dto.patient_email !== undefined) updatePayload.patient_email = dto.patient_email
      if (dto.patient_id_number !== undefined) updatePayload.patient_id_number = dto.patient_id_number
      if (dto.clinic_id !== undefined) updatePayload.clinic_id = dto.clinic_id
      if (dto.valid_until !== undefined) updatePayload.valid_until = dto.valid_until
      if (dto.subtotal !== undefined) updatePayload.subtotal = dto.subtotal
      if (dto.discount_percent !== undefined) updatePayload.discount_percent = dto.discount_percent
      if (dto.discount_amount !== undefined) updatePayload.discount_amount = dto.discount_amount
      if (dto.tax !== undefined) updatePayload.tax = dto.tax
      if (dto.total !== undefined) updatePayload.total = dto.total
      if (dto.payment_modality !== undefined) updatePayload.payment_modality = dto.payment_modality
      if (dto.down_payment_amount !== undefined) updatePayload.down_payment_amount = dto.down_payment_amount
      if (dto.installments_count !== undefined) updatePayload.installments_count = dto.installments_count
      if (dto.payment_frequency !== undefined) updatePayload.payment_frequency = dto.payment_frequency
      if (dto.status !== undefined) updatePayload.status = dto.status
      if (dto.notes !== undefined) updatePayload.notes = dto.notes
      if (dto.terms_and_conditions !== undefined) updatePayload.terms_and_conditions = dto.terms_and_conditions
      if (dto.patient_signature_url !== undefined) updatePayload.patient_signature_url = dto.patient_signature_url
      if (dto.patient_signed_at !== undefined) updatePayload.patient_signed_at = dto.patient_signed_at
      if (dto.patient_signed_name !== undefined) updatePayload.patient_signed_name = dto.patient_signed_name
      if (dto.patient_signed_id_doc !== undefined) updatePayload.patient_signed_id_doc = dto.patient_signed_id_doc
      if (dto.patient_signed_role !== undefined) updatePayload.patient_signed_role = dto.patient_signed_role
      if (dto.doctor_signature_url !== undefined) updatePayload.doctor_signature_url = dto.doctor_signature_url
      if (dto.doctor_signed_at !== undefined) updatePayload.doctor_signed_at = dto.doctor_signed_at
      if (dto.doctor_signed_name !== undefined) updatePayload.doctor_signed_name = dto.doctor_signed_name

      const { data, error } = await supabase
        .from('budgets')
        .update(updatePayload as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // If items are provided, replace existing items
      if (dto.items) {
        await supabase.from('budget_items').delete().eq('budget_id', id)
        if (dto.items.length > 0) {
          const itemsToInsert = dto.items.map((it) => ({
            budget_id: id,
            procedure_id: it.procedure_id || null,
            name: it.name,
            category: it.category || null,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount: it.discount || 0,
            total: it.total ?? (it.quantity * it.unit_price - (it.discount || 0)),
            sessions_estimated: it.sessions_estimated || 1,
            notes: it.notes || null,
          }))
          await supabase.from('budget_items').insert(itemsToInsert as never)
        }
      }

      // If installments are provided, replace existing installments (unless they are invoiced)
      if (dto.installments) {
        await supabase.from('budget_installments').delete().eq('budget_id', id).eq('status', 'pending')
        if (dto.installments.length > 0) {
          const installmentsToInsert = dto.installments.map((inst, idx) => ({
            budget_id: id,
            installment_number: inst.installment_number || idx + 1,
            concept: inst.concept,
            due_date: inst.due_date || null,
            amount: inst.amount,
            status: 'pending',
          }))
          await supabase.from('budget_installments').insert(installmentsToInsert as never)
        }
      }

      return data as unknown as Budget
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget', variables.id] })
    },
  })

  // 3. Change Budget Status
  const changeBudgetStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BudgetStatus }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Budget
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget', variables.id] })
    },
  })

  // 4. Delete Budget
  const deleteBudget = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })

  // 5. Invoicing: Generate Invoice from Budget or Installment
  const invoiceBudgetOrInstallment = useMutation({
    mutationFn: async (params: {
      budget_id: string
      patient_id: string
      clinic_id?: string
      installment_id?: string
      description?: string
      amount: number
      items?: Array<{ procedure_id?: string; description: string; quantity: number; unit_price: number }>
      discount?: number
      tax?: number
      payment_modality?: PaymentModality
      immediate_payment?: boolean
      payment_method?: string
      reference_number?: string
      notes?: string
    }) => {
      const {
        budget_id,
        patient_id,
        clinic_id,
        installment_id,
        description,
        amount,
        items,
        discount = 0,
        tax = 0,
        payment_modality = 'single_payment',
        immediate_payment = false,
        payment_method = 'cash',
        reference_number,
        notes,
      } = params

      const invoiceNumber = `FAC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      const total = Math.max(0, amount - discount + tax)

      // A. Create Invoice in `invoices`
      const invoiceData = {
        invoice_number: invoiceNumber,
        patient_id,
        clinic_id: clinic_id || null,
        budget_id,
        budget_installment_id: installment_id || null,
        payment_modality,
        subtotal: amount,
        discount,
        tax,
        total,
        balance_due: total,
        status: 'issued',
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        notes: notes || (installment_id ? `Facturación de cuota de presupuesto` : `Facturación de presupuesto`),
      }

      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert(invoiceData as never)
        .select()
        .single()

      if (invError) throw invError

      const newInvoiceId = (invoice as any).id

      // B. Create Invoice Items
      const lineItems = items && items.length > 0
        ? items.map((it) => ({
            invoice_id: newInvoiceId,
            procedure_id: it.procedure_id || null,
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
            total: it.quantity * it.unit_price,
          }))
        : [
            {
              invoice_id: newInvoiceId,
              description: description || 'Pago de tratamiento odontológico s/ presupuesto',
              quantity: 1,
              unit_price: amount,
              total: amount,
            },
          ]

      const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems as never)
      if (itemsError) throw itemsError

      // C. If immediate payment, record payment
      if (immediate_payment && total > 0) {
        const { error: payError } = await supabase.from('payments_received').insert({
          invoice_id: newInvoiceId,
          patient_id,
          clinic_id: clinic_id || null,
          amount: total,
          payment_method,
          reference_number: reference_number || null,
          notes: `Cobro en recepción al facturar presupuesto.`,
        } as never)

        if (payError) throw payError

        await supabase
          .from('invoices')
          .update({ balance_due: 0, status: 'paid' } as never)
          .eq('id', newInvoiceId)
      }

      // D. Update installment if applicable
      if (installment_id) {
        await supabase
          .from('budget_installments')
          .update({
            invoice_id: newInvoiceId,
            status: immediate_payment ? 'paid' : 'invoiced',
          } as never)
          .eq('id', installment_id)
      }

      // E. Check overall budget progress and update status
      const { data: allInstallments } = await supabase
        .from('budget_installments')
        .select('id, status')
        .eq('budget_id', budget_id)

      const instList = allInstallments || []
      let newBudgetStatus: BudgetStatus = 'partially_invoiced'

      if (instList.length > 0) {
        const allCompleted = instList.every((inst: any) =>
          inst.id === installment_id ? true : (inst.status === 'invoiced' || inst.status === 'paid')
        )
        if (allCompleted) {
          newBudgetStatus = 'invoiced'
        }
      } else {
        // Single payment full invoice
        newBudgetStatus = 'invoiced'
      }

      await supabase
        .from('budgets')
        .update({
          status: newBudgetStatus,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', budget_id)

      return invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['accounting-summary'] })
    },
  })

  // 6. Sign Budget (Digital Signature with touch support)
  const signBudget = useMutation({
    mutationFn: async ({
      budgetId,
      signatureDataUrl,
      signerName,
      signerIdDoc,
      signerRole = 'patient',
      doctorSignatureUrl,
      doctorSignedName,
    }: SignBudgetDTO) => {
      const now = new Date().toISOString()
      const updatePayload: Record<string, any> = {
        patient_signature_url: signatureDataUrl,
        patient_signed_at: now,
        patient_signed_name: signerName,
        patient_signed_id_doc: signerIdDoc || null,
        patient_signed_role: signerRole || 'patient',
        updated_at: now,
      }

      if (doctorSignatureUrl) {
        updatePayload.doctor_signature_url = doctorSignatureUrl
        updatePayload.doctor_signed_at = now
        if (doctorSignedName) updatePayload.doctor_signed_name = doctorSignedName
      }

      // Check current budget status: if it was draft or sent, automatically transition to approved
      const { data: currentBudget } = await supabase
        .from('budgets')
        .select('status')
        .eq('id', budgetId)
        .single()

      if (currentBudget && ((currentBudget as any).status === 'draft' || (currentBudget as any).status === 'sent')) {
        updatePayload.status = 'approved'
      }

      const { data, error } = await supabase
        .from('budgets')
        .update(updatePayload as never)
        .eq('id', budgetId)
        .select()
        .single()

      if (error) throw error
      return data as unknown as Budget
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget', variables.budgetId] })
    },
  })

  return {
    createBudget: createBudget.mutateAsync,
    isCreating: createBudget.isPending,
    updateBudget: updateBudget.mutateAsync,
    isUpdating: updateBudget.isPending,
    changeBudgetStatus: changeBudgetStatus.mutateAsync,
    isChangingStatus: changeBudgetStatus.isPending,
    deleteBudget: deleteBudget.mutateAsync,
    isDeleting: deleteBudget.isPending,
    invoiceBudgetOrInstallment: invoiceBudgetOrInstallment.mutateAsync,
    isInvoicing: invoiceBudgetOrInstallment.isPending,
    signBudget: signBudget.mutateAsync,
    isSigning: signBudget.isPending,
  }
}
