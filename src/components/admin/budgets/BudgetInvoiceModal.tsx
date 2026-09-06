import React, { useState } from 'react'
import { Modal } from '../../ui'
import { useBudgetMutations } from '../../../hooks/useBudgets'
import type { Budget, BudgetInstallment } from '../../../types'

interface BudgetInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  budget: Budget | null
  onSuccess?: () => void
}

export const BudgetInvoiceModal: React.FC<BudgetInvoiceModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSuccess,
}) => {
  const { invoiceBudgetOrInstallment, isInvoicing } = useBudgetMutations()

  // Invoicing Mode: 'installment' | 'full' | 'custom_items'
  const [mode, setMode] = useState<'installment' | 'full' | 'custom_items'>('installment')
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('')
  const [isImmediatePayment, setIsImmediatePayment] = useState<boolean>(true)
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')
  const [referenceNumber, setReferenceNumber] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Pending installments
  const pendingInstallments = (budget?.installments || []).filter(
    (inst) => inst.status === 'pending'
  )

  // Default installment on modal open
  React.useEffect(() => {
    if (budget && isOpen) {
      setError(null)
      setIsImmediatePayment(true)
      setPaymentMethod('cash')
      setReferenceNumber('')
      setNotes('')

      if (pendingInstallments.length > 0) {
        setMode('installment')
        setSelectedInstallmentId(pendingInstallments[0].id)
      } else {
        setMode('full')
        setSelectedInstallmentId('')
      }
    }
  }, [budget, isOpen])

  if (!budget) return null

  const selectedInstallment = budget.installments?.find((i) => i.id === selectedInstallmentId)

  // Calculate amount to invoice based on mode
  let invoiceAmount = 0
  let invoiceDescription = ''

  if (mode === 'installment') {
    invoiceAmount = selectedInstallment ? Number(selectedInstallment.amount) : 0
    invoiceDescription = selectedInstallment
      ? `${selectedInstallment.concept} - Presupuesto ${budget.budget_number}`
      : `Cuota de Presupuesto ${budget.budget_number}`
  } else if (mode === 'full') {
    invoiceAmount = Number(budget.total) || 0
    invoiceDescription = `Liquidación total Tratamientos Presupuesto ${budget.budget_number}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budget.patient_id) {
      setError('Para facturar, el presupuesto debe estar asignado a un paciente registrado en el sistema.')
      return
    }

    if (invoiceAmount <= 0) {
      setError('El monto a facturar debe ser mayor a 0.')
      return
    }

    setError(null)

    try {
      await invoiceBudgetOrInstallment({
        budget_id: budget.id,
        patient_id: budget.patient_id,
        clinic_id: budget.clinic_id || undefined,
        installment_id: mode === 'installment' ? selectedInstallmentId : undefined,
        description: invoiceDescription,
        amount: invoiceAmount,
        payment_modality: budget.payment_modality,
        immediate_payment: isImmediatePayment,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error('Error al facturar presupuesto:', err)
      setError(err.message || 'Error al generar la factura.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Facturar Presupuesto: ${budget.budget_number}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-montserrat text-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Resumen del Presupuesto */}
        <div className="bg-sand/30 border border-gold/30 rounded-lg p-3 grid grid-cols-2 gap-3">
          <div>
            <span className="text-gray-500 text-[11px] block">Paciente:</span>
            <span className="font-bold text-navy text-sm">
              {budget.patient?.full_name || budget.patient_name || 'Paciente'}
            </span>
            {(budget.patient?.phone || budget.patient_phone) && (
              <span className="text-gray-500 block">{budget.patient?.phone || budget.patient_phone}</span>
            )}
          </div>
          <div className="text-right">
            <span className="text-gray-500 text-[11px] block">Total Presupuesto:</span>
            <span className="font-bold text-gold text-sm font-mono">
              RD$ {Number(budget.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-gray-500 block">
              Modalidad: {budget.payment_modality === 'installments' ? 'Inicial + Cuotas' : budget.payment_modality}
            </span>
          </div>
        </div>

        {/* Selección de Modo de Facturación */}
        <div>
          <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
            Modalidad de Emisión de Factura
          </label>
          <div className="grid grid-cols-2 gap-2">
            {pendingInstallments.length > 0 && (
              <button
                type="button"
                onClick={() => setMode('installment')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  mode === 'installment'
                    ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-bold text-navy">Facturar Cuota / Anticipo</div>
                <div className="text-[11px] text-gray-500">
                  Cobrar cuota específica del plan ({pendingInstallments.length} pendientes)
                </div>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMode('full')}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                mode === 'full'
                  ? 'border-gold bg-gold/10 text-navy ring-1 ring-gold'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="font-bold text-navy">Facturar Presupuesto Completo</div>
              <div className="text-[11px] text-gray-500">
                Emitir factura única por el valor total de los tratamientos
              </div>
            </button>
          </div>
        </div>

        {/* Selector de Cuota Específica */}
        {mode === 'installment' && pendingInstallments.length > 0 && (
          <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <label className="block font-semibold text-navy">
              Seleccionar Cuota a Facturar:
            </label>
            <div className="space-y-1.5">
              {pendingInstallments.map((inst: BudgetInstallment) => (
                <label
                  key={inst.id}
                  className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedInstallmentId === inst.id
                      ? 'bg-white border-gold shadow-xs'
                      : 'bg-white/60 border-gray-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="installment"
                      value={inst.id}
                      checked={selectedInstallmentId === inst.id}
                      onChange={(e) => setSelectedInstallmentId(e.target.value)}
                      className="text-gold focus:ring-gold"
                    />
                    <div>
                      <span className="font-bold text-navy">#{inst.installment_number} {inst.concept}</span>
                      {inst.due_date && (
                        <span className="text-[11px] text-gray-400 block">Vencimiento: {inst.due_date}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-navy text-sm">
                    RD$ {Number(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Detalle y Monto */}
        <div className="bg-sand/10 p-3 rounded-lg border border-gold/20 flex justify-between items-center">
          <div>
            <span className="text-gray-500 block text-[11px]">Concepto de Factura:</span>
            <span className="font-semibold text-navy">{invoiceDescription}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 block text-[11px]">Total a Facturar:</span>
            <span className="font-bold text-gold text-base font-mono">
              RD$ {invoiceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Registro Inmediato de Pago */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isImmediatePayment}
              onChange={(e) => setIsImmediatePayment(e.target.checked)}
              className="rounded text-gold focus:ring-gold"
            />
            <span className="font-bold text-navy text-xs">
              Registrar cobro de inmediato en recepción (Emitir Recibo Pagado)
            </span>
          </label>

          {isImmediatePayment && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-[11px] font-medium text-navy mb-1">Método de Pago *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta de Crédito / Débito</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="insurance">Seguro Médico / ARS</option>
                  <option value="check">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-navy mb-1">N° Comprobante / Referencia</label>
                <input
                  type="text"
                  placeholder="ej. Voucher 98120"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Notas internas de la factura:</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional..."
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isInvoicing || invoiceAmount <= 0}
            className="px-5 py-2 text-xs font-bold text-white bg-gold hover:bg-gold/90 disabled:opacity-50 rounded-md shadow-sm flex items-center gap-1.5"
          >
            {isInvoicing ? 'Emitiendo Factura...' : isImmediatePayment ? 'Facturar y Cobrar' : 'Emitir Factura por Cobrar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
