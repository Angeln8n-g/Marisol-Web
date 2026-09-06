import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { usePatients } from '../../../hooks/usePatients'
import { usePricing, type ProcedurePricingItem } from '../../../hooks/usePricing'
import { useClinics } from '../../../hooks/useClinics'
import { useBudgetMutations } from '../../../hooks/useBudgets'
import { BudgetPaymentPlanForm } from './BudgetPaymentPlanForm'
import { BudgetPrintView } from './BudgetPrintView'
import { BudgetSignaturePad, type BudgetSignatureData } from './BudgetSignaturePad'
import { openBudgetPrintWindow } from '../../../lib/budgetPrintUtils'
import type {
  Budget,
  PaymentModality,
  PaymentFrequency,
  BudgetStatus,
  CreateBudgetItemDTO,
  CreateBudgetInstallmentDTO,
} from '../../../types'

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  budgetToEdit?: Budget | null
  onSaved?: (budget: Budget) => void
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
  onSaved,
}) => {
  const { patients } = usePatients({ pageSize: 200 })
  const { currentPrices: pricingCatalog } = usePricing()
  const { activeClinics } = useClinics()
  const { createBudget, updateBudget, isCreating, isUpdating } = useBudgetMutations()

  // Tabs: 'data' (Editor) vs 'preview' (Print/PDF) vs 'signature' (Firma Táctil)
  const [activeTab, setActiveTab] = useState<'data' | 'preview' | 'signature'>('data')
  const [error, setError] = useState<string | null>(null)

  // Step 1: Patient & Clinic
  const [isManualPatient, setIsManualPatient] = useState<boolean>(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [patientName, setPatientName] = useState<string>('')
  const [patientPhone, setPatientPhone] = useState<string>('')
  const [patientEmail, setPatientEmail] = useState<string>('')
  const [patientIdNumber, setPatientIdNumber] = useState<string>('')
  const [clinicId, setClinicId] = useState<string>('')
  const [validDays, setValidDays] = useState<number>(30)
  const [status, setStatus] = useState<BudgetStatus>('draft')

  // Digital Signature State
  const [patientSignatureUrl, setPatientSignatureUrl] = useState<string | null>(null)
  const [patientSignedAt, setPatientSignedAt] = useState<string | null>(null)
  const [patientSignedName, setPatientSignedName] = useState<string | null>(null)
  const [patientSignedIdDoc, setPatientSignedIdDoc] = useState<string | null>(null)
  const [patientSignedRole, setPatientSignedRole] = useState<'patient' | 'guardian' | 'representative'>('patient')

  // Step 2: Line Items
  const [items, setItems] = useState<CreateBudgetItemDTO[]>([])
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [taxPercent, setTaxPercent] = useState<number>(0)

  // Step 3: Payment Modality & Installments
  const [modality, setModality] = useState<PaymentModality>('single_payment')
  const [downPayment, setDownPayment] = useState<number>(0)
  const [installmentsCount, setInstallmentsCount] = useState<number>(3)
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly')
  const [installments, setInstallments] = useState<CreateBudgetInstallmentDTO[]>([])

  // Step 4: Notes
  const [notes, setNotes] = useState<string>(
    'Incluye revisiones de control post-tratamiento. Los tratamientos de ortodoncia e implantes requieren estudios radiográficos previos.'
  )
  const [terms, setTerms] = useState<string>(
    'Formas de pago aceptadas: Efectivo, Tarjeta de Crédito/Débito, Transferencia Bancaria y Cobertura de Seguros Médicos. Las cuotas programadas deben ser saldadas en las fechas límites convenidas.'
  )

  // Calculations
  const subtotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  )
  const discountAmount = subtotal * (Math.max(0, Math.min(100, Number(discountPercent) || 0)) / 100)
  const taxAmount = (subtotal - discountAmount) * (Math.max(0, Math.min(100, Number(taxPercent) || 0)) / 100)
  const total = Math.max(0, subtotal - discountAmount + taxAmount)

  // Initialize or Reset
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setActiveTab('data')

      if (budgetToEdit) {
        setSelectedPatientId(budgetToEdit.patient_id || '')
        setIsManualPatient(!budgetToEdit.patient_id)
        setPatientName(budgetToEdit.patient?.full_name || budgetToEdit.patient_name || '')
        setPatientPhone(budgetToEdit.patient?.phone || budgetToEdit.patient_phone || '')
        setPatientEmail(budgetToEdit.patient?.email || budgetToEdit.patient_email || '')
        setPatientIdNumber(budgetToEdit.patient?.identification_number || budgetToEdit.patient_id_number || '')
        setClinicId(budgetToEdit.clinic_id || (activeClinics[0]?.id || ''))
        setStatus(budgetToEdit.status)
        setDiscountPercent(budgetToEdit.discount_percent || 0)
        setModality(budgetToEdit.payment_modality || 'single_payment')
        setDownPayment(Number(budgetToEdit.down_payment_amount) || 0)
        setInstallmentsCount(budgetToEdit.installments_count || 3)
        setFrequency(budgetToEdit.payment_frequency || 'monthly')
        setNotes(budgetToEdit.notes || '')
        setTerms(budgetToEdit.terms_and_conditions || '')

        // Load signature
        setPatientSignatureUrl(budgetToEdit.patient_signature_url || null)
        setPatientSignedAt(budgetToEdit.patient_signed_at || null)
        setPatientSignedName(budgetToEdit.patient_signed_name || null)
        setPatientSignedIdDoc(budgetToEdit.patient_signed_id_doc || null)
        setPatientSignedRole((budgetToEdit.patient_signed_role as any) || 'patient')

        if (budgetToEdit.items && budgetToEdit.items.length > 0) {
          setItems(
            budgetToEdit.items.map((it) => ({
              procedure_id: it.procedure_id || undefined,
              name: it.name,
              category: it.category || undefined,
              quantity: Number(it.quantity),
              unit_price: Number(it.unit_price),
              discount: Number(it.discount) || 0,
              total: Number(it.total),
              sessions_estimated: it.sessions_estimated || 1,
              notes: it.notes || undefined,
            }))
          )
        } else {
          setItems([{ name: '', quantity: 1, unit_price: 0 }])
        }

        if (budgetToEdit.installments && budgetToEdit.installments.length > 0) {
          setInstallments(
            budgetToEdit.installments.map((inst) => ({
              installment_number: inst.installment_number,
              concept: inst.concept,
              due_date: inst.due_date || undefined,
              amount: Number(inst.amount),
            }))
          )
        } else {
          setInstallments([
            {
              installment_number: 1,
              concept: 'Pago Único de Contado',
              amount: Number(budgetToEdit.total),
              due_date: new Date().toISOString().split('T')[0],
            },
          ])
        }
      } else {
        // New budget
        setIsManualPatient(false)
        setSelectedPatientId('')
        setPatientName('')
        setPatientPhone('')
        setPatientEmail('')
        setPatientIdNumber('')
        setDiscountPercent(0)
        setTaxPercent(0)
        setStatus('draft')
        setModality('single_payment')
        setDownPayment(0)
        setInstallmentsCount(3)
        setFrequency('monthly')
        setPatientSignatureUrl(null)
        setPatientSignedAt(null)
        setPatientSignedName(null)
        setPatientSignedIdDoc(null)
        setPatientSignedRole('patient')
        if (activeClinics.length > 0) setClinicId(activeClinics[0].id)

        setItems([{ name: '', quantity: 1, unit_price: 0 }])
        setInstallments([])
      }
    }
  }, [isOpen, budgetToEdit, activeClinics])

  // Select patient handler
  const handleSelectPatient = (pId: string) => {
    setSelectedPatientId(pId)
    const p = patients.find((item) => item.id === pId)
    if (p) {
      setPatientName(p.full_name)
      setPatientPhone(p.phone || '')
      setPatientEmail(p.email || '')
      setPatientIdNumber(p.identification_number || '')
    }
  }

  // Procedure catalog selection
  const handleSelectProcedure = (index: number, procedureId: string) => {
    const item = pricingCatalog.find((p: ProcedurePricingItem) => p.procedure_id === procedureId)
    if (!item) return

    setItems((prev) => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        procedure_id: item.procedure_id,
        name: item.procedure.name,
        category: item.procedure.category,
        unit_price: item.price || 0,
        sessions_estimated: (item.procedure as any).estimated_sessions || 1,
      }
      return updated
    })
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        name: '',
        quantity: 1,
        unit_price: 0,
        sessions_estimated: 1,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof CreateBudgetItemDTO, val: any) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: val }
      return updated
    })
  }

  const totalSessionsCount = items.reduce((acc, it) => acc + (it.sessions_estimated || 1), 0)

  // Save budget
  const handleSave = async (targetStatus?: BudgetStatus) => {
    if (!patientName.trim()) {
      setError('Debes especificar el nombre del paciente o seleccionar uno de la lista.')
      return
    }

    const validItems = items.filter((it) => it.name.trim() && it.unit_price > 0)
    if (validItems.length === 0) {
      setError('Debes agregar al menos un tratamiento con descripción y precio válido.')
      return
    }

    // Check installments balance
    const sumInstallments = installments.reduce((acc, it) => acc + (Number(it.amount) || 0), 0)
    if (Math.abs(total - sumInstallments) > 1) {
      setError(
        `El cronograma de pagos no coincide con el total presupuestado. Total: RD$ ${total.toLocaleString()} vs Cuotas: RD$ ${sumInstallments.toLocaleString()}. Por favor revisa el cronograma en la sección de Modalidades.`
      )
      return
    }

    setError(null)

    const validUntilDate = new Date()
    validUntilDate.setDate(validUntilDate.getDate() + validDays)

    const budgetDTO = {
      patient_id: isManualPatient ? null : selectedPatientId || null,
      patient_name: patientName.trim(),
      patient_phone: patientPhone.trim() || undefined,
      patient_email: patientEmail.trim() || undefined,
      patient_id_number: patientIdNumber.trim() || undefined,
      clinic_id: clinicId || undefined,
      valid_until: validUntilDate.toISOString().split('T')[0],
      subtotal,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      tax: taxAmount,
      total,
      payment_modality: modality,
      down_payment_amount: downPayment,
      installments_count: installmentsCount,
      payment_frequency: frequency,
      status: targetStatus || status,
      notes: notes.trim() || undefined,
      terms_and_conditions: terms.trim() || undefined,
      patient_signature_url: patientSignatureUrl || undefined,
      patient_signed_at: patientSignedAt || undefined,
      patient_signed_name: patientSignedName || undefined,
      patient_signed_id_doc: patientSignedIdDoc || undefined,
      patient_signed_role: patientSignedRole || undefined,
      items: validItems,
      installments,
    }

    try {
      let savedBudget: Budget
      if (budgetToEdit) {
        savedBudget = await updateBudget({ id: budgetToEdit.id, dto: budgetDTO as any })
      } else {
        savedBudget = await createBudget(budgetDTO as any)
      }
      onSaved?.(savedBudget)
      onClose()
    } catch (err: any) {
      console.error('Error guardando presupuesto:', err)
      setError(err.message || 'Error al guardar el presupuesto.')
    }
  }

  const handleSaveSignature = (sigData: BudgetSignatureData) => {
    setPatientSignatureUrl(sigData.signatureDataUrl)
    setPatientSignedAt(new Date().toISOString())
    setPatientSignedName(sigData.signerName)
    setPatientSignedIdDoc(sigData.signerIdDoc)
    setPatientSignedRole(sigData.signerRole)
    setStatus('approved')
    setActiveTab('preview')
  }

  const handleSendWhatsApp = () => {
    if (!patientPhone) {
      alert('Por favor especifica el número de teléfono del paciente.')
      return
    }

    const itemsSummary = items
      .filter((it) => it.name.trim())
      .map((it) => `• ${it.quantity}x ${it.name} - RD$ ${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString()}`)
      .join('\n')

    const installmentsSummary = installments
      .map((inst) => `  ${inst.installment_number}. ${inst.concept}: RD$ ${Number(inst.amount).toLocaleString()}`)
      .join('\n')

    const message = `Hola ${patientName || 'Estimado/a paciente'},\n\nLe compartimos el presupuesto odontológico formal expedido por la Dra. Marisol García:\n\n*Tratamientos Presupuestados:*\n${itemsSummary}\n\n*Total:* RD$ ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n*Modalidad de Pago:* ${modality === 'installments' ? 'Inicial + Cuotas' : modality === 'per_session' ? 'Por Cita' : 'Contado'}\n${installmentsSummary}\n\nPara iniciar su tratamiento o coordinar su cita, responda a este mensaje.`

    const phoneClean = patientPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneClean.length === 10 ? '1' + phoneClean : phoneClean}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleOpenCleanPrint = () => {
    openBudgetPrintWindow({
      budget: {
        budget_number: budgetToEdit?.budget_number || 'COT-PROVISIONAL',
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        patient_id_number: patientIdNumber,
        clinic: selectedClinic,
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0],
        subtotal,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax: taxAmount,
        total,
        payment_modality: modality,
        installments_count: installmentsCount,
        payment_frequency: frequency,
        notes,
        terms_and_conditions: terms,
        patient_signature_url: patientSignatureUrl,
        patient_signed_at: patientSignedAt,
        patient_signed_name: patientSignedName,
        patient_signed_id_doc: patientSignedIdDoc,
        patient_signed_role: patientSignedRole,
        items: items as any,
        installments: installments as any,
      },
      clinicName: selectedClinic?.name,
      clinicAddress: selectedClinic?.address,
      clinicPhone: selectedClinic?.phone,
    })
  }

  const selectedClinic = activeClinics.find((c) => c.id === clinicId)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? `Editar Presupuesto ${budgetToEdit.budget_number}` : 'Nuevo Presupuesto Odontológico'}
      size="xl"
    >
      <div className="font-montserrat space-y-4">
        {/* Navigation Tabs between Form and Print Preview */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'data'
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1. Edición y Modalidades
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'preview'
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2. Vista Previa & PDF
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signature')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'signature'
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>✍️ 3. Firma Digital</span>
              {patientSignatureUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Firmado digitalmente" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-sm"
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleOpenCleanPrint}
                  className="px-3.5 py-1.5 bg-gold hover:bg-gold/90 text-navy font-bold text-xs rounded-md flex items-center gap-1.5 shadow-sm"
                  title="Abrir presupuesto oficial e imprimir / guardar en PDF"
                >
                  <span>🖨️</span> Imprimir / PDF
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md">
            {error}
          </div>
        )}

        {/* TAB 1: FORM DATA */}
        {activeTab === 'data' ? (
          <div className="space-y-4 text-xs">
            {/* Paciente y Sede */}
            <div className="bg-sand/20 border border-gold/30 rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy uppercase tracking-wider">
                  Datos del Paciente & Sede
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualPatient(!isManualPatient)}
                  className="text-xs text-gold hover:underline font-semibold"
                >
                  {isManualPatient ? '← Seleccionar de pacientes registrados' : '+ Paciente prospecto / No registrado'}
                </button>
              </div>

              {!isManualPatient ? (
                <div>
                  <label className="block font-semibold text-navy mb-1">
                    Buscar paciente registrado:
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} {p.phone ? `(${p.phone})` : ''} {p.identification_number ? `· Doc: ${p.identification_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-navy mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="ej. María Rosario"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-navy mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="809-555-1234"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-navy mb-1">Cédula / Pasaporte</label>
                    <input
                      type="text"
                      value={patientIdNumber}
                      onChange={(e) => setPatientIdNumber(e.target.value)}
                      placeholder="001-0000000-0"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-gold/20">
                <div>
                  <label className="block font-semibold text-navy mb-1">Sede Clínica</label>
                  <select
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                  >
                    {activeClinics.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-navy mb-1">Validez del Presupuesto</label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                  >
                    <option value={15}>15 días</option>
                    <option value={30}>30 días (Recomendado)</option>
                    <option value={45}>45 días</option>
                    <option value={60}>60 días</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-navy mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BudgetStatus)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white font-bold"
                  >
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviado al Paciente</option>
                    <option value="approved">Aprobado por el Paciente</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Procedimientos y Precios */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Tratamientos y Procedimientos Odontológicos
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-gold font-semibold hover:underline flex items-center gap-1"
                >
                  + Agregar tratamiento
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-200"
                  >
                    {/* Catalog selector */}
                    <select
                      value={item.procedure_id || ''}
                      onChange={(e) => handleSelectProcedure(index, e.target.value)}
                      className="w-1/3 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-navy focus:ring-1 focus:ring-gold"
                    >
                      <option value="">(Catálogo de Precios)</option>
                      {pricingCatalog.map((p: ProcedurePricingItem) => (
                        <option key={p.procedure_id} value={p.procedure_id}>
                          {p.procedure.name} ({p.price ? `$${p.price.toLocaleString()}` : 'Sin precio'})
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      placeholder="Descripción del procedimiento"
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                      required
                    />

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1.5 text-xs border border-gray-300 rounded text-center bg-white"
                      title="Cantidad"
                    />

                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-right"
                        title="Precio Unitario"
                      />
                    </div>

                    <div className="w-24 text-right text-xs font-semibold text-navy px-1 font-mono">
                      RD$ {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-navy mb-1">Descuento Global (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-navy mb-1">ITBIS / Impuesto (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">RD$ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Descuento ({discountPercent}%):</span>
                      <span className="font-mono">-RD$ {discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>ITBIS ({taxPercent}%):</span>
                      <span className="font-mono">+RD$ {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-navy pt-1.5 border-t border-gray-300">
                    <span>Total Presupuestado:</span>
                    <span className="text-gold font-mono">RD$ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE DISPOSICIONES Y MODALIDADES DE PAGO */}
            <div className="pt-2 border-t border-gray-200">
              <BudgetPaymentPlanForm
                totalBudget={total}
                modality={modality}
                onModalityChange={setModality}
                downPayment={downPayment}
                onDownPaymentChange={setDownPayment}
                installmentsCount={installmentsCount}
                onInstallmentsCountChange={setInstallmentsCount}
                frequency={frequency}
                onFrequencyChange={setFrequency}
                installments={installments}
                onInstallmentsChange={setInstallments}
                sessionsCount={totalSessionsCount}
              />
            </div>

            {/* Observaciones y Términos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block font-medium text-navy mb-1">Observaciones Clínicas</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block font-medium text-navy mb-1">Términos de Pago y Garantías</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Botones de Pie */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cerrar
              </button>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signature')}
                  className="px-3.5 py-2 text-xs font-bold text-navy bg-gold/20 hover:bg-gold/30 border border-gold/40 rounded-md flex items-center gap-1.5"
                >
                  <span>✍️</span> Firmar con Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className="px-3.5 py-2 text-xs font-semibold text-navy bg-sand/40 hover:bg-sand/60 border border-gold/30 rounded-md"
                >
                  Ver Vista Previa →
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  disabled={isCreating || isUpdating}
                  className="px-4 py-2 text-xs font-semibold text-navy bg-gray-200 hover:bg-gray-300 rounded-md"
                >
                  Guardar como Borrador
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('approved')}
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-gold hover:bg-gold/90 rounded-md shadow-sm"
                >
                  {isCreating || isUpdating ? 'Guardando...' : 'Guardar y Aprobar'}
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'preview' ? (
          /* TAB 2: PRINT PREVIEW & PDF */
          <div className="space-y-4">
            <BudgetPrintView
              budget={{
                budget_number: budgetToEdit?.budget_number || 'COT-PROVISIONAL',
                patient_name: patientName,
                patient_phone: patientPhone,
                patient_email: patientEmail,
                patient_id_number: patientIdNumber,
                clinic: selectedClinic,
                issue_date: new Date().toISOString().split('T')[0],
                valid_until: new Date(Date.now() + validDays * 86400000).toISOString().split('T')[0],
                subtotal,
                discount_percent: discountPercent,
                discount_amount: discountAmount,
                tax: taxAmount,
                total,
                payment_modality: modality,
                installments_count: installmentsCount,
                payment_frequency: frequency,
                notes,
                terms_and_conditions: terms,
                patient_signature_url: patientSignatureUrl,
                patient_signed_at: patientSignedAt,
                patient_signed_name: patientSignedName,
                patient_signed_id_doc: patientSignedIdDoc,
                patient_signed_role: patientSignedRole,
                items: items as any,
                installments: installments as any,
              }}
              onSignRequest={() => setActiveTab('signature')}
              showActions={false}
            />

            <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                ← Volver a Modificar
              </button>
              <div className="flex flex-wrap gap-2">
                {!patientSignatureUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('signature')}
                    className="px-4 py-2 bg-gold hover:bg-gold/90 text-navy font-bold text-xs rounded-md shadow-sm flex items-center gap-1.5"
                  >
                    <span>✍️</span> Firmar en Pantalla Táctil
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-sm"
                >
                  Enviar por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleOpenCleanPrint}
                  className="px-4 py-2 bg-gold hover:bg-gold/90 text-navy font-bold text-xs rounded-md shadow-sm flex items-center gap-1.5"
                  title="Abrir presupuesto oficial e imprimir / guardar en PDF"
                >
                  <span>🖨️</span> Imprimir / Guardar en PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(status)}
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 bg-navy hover:bg-navy/90 text-white text-xs font-bold rounded-md shadow-sm"
                >
                  {isCreating || isUpdating ? 'Guardando...' : 'Guardar Presupuesto'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 3: DIGITAL TOUCHSCREEN SIGNATURE */
          <div className="space-y-4">
            {patientSignatureUrl ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-3">
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  ✓ Presupuesto Firmado Digitalmente
                </span>
                <div className="border border-dashed border-emerald-300 rounded-lg p-3 bg-white max-w-sm mx-auto shadow-xs">
                  <img
                    src={patientSignatureUrl}
                    alt="Firma del paciente"
                    className="h-24 mx-auto object-contain"
                  />
                </div>
                <div className="text-xs text-navy font-bold">
                  {patientSignedName || patientName}
                  <span className="font-normal text-gray-500 ml-1">
                    ({patientSignedRole === 'guardian' ? 'Tutor Legal' : 'Paciente Titular'})
                  </span>
                </div>
                {patientSignedIdDoc && (
                  <div className="text-[11px] text-gray-500">Documento: {patientSignedIdDoc}</div>
                )}
                <div className="flex justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setPatientSignatureUrl(null)}
                    className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold rounded-md transition-colors"
                  >
                    Borrar y Volver a Firmar
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className="px-4 py-1.5 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-md transition-colors"
                  >
                    Ver Vista Previa Membretada →
                  </button>
                </div>
              </div>
            ) : (
              <BudgetSignaturePad
                initialSignerName={patientName}
                initialSignerIdDoc={patientIdNumber}
                initialSignerRole={patientSignedRole}
                onSave={handleSaveSignature}
                onCancel={() => setActiveTab('data')}
                title="Firma Digital en Pantalla Táctil"
                description="Haga que el paciente o tutor firme directamente en la pantalla para formalizar la aprobación"
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
