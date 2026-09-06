import React, { useState } from 'react'
import type { ProcedureTracking } from '../../../types'
import { formatDate } from '../../../lib/utils'
import { useProcedureTracking } from '../../../hooks/useProcedureTracking'

interface ProcedureTrackingTimelineProps {
  records: (ProcedureTracking & {
    patient?: { full_name: string; phone?: string }
    procedure?: { name: string; category?: string }
    budget?: { id: string; budget_number: string }
  })[]
}

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'En Progreso', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-700 border-green-200' },
  on_hold: { label: 'En Espera', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700 border-red-200' },
}

export const ProcedureTrackingTimeline: React.FC<ProcedureTrackingTimelineProps> = ({ records }) => {
  const today = new Date()
  const { billProcedureSession, isBillingProcedure } = useProcedureTracking()

  // State for billing a single procedure session
  const [billingTarget, setBillingTarget] = useState<ProcedureTracking | null>(null)
  const [billAmount, setBillAmount] = useState<number>(2000)
  const [billImmediate, setBillImmediate] = useState<boolean>(true)
  const [billMethod, setBillMethod] = useState<string>('cash')

  const getFollowupStyle = (nextDate: string | null): string | null => {
    if (!nextDate) return null
    const followup = new Date(nextDate)
    const diffDays = Math.ceil((followup.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return 'border-red-400 bg-red-50'
    if (diffDays <= 3) return 'border-yellow-400 bg-yellow-50'
    return null
  }

  const handleConfirmBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billingTarget || billAmount <= 0) return

    await billProcedureSession({
      tracking_id: billingTarget.id,
      patient_id: billingTarget.patient_id,
      procedure_id: billingTarget.procedure_id,
      procedure_name: (billingTarget as any).procedure?.name || 'Procedimiento Clínico',
      amount: Number(billAmount),
      immediate_payment: billImmediate,
      payment_method: billMethod,
      budget_id: billingTarget.budget_id || undefined,
    })

    setBillingTarget(null)
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
        <p className="text-sm text-gray-500 font-montserrat mt-3">No hay seguimientos de procedimientos</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record) => {
        const statusCfg = statusLabels[record.status] || { label: record.status, color: 'bg-gray-100 text-gray-700' }
        const followupStyle = getFollowupStyle(record.next_followup_date)
        const isBilled = record.billing_status === 'invoiced' || record.billing_status === 'paid'

        return (
          <div
            key={record.id}
            className={`bg-white rounded-lg border-2 p-4 transition-colors ${followupStyle || 'border-gray-200'}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-navy">
                    {record.procedure?.name || 'Procedimiento'}
                  </p>
                  {record.budget?.budget_number && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand text-navy border border-gold/30">
                      Presupuesto: {record.budget.budget_number}
                    </span>
                  )}
                </div>
                {record.patient && (
                  <p className="text-xs text-gray-500 font-montserrat">{record.patient.full_name}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Billing Status Badge */}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  record.billing_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : record.billing_status === 'invoiced'
                    ? 'bg-blue-100 text-blue-800'
                    : record.billing_status === 'included_in_budget'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {record.billing_status === 'paid'
                    ? 'Cobrado en Caja'
                    : record.billing_status === 'invoiced'
                    ? 'Facturado'
                    : record.billing_status === 'included_in_budget'
                    ? 'En Presupuesto'
                    : 'Pendiente Facturar'}
                </span>

                {/* Tracking Status Badge */}
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>

                {/* Quick Bill Action if unbilled */}
                {!isBilled && record.billing_status !== 'included_in_budget' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBillingTarget(record)
                      setBillAmount(2000)
                    }}
                    className="px-2.5 py-1 bg-gold text-white text-[11px] font-bold rounded hover:bg-gold/90 transition-colors shadow-xs"
                  >
                    Facturar Sesión
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-4 text-xs font-montserrat text-gray-500">
              {record.start_date && <span>Inicio: {formatDate(record.start_date)}</span>}
              {record.expected_end_date && <span>Fin estimado: {formatDate(record.expected_end_date)}</span>}
              {record.next_followup_date && (
                <span className={getFollowupStyle(record.next_followup_date) ? 'font-semibold text-amber-700' : ''}>
                  Próximo seguimiento: {formatDate(record.next_followup_date)}
                </span>
              )}
            </div>

            {record.progress_notes && (
              <p className="mt-2 text-xs text-gray-600 font-montserrat border-t border-gray-100 pt-2">
                {record.progress_notes}
              </p>
            )}
          </div>
        )
      })}

      {/* Modal: Facturar Sesión de Procedimiento */}
      {billingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-montserrat text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">
                Facturar Sesión de Procedimiento
              </h3>
              <button
                type="button"
                onClick={() => setBillingTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmBill} className="space-y-4">
              <div className="p-3 bg-sand/30 rounded-lg border border-gold/20">
                <span className="text-gray-500 block text-[11px]">Procedimiento:</span>
                <span className="font-bold text-navy text-sm block">
                  {(billingTarget as any).procedure?.name}
                </span>
                <span className="text-gray-600 mt-1 block">
                  Paciente: {(billingTarget as any).patient?.full_name}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Monto de la Sesión (RD$) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={billAmount}
                  onChange={(e) => setBillAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-1 focus:ring-gold"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billImmediate}
                    onChange={(e) => setBillImmediate(e.target.checked)}
                    className="rounded text-gold focus:ring-gold"
                  />
                  <span className="font-semibold text-navy">
                    Cobrar de inmediato (Generar recibo de cobro)
                  </span>
                </label>

                {billImmediate && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-[11px] font-medium text-navy mb-1">Método de Pago:</label>
                    <select
                      value={billMethod}
                      onChange={(e) => setBillMethod(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                    >
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta de Crédito / Débito</option>
                      <option value="transfer">Transferencia</option>
                      <option value="insurance">ARS / Seguro Médico</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBillingTarget(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBillingProcedure}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isBillingProcedure ? 'Emitiendo...' : 'Confirmar Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

