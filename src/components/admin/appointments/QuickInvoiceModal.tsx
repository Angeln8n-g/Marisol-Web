import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { useAccountingMutations } from '../../../hooks/useAccounting'
import { usePricing, type ProcedurePricingItem } from '../../../hooks/usePricing'
import { useBudgets } from '../../../hooks/useBudgets'
import { supabase } from '../../../lib/supabase'
import type { Appointment, Invoice } from '../../../types'
import { formatDateTime, formatDate } from '../../../lib/utils'
import { openReceiptPrintWindow } from '../../../lib/receiptPrintUtils'

interface QuickInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onInvoiceCreated?: (invoiceId: string) => void
}

interface InvoiceLineItem {
  id: string
  procedure_id?: string
  description: string
  quantity: number
  unit_price: number
}

export const QuickInvoiceModal: React.FC<QuickInvoiceModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onInvoiceCreated,
}) => {
  const { createInvoice, registerPaymentReceived } = useAccountingMutations()
  const { currentPrices: pricingItems } = usePricing()
  const { data: patientBudgets = [] } = useBudgets({
    patientId: appointment?.patient_id,
    status: 'approved',
  })

  const [items, setItems] = useState<InvoiceLineItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('')
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('')
  const [isImmediatePayment, setIsImmediatePayment] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [referenceNumber, setReferenceNumber] = useState<string>('')

  // State after success
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; invoice_number: string; total: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Single-invoice condition: Check if appointment already has an invoice
  const [existingInvoice, setExistingInvoice] = useState<Invoice | null>(null)
  const [checkingExisting, setCheckingExisting] = useState<boolean>(false)

  // Pre-fill on appointment change or modal open
  useEffect(() => {
    let isCancelled = false

    if (appointment && isOpen) {
      setErrorMessage(null)
      setCreatedInvoice(null)
      setIsSubmitting(false)
      setDiscount(0)
      setTax(0)
      setIsImmediatePayment(true)
      setPaymentMethod('cash')
      setReferenceNumber('')
      setSelectedBudgetId('')
      setSelectedInstallmentId('')
      setNotes(`Atención odontológica cita ${formatDateTime(appointment.scheduled_at)}`)

      // Check if appointment is already billed
      setCheckingExisting(true)
      setExistingInvoice(null)

      const checkExisting = async () => {
        try {
          let query = supabase
            .from('invoices')
            .select('*, items:invoice_items(*), patient:patients(full_name, phone, identification_number)')

          if (appointment.invoice_id) {
            query = query.eq('id', appointment.invoice_id)
          } else {
            query = query.eq('appointment_id', appointment.id)
          }

          const { data, error } = await query.maybeSingle()
          if (!isCancelled) {
            if (data && !error) {
              setExistingInvoice(data as unknown as Invoice)
            } else {
              setExistingInvoice(null)
            }
          }
        } catch (err) {
          console.error('Error checking existing invoice for appointment:', err)
        } finally {
          if (!isCancelled) {
            setCheckingExisting(false)
          }
        }
      }

      checkExisting()

      // Find procedure price in catalog
      const procPricing = pricingItems.find((p: ProcedurePricingItem) => p.procedure_id === appointment.procedure_id)
      const unitPrice = procPricing?.price || 0

      setItems([
        {
          id: Math.random().toString(36).substring(7),
          procedure_id: appointment.procedure_id || undefined,
          description: appointment.procedure?.name || 'Consulta Odontológica',
          quantity: 1,
          unit_price: unitPrice,
        },
      ])
    }

    return () => {
      isCancelled = true
    }
  }, [appointment?.id, isOpen])

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        description: '',
        quantity: 1,
        unit_price: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcedureSelect = (index: number, procedureId: string) => {
    const selected = pricingItems.find((p: ProcedurePricingItem) => p.procedure_id === procedureId)
    if (!selected) return

    setItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        procedure_id: selected.procedure_id,
        description: selected.procedure.name,
        unit_price: selected.price || 0,
      }
      return updated
    })
  }

  const handleItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
  const total = Math.max(0, subtotal - Number(discount) + Number(tax))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appointment) return

    // Single-invoice condition guard: prevent duplicate billing
    if (existingInvoice || appointment.billing_status === 'billed') {
      setErrorMessage('Esta cita ya ha sido facturada previamente. Para evitar cobros duplicados, no se permite crear otra factura para esta misma cita.')
      return
    }

    if (items.length === 0) {
      setErrorMessage('Debes agregar al menos un ítem o tratamiento a la factura.')
      return
    }

    const hasInvalidItem = items.some((it) => !it.description.trim() || it.quantity <= 0 || it.unit_price < 0)
    if (hasInvalidItem) {
      setErrorMessage('Por favor verifica que todos los conceptos tengan descripción válida y cantidades mayores a 0.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // 1. Create Invoice linked to this appointment
      const newInvoice = (await createInvoice({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
        budget_id: selectedBudgetId || undefined,
        budget_installment_id: selectedInstallmentId || undefined,
        items: items.map((it) => ({
          procedure_id: it.procedure_id,
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        notes: notes.trim() || undefined,
      })) as unknown as { id: string; invoice_number: string; total: number }

      // 2. If immediate payment, record payment
      if (isImmediatePayment && total > 0) {
        await registerPaymentReceived({
          invoice_id: newInvoice.id,
          patient_id: appointment.patient_id,
          clinic_id: appointment.clinic_id,
          amount: total,
          payment_method: paymentMethod,
          reference_number: referenceNumber.trim() || undefined,
          notes: `Cobro en recepción al completar la cita.`,
        })
      }

      setCreatedInvoice(newInvoice)
      onInvoiceCreated?.(newInvoice.id)
    } catch (err: any) {
      console.error('Error creating invoice:', err)
      setErrorMessage(err.message || 'Error al generar la factura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePrintExistingReceipt = () => {
    if (!existingInvoice || !appointment) return

    const invoiceItems = (existingInvoice as any).items || []
    const patientDoc = (existingInvoice as any).patient?.identification_number || appointment.patient?.identification_number || ''
    const patientName = (existingInvoice as any).patient?.full_name || appointment.patient?.full_name || 'Paciente'
    const patientPhone = (existingInvoice as any).patient?.phone || appointment.patient?.phone || ''

    openReceiptPrintWindow({
      invoiceNumber: existingInvoice.invoice_number,
      issueDate: existingInvoice.issue_date || existingInvoice.created_at,
      patientName,
      patientPhone,
      patientIdDoc: patientDoc,
      clinicName: appointment.clinic?.name || 'Clínica Odontológica Dra. Marisol',
      clinicAddress: appointment.clinic?.address || 'Calle Federico Geraldino 84, Piantini, Santo Domingo',
      clinicPhone: appointment.clinic?.phone || '(809) 555-0199',
      doctorName: appointment.assigned_doctor || 'Dra. Marisol',
      procedureName: appointment.procedure?.name || (invoiceItems[0]?.description) || 'Consulta Odontológica',
      appointmentDate: formatDateTime(appointment.scheduled_at),
      items: invoiceItems.length > 0 ? invoiceItems.map((it: any) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      })) : [{
        description: appointment.procedure?.name || 'Consulta Odontológica',
        quantity: 1,
        unit_price: existingInvoice.total,
        total: existingInvoice.total,
      }],
      subtotal: existingInvoice.subtotal ?? existingInvoice.total,
      discount: existingInvoice.discount ?? 0,
      tax: existingInvoice.tax ?? 0,
      total: existingInvoice.total,
      paymentMethod: (existingInvoice as any).payment_method || 'cash',
      referenceNumber: (existingInvoice as any).reference_number || undefined,
      isPaid: existingInvoice.status === 'paid',
      notes: existingInvoice.notes || undefined,
    })
  }

  const handlePrintReceipt = () => {
    if (!createdInvoice || !appointment) return

    openReceiptPrintWindow({
      invoiceNumber: createdInvoice.invoice_number,
      issueDate: new Date().toISOString(),
      patientName: appointment.patient?.full_name || 'Paciente',
      patientPhone: appointment.patient?.phone || '',
      patientIdDoc: appointment.patient?.identification_number || '',
      clinicName: appointment.clinic?.name || 'Clínica Odontológica Dra. Marisol',
      clinicAddress: appointment.clinic?.address || 'Calle Federico Geraldino 84, Piantini, Santo Domingo',
      clinicPhone: appointment.clinic?.phone || '(809) 555-0199',
      doctorName: appointment.assigned_doctor || 'Dra. Marisol',
      procedureName: appointment.procedure?.name || items[0]?.description || 'Consulta Odontológica',
      appointmentDate: formatDateTime(appointment.scheduled_at),
      items: items.map((it) => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      })),
      subtotal,
      discount: Number(discount) || 0,
      tax: Number(tax) || 0,
      total: createdInvoice.total,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      isPaid: isImmediatePayment,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingInvoice ? 'Comprobante de Cita Facturada' : 'Facturar Cita Odontológica'}
      size="lg"
    >
      {checkingExisting ? (
        <div className="py-12 text-center text-gray-500 font-montserrat flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-xs">Verificando estado de facturación de la cita...</p>
        </div>
      ) : existingInvoice ? (
        <div className="py-2 space-y-4 font-montserrat">
          {/* Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-navy">Cita Ya Facturada</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                Esta cita odontológica ya cuenta con una factura oficial registrada. Para garantizar la integridad contable y evitar duplicidad de cobros, no se permite crear una segunda factura para la misma cita.
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-sand/20 border border-gold/30 rounded-xl p-4 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500">Factura N°:</p>
                <p className="font-mono font-bold text-navy text-sm mt-0.5">{existingInvoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Estado:</p>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                    existingInvoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : existingInvoice.status === 'partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {existingInvoice.status === 'paid' ? 'Cobrada / Pagada' : existingInvoice.status === 'partial' ? 'Pago Parcial' : 'Pendiente de Cobro'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Fecha de Emisión:</p>
                <p className="font-medium text-navy mt-0.5">{formatDate(existingInvoice.issue_date || existingInvoice.created_at)}</p>
              </div>
              <div>
                <p className="text-gray-500">Monto Total:</p>
                <p className="font-bold text-gold text-sm mt-0.5">${existingInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-gray-500">Paciente:</p>
                <p className="font-semibold text-navy mt-0.5">{(existingInvoice as any).patient?.full_name || appointment?.patient?.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Procedimiento / Motivo:</p>
                <p className="font-semibold text-navy mt-0.5">{appointment?.procedure?.name || (existingInvoice as any).items?.[0]?.description || 'Consulta Odontológica'}</p>
              </div>
            </div>

            {/* Existing Items */}
            {((existingInvoice as any).items?.length || 0) > 0 && (
              <div className="pt-3 border-t border-gold/20">
                <p className="text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Conceptos Facturados:</p>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {(existingInvoice as any).items.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{item.description} (x{item.quantity})</span>
                      <span className="font-medium text-navy">${((item.quantity || 1) * (item.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrintExistingReceipt}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Ver / Imprimir Recibo Oficial</span>
            </button>
          </div>
        </div>
      ) : !createdInvoice ? (
        <form onSubmit={handleSubmit} className="space-y-4 font-montserrat">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
              {errorMessage}
            </div>
          )}

          {/* Appointment and Patient Banner */}
          <div className="bg-sand/30 border border-gold/30 rounded-lg p-3 text-xs grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-500">Paciente:</p>
              <p className="font-semibold text-navy mt-0.5">{appointment?.patient?.full_name || '—'}</p>
              {appointment?.patient?.phone && (
                <p className="text-[11px] text-gray-500">{appointment.patient.phone}</p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Sede / Clínica:</p>
              <p className="font-semibold text-navy mt-0.5">{appointment?.clinic?.name || '—'}</p>
              <p className="text-[11px] text-gray-500">{formatDateTime(appointment?.scheduled_at)}</p>
            </div>
          </div>

          {/* Vincular con Presupuesto Aprobado si existe */}
          {patientBudgets.length > 0 && (
            <div className="bg-sand/20 border border-gold/40 rounded-lg p-2.5 text-xs space-y-2">
              <label className="block font-bold text-navy text-[11px]">
                💡 Imputar cobro a Presupuesto del Paciente (Opcional):
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => {
                  setSelectedBudgetId(e.target.value)
                  setSelectedInstallmentId('')
                }}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
              >
                <option value="">-- Facturación Independiente de la Cita (Sin Presupuesto) --</option>
                {patientBudgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.budget_number} · Total: RD$ {Number(b.total).toLocaleString()} ({b.payment_modality})
                  </option>
                ))}
              </select>

              {selectedBudgetId && (() => {
                const selBudget = patientBudgets.find((b) => b.id === selectedBudgetId)
                const pendingInsts = (selBudget?.installments || []).filter((i) => i.status === 'pending')
                if (pendingInsts.length === 0) return null
                return (
                  <div className="pt-1.5 border-t border-gold/20">
                    <label className="block text-[11px] font-semibold text-navy mb-0.5">
                      Seleccionar Cuota Específica a Liquidar:
                    </label>
                    <select
                      value={selectedInstallmentId}
                      onChange={(e) => setSelectedInstallmentId(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                    >
                      <option value="">-- Liquidación general del presupuesto --</option>
                      {pendingInsts.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          Cuota #{inst.installment_number}: {inst.concept} (RD$ {Number(inst.amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Line items table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-navy uppercase tracking-wider">
                Conceptos / Procedimientos Realizados
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
              >
                + Agregar concepto
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-200">
                  {/* Quick procedure selector from pricing */}
                  <select
                    value={item.procedure_id || ''}
                    onChange={(e) => handleProcedureSelect(index, e.target.value)}
                    className="w-1/3 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-navy focus:ring-1 focus:ring-gold"
                  >
                    <option value="">(Personalizado o Catálogo)</option>
                    {pricingItems.map((p: ProcedurePricingItem) => (
                      <option key={p.procedure_id} value={p.procedure_id}>
                        {p.procedure.name} ({p.price ? `$${p.price.toLocaleString()}` : 'Sin precio'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Descripción del servicio"
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-gold"
                    required
                  />

                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1.5 text-xs border border-gray-300 rounded text-center bg-white focus:ring-1 focus:ring-gold"
                    title="Cantidad"
                  />

                  <div className="relative w-28">
                    <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-gold text-right"
                      title="Precio unitario"
                    />
                  </div>

                  <div className="w-24 text-right text-xs font-semibold text-navy px-1">
                    ${((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-gray-400 hover:text-red-600 p-1"
                      title="Quitar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adjustments & Totals */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Notas / Observaciones de Factura
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gold"
                />
              </div>

              {/* Payment Status Switch */}
              <div className="bg-sand/20 p-2.5 rounded-md border border-gold/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImmediatePayment}
                    onChange={(e) => setIsImmediatePayment(e.target.checked)}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="text-xs font-semibold text-navy">
                    Registrar cobro de inmediato (Generar recibo)
                  </span>
                </label>

                {isImmediatePayment && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gold/20">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-0.5">Método de Pago:</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                      >
                        <option value="cash">Efectivo</option>
                        <option value="credit_card">Tarjeta de Crédito</option>
                        <option value="debit_card">Tarjeta de Débito</option>
                        <option value="bank_transfer">Transferencia Bancaria</option>
                        <option value="insurance">Aseguradora</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-0.5">N° Referencia / Lote:</label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>Descuento aplicado ($):</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-1.5 py-0.5 text-xs border border-gray-300 rounded text-right bg-white"
                />
              </div>
              <div className="flex justify-between items-center text-gray-600">
                <span>ITBIS / Impuesto ($):</span>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-24 px-1.5 py-0.5 text-xs border border-gray-300 rounded text-right bg-white"
                />
              </div>
              <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-gray-300">
                <span>Total a Cobrar:</span>
                <span className="text-gold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || total < 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-gold hover:bg-gold/90 disabled:opacity-50 rounded-md transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isSubmitting ? 'Generando...' : isImmediatePayment ? 'Generar Factura y Cobro' : 'Generar Factura'}
            </button>
          </div>
        </form>
      ) : (
        /* Success Screen */
        <div className="text-center py-6 space-y-4 font-montserrat">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-playfair font-bold text-navy">¡Factura Generada Exitosamente!</h4>
            <p className="text-xs text-gray-600 mt-1">
              Comprobante N°: <span className="font-mono font-bold text-navy">{createdInvoice.invoice_number}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Monto total: <span className="font-semibold text-gold">${createdInvoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              {isImmediatePayment ? ' • Estado: Cobrado en caja' : ' • Estado: Emitida por cobrar'}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-3">
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir Recibo Oficial</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
