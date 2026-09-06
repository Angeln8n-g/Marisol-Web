import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { useAccountingMutations } from '../../../hooks/useAccounting'
import { usePricing, type ProcedurePricingItem } from '../../../hooks/usePricing'
import type { Appointment } from '../../../types'
import { formatDateTime } from '../../../lib/utils'

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

  const [items, setItems] = useState<InvoiceLineItem[]>([])
  const [discount, setDiscount] = useState<number>(0)
  const [tax, setTax] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isImmediatePayment, setIsImmediatePayment] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [referenceNumber, setReferenceNumber] = useState<string>('')

  // State after success
  const [createdInvoice, setCreatedInvoice] = useState<{ id: string; invoice_number: string; total: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Pre-fill on appointment change or modal open
  useEffect(() => {
    if (appointment && isOpen) {
      setErrorMessage(null)
      setCreatedInvoice(null)
      setIsSubmitting(false)
      setDiscount(0)
      setTax(0)
      setIsImmediatePayment(true)
      setPaymentMethod('cash')
      setReferenceNumber('')
      setNotes(`Atención odontológica cita ${formatDateTime(appointment.scheduled_at)}`)

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
  }, [appointment, isOpen, pricingItems])

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
      // 1. Create Invoice
      const newInvoice = (await createInvoice({
        patient_id: appointment.patient_id,
        clinic_id: appointment.clinic_id,
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Facturar Cita Odontológica"
      size="lg"
    >
      {!createdInvoice ? (
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
              onClick={() => window.print()}
              className="px-4 py-2 bg-navy text-white text-xs font-semibold rounded-md hover:bg-navy/90 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Recibo
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
