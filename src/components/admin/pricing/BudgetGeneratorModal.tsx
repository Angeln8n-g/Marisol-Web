import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { usePatients } from '../../../hooks/usePatients'
import { usePricing, type ProcedurePricingItem } from '../../../hooks/usePricing'
import { useClinics } from '../../../hooks/useClinics'
import { formatDate } from '../../../lib/utils'

interface BudgetGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
}

interface BudgetItem {
  id: string
  procedure_id?: string
  name: string
  category?: string
  quantity: number
  unit_price: number
  notes?: string
}

export const BudgetGeneratorModal: React.FC<BudgetGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { patients } = usePatients({ pageSize: 200 })
  const { currentPrices: pricingCatalog } = usePricing()
  const { activeClinics } = useClinics()

  // Mode: Form vs Print Preview
  const [isPreview, setIsPreview] = useState<boolean>(false)

  // Header data
  const [budgetNumber, setBudgetNumber] = useState<string>('')
  const [clinicId, setClinicId] = useState<string>('')
  const [validDays, setValidDays] = useState<number>(30)

  // Patient data
  const [isManualPatient, setIsManualPatient] = useState<boolean>(false)
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [patientName, setPatientName] = useState<string>('')
  const [patientPhone, setPatientPhone] = useState<string>('')
  const [patientEmail, setPatientEmail] = useState<string>('')
  const [patientIdNumber, setPatientIdNumber] = useState<string>('')

  // Items
  const [items, setItems] = useState<BudgetItem[]>([])
  const [discountPercent, setDiscountPercent] = useState<number>(0)
  const [notes, setNotes] = useState<string>(
    'Incluye revisiones de control post-tratamiento. Los tratamientos de ortodoncia e implantes requieren estudios radiográficos previos.'
  )

  // Init when modal opens
  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      setBudgetNumber(`COT-${year}-${rand}`)
      setIsPreview(false)
      setIsManualPatient(false)
      setSelectedPatientId('')
      setPatientName('')
      setPatientPhone('')
      setPatientEmail('')
      setPatientIdNumber('')
      setDiscountPercent(0)
      if (activeClinics.length > 0) {
        setClinicId(activeClinics[0].id)
      }

      // Add 1 default empty item
      setItems([
        {
          id: Math.random().toString(36).substring(7),
          name: '',
          quantity: 1,
          unit_price: 0,
        },
      ])
    }
  }, [isOpen])

  // Automatically select first clinic if not yet set
  useEffect(() => {
    if (!clinicId && activeClinics.length > 0) {
      setClinicId(activeClinics[0].id)
    }
  }, [activeClinics, clinicId])

  // Handle patient selection from list
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

  // Handle procedure catalog item selection
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
      }
      return updated
    })
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: '',
        quantity: 1,
        unit_price: 0,
      },
    ])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof BudgetItem, val: any) => {
    setItems((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: val }
      return updated
    })
  }

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const discountAmount = subtotal * (Math.max(0, Math.min(100, Number(discountPercent) || 0)) / 100)
  const total = Math.max(0, subtotal - discountAmount)

  const selectedClinic = activeClinics.find((c) => c.id === clinicId) || activeClinics[0]
  const todayFormatted = formatDate(new Date().toISOString())
  const validUntilDate = new Date()
  validUntilDate.setDate(validUntilDate.getDate() + validDays)
  const validUntilFormatted = formatDate(validUntilDate.toISOString())

  const handlePrint = () => {
    window.print()
  }

  const handleSendWhatsApp = () => {
    if (!patientPhone) {
      alert('Por favor especifica el número de teléfono del paciente para enviar por WhatsApp.')
      return
    }

    const itemsSummary = items
      .filter((it) => it.name.trim())
      .map((it) => `• ${it.quantity}x ${it.name} - $${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString()}`)
      .join('\n')

    const message = `Hola ${patientName || 'Estimado/a paciente'},\n\nLe compartimos el presupuesto odontológico formal expedido por la Dra. Marisol García (${selectedClinic?.name || 'Clínica Odontológica'}):\n\nCotización: ${budgetNumber}\nVálido hasta: ${validUntilFormatted}\n\n*Tratamientos Propuestos:*\n${itemsSummary}\n\n*Total Presupuestado: $${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} DOP*\n\nSi desea iniciar su tratamiento o coordinar un plan de cuotas, por favor no dude en comunicarse con nosotros.`

    const phoneClean = patientPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneClean}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isPreview ? 'Vista Previa de Presupuesto Odontológico' : 'Generador de Presupuesto Odontológico'}
      size="xl"
    >
      <div className="font-montserrat">
        {/* Toggle between Form & Preview */}
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                !isPreview
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              1. Edición de Datos
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                isPreview
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              2. Vista Previa & Impresión
            </button>
          </div>

          {isPreview && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                </svg>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir / PDF
              </button>
            </div>
          )}
        </div>

        {/* EDIT MODE */}
        {!isPreview ? (
          <div className="space-y-4">
            {/* Patient & Clinic Selection Box */}
            <div className="bg-sand/20 border border-gold/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy uppercase tracking-wider">
                  Datos del Paciente & Sede
                </span>
                <button
                  type="button"
                  onClick={() => setIsManualPatient(!isManualPatient)}
                  className="text-xs text-gold hover:underline font-semibold"
                >
                  {isManualPatient ? '← Elegir de pacientes registrados' : '+ Paciente prospecto / No registrado'}
                </button>
              </div>

              {!isManualPatient ? (
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">
                    Buscar y seleccionar paciente:
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => handleSelectPatient(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
                  >
                    <option value="">-- Seleccionar Paciente --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} {p.phone ? `(${p.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="ej. María Rosario"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Teléfono / WhatsApp</label>
                    <input
                      type="tel"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="809-555-1234"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy mb-1">Cédula / Documento</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Sede / Sucursal</label>
                  <select
                    value={clinicId}
                    onChange={(e) => setClinicId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white"
                  >
                    {activeClinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Validez del Presupuesto</label>
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
                  <label className="block text-xs font-semibold text-navy mb-1">Descuento Global (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white text-right"
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
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

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-md border border-gray-200"
                  >
                    {/* Catalog selector */}
                    <select
                      value={item.procedure_id || ''}
                      onChange={(e) => handleSelectProcedure(index, e.target.value)}
                      className="w-2/5 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-navy focus:ring-1 focus:ring-gold"
                    >
                      <option value="">(Seleccionar de Catálogo de Precios)</option>
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
                      placeholder="Nombre del procedimiento o detalle"
                      className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
                      required
                    />

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 px-2 py-1.5 text-xs border border-gray-300 rounded text-center bg-white"
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
                        className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-300 rounded bg-white text-right"
                        title="Precio Unitario"
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
                        title="Eliminar ítem"
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

            {/* Notes & Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1">
                  Condiciones / Observaciones del Presupuesto
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal tratamientos:</span>
                  <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Descuento aplicado ({discountPercent}%):</span>
                    <span>-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-navy pt-2 border-t border-gray-300">
                  <span>Total Presupuestado:</span>
                  <span className="text-gold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DOP</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className="px-5 py-2 text-xs font-semibold text-white bg-gold hover:bg-gold/90 rounded-md flex items-center gap-1.5 shadow-sm"
              >
                Ver Presupuesto Formal e Imprimir →
              </button>
            </div>
          </div>
        ) : (
          /* PRINT PREVIEW MODE (Ready for window.print() and PDF export) */
          <div className="space-y-4">
            <div
              id="printable-budget"
              className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm print:p-0 print:border-none print:shadow-none font-montserrat text-navy"
            >
              {/* Header Letterhead */}
              <div className="flex justify-between items-start border-b-2 border-gold pb-5">
                <div>
                  <h2 className="text-2xl font-playfair font-bold text-navy tracking-wide">
                    DRA. MARISOL GARCÍA
                  </h2>
                  <p className="text-xs text-gold font-medium uppercase tracking-widest mt-0.5">
                    Odontología Especializada & Estética Dental
                  </p>
                  <p className="text-xs text-gray-500 mt-2">{selectedClinic?.name || 'Clínica Odontológica'}</p>
                  <p className="text-[11px] text-gray-400">{selectedClinic?.address}</p>
                  {selectedClinic?.phone && (
                    <p className="text-[11px] text-gray-400">Tel: {selectedClinic.phone}</p>
                  )}
                </div>

                <div className="text-right">
                  <div className="inline-block bg-sand/30 border border-gold/40 px-3 py-1.5 rounded text-right">
                    <span className="text-[10px] uppercase font-bold text-gold block">Presupuesto Formal</span>
                    <span className="text-sm font-mono font-bold text-navy">{budgetNumber}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Fecha: <span className="font-semibold text-navy">{todayFormatted}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Válido hasta: <span className="font-semibold text-navy">{validUntilFormatted}</span>
                  </p>
                </div>
              </div>

              {/* Patient Details Box */}
              <div className="grid grid-cols-2 gap-4 my-6 bg-sand/10 border border-gold/20 rounded p-4 text-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">Paciente:</span>
                  <span className="text-sm font-bold text-navy">{patientName || 'Paciente General'}</span>
                  {patientIdNumber && (
                    <p className="text-gray-600 mt-0.5">Doc / Cédula: {patientIdNumber}</p>
                  )}
                </div>
                <div className="text-right">
                  {patientPhone && (
                    <p className="text-gray-600">Teléfono: {patientPhone}</p>
                  )}
                  {patientEmail && (
                    <p className="text-gray-600">Email: {patientEmail}</p>
                  )}
                  <p className="text-gray-600 mt-1">Especialidad: Odontología Integral</p>
                </div>
              </div>

              {/* Treatments Table */}
              <table className="w-full text-xs border-collapse mb-6">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-2.5 font-bold uppercase tracking-wider text-gray-600 w-12 text-center">Cant.</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-gray-600">Descripción del Tratamiento</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-gray-600 text-right w-28">Precio Unit.</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-gray-600 text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items
                    .filter((it) => it.name.trim())
                    .map((it, idx) => (
                      <tr key={idx} className="py-2">
                        <td className="py-2.5 text-center font-semibold text-navy">{it.quantity}</td>
                        <td className="py-2.5">
                          <span className="font-medium text-navy block">{it.name}</span>
                          {it.category && (
                            <span className="text-[10px] text-gold">{it.category}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-700">
                          ${Number(it.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-navy">
                          ${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-1.5 text-xs bg-gray-50 p-3.5 rounded border border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-green-700 font-medium">
                      <span>Descuento ({discountPercent}%):</span>
                      <span className="font-mono">-${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span className="text-gold font-mono">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })} DOP</span>
                  </div>
                </div>
              </div>

              {/* Terms and conditions */}
              {notes && (
                <div className="text-[11px] text-gray-500 border-t border-gray-200 pt-3 mb-8">
                  <p className="font-bold text-gray-700 mb-1">Notas y Condiciones del Presupuesto:</p>
                  <p className="whitespace-pre-line leading-relaxed">{notes}</p>
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-12 pt-10 mt-6 border-t border-gray-200 text-center text-xs">
                <div>
                  <div className="border-b border-gray-400 w-48 mx-auto mb-1.5" />
                  <p className="font-bold text-navy">Dra. Marisol García</p>
                  <p className="text-[10px] text-gray-500">Odontóloga Especialista</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 w-48 mx-auto mb-1.5" />
                  <p className="font-bold text-navy">Firma de Aceptación</p>
                  <p className="text-[10px] text-gray-500">Paciente o Representante</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                ← Volver a Modificar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  Enviar Resumen por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-5 py-2 bg-navy hover:bg-navy/90 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm"
                >
                  Imprimir / Guardar en PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
