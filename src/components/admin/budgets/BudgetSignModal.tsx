import React, { useState } from 'react'
import { Modal } from '../../ui/Modal'
import { BudgetSignaturePad, type BudgetSignatureData } from './BudgetSignaturePad'
import { useBudgetMutations } from '../../../hooks/useBudgets'
import type { Budget } from '../../../types'
import { modalityDisplayNames } from '../../../lib/budgetPrintUtils'

interface BudgetSignModalProps {
  isOpen: boolean
  onClose: () => void
  budget: Budget | null
  onSuccess?: () => void
}

export const BudgetSignModal: React.FC<BudgetSignModalProps> = ({
  isOpen,
  onClose,
  budget,
  onSuccess,
}) => {
  const { signBudget, isSigning } = useBudgetMutations()
  const [error, setError] = useState<string | null>(null)

  if (!budget) return null

  const patientName = budget.patient?.full_name || budget.patient_name || ''
  const patientDoc = budget.patient?.identification_number || budget.patient_id_number || ''

  const handleSaveSignature = async (data: BudgetSignatureData) => {
    try {
      setError(null)
      await signBudget({
        budgetId: budget.id,
        signatureDataUrl: data.signatureDataUrl,
        signerName: data.signerName,
        signerIdDoc: data.signerIdDoc,
        signerRole: data.signerRole,
      })

      if (onSuccess) onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error al guardar la firma digital:', err)
      setError(err?.message || 'Ocurrió un error al registrar la firma digital.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Firma Digital de Presupuesto Odontológico"
      size="lg"
    >
      <div className="space-y-4 font-montserrat">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Resumen del Presupuesto */}
        <div className="bg-sand/20 border border-gold/30 rounded-xl p-4 text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold/20 pb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-gold block">Cotización Formal</span>
              <span className="text-sm font-bold font-mono text-navy">{budget.budget_number}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Total a Pagar</span>
              <span className="text-sm font-bold font-mono text-navy">
                RD$ {Number(budget.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-gray-700">
            <div>
              <span className="text-gray-500">Paciente:</span>{' '}
              <strong className="text-navy">{patientName}</strong>
            </div>
            <div>
              <span className="text-gray-500">Modalidad de Pago:</span>{' '}
              <strong className="text-navy">
                {modalityDisplayNames[budget.payment_modality] || 'Pago Único de Contado'}
              </strong>
            </div>
          </div>

          {budget.items && budget.items.length > 0 && (
            <div className="pt-1 border-t border-gold/20 text-[11px] text-gray-600">
              <span className="font-semibold text-navy">Tratamientos incluidos:</span>{' '}
              {budget.items.map((it) => it.name).filter(Boolean).join(', ')}
            </div>
          )}
        </div>

        {/* Signature Pad */}
        <BudgetSignaturePad
          initialSignerName={patientName}
          initialSignerIdDoc={patientDoc}
          initialSignerRole="patient"
          onSave={handleSaveSignature}
          onCancel={onClose}
          isSubmitting={isSigning}
          title="Firma del Paciente o Tutor Legal"
          description="Firme a continuación para confirmar la aceptación del presupuesto odontológico"
        />
      </div>
    </Modal>
  )
}
