import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { useMarketingMutations, useMarketingOffers } from '../../../hooks/useMarketing'
import { usePatients } from '../../../hooks/usePatients'
import { useProcedures } from '../../../hooks/useProcedures'
import type { MarketingVoucher } from '../../../types'

interface VoucherModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (voucher: MarketingVoucher) => void
}

type VoucherPreset = 'welcome' | 'gift' | 'birthday' | 'custom'

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { createVoucher, isCreatingVoucher } = useMarketingMutations()
  const { data: offers = [] } = useMarketingOffers()
  const { patients } = usePatients({ pageSize: 200 })
  const { procedures } = useProcedures()

  // Form State
  const [voucherCode, setVoucherCode] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [isRegisteredPatient, setIsRegisteredPatient] = useState<boolean>(false)
  const [patientId, setPatientId] = useState<string>('')
  const [beneficiaryName, setBeneficiaryName] = useState<string>('Al Portador')
  const [beneficiaryPhone, setBeneficiaryPhone] = useState<string>('')
  const [discountType, setDiscountType] = useState<'fixed_amount' | 'percentage'>('fixed_amount')
  const [discountValue, setDiscountValue] = useState<number>(2000)
  const [procedureId, setProcedureId] = useState<string>('')
  const [offerId, setOfferId] = useState<string>('')
  const [validDays, setValidDays] = useState<number>(45)
  const [expirationDate, setExpirationDate] = useState<string>('')
  const [terms, setTerms] = useState<string>(
    'Válido para una sola aplicación. No acumulable con otras promociones ni canjeable por dinero en efectivo. Requiere previa cita.'
  )
  const [notes, setNotes] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Initialize on open
  useEffect(() => {
    if (isOpen) {
      const year = new Date().getFullYear()
      const rand = Math.floor(1000 + Math.random() * 9000)
      setVoucherCode(`BOUCH-${year}-${rand}`)
      setTitle('Bono de Bienvenida Odontológico')
      setIsRegisteredPatient(false)
      setPatientId('')
      setBeneficiaryName('Al Portador')
      setBeneficiaryPhone('')
      setDiscountType('fixed_amount')
      setDiscountValue(2000)
      setProcedureId('')
      setOfferId('')
      setValidDays(45)

      const exp = new Date()
      exp.setDate(exp.getDate() + 45)
      setExpirationDate(exp.toISOString().split('T')[0])
      setNotes('Emitido desde el panel de marketing')
      setErrorMessage(null)
    }
  }, [isOpen])

  // Update expiration date when validDays changes
  const handleDaysChange = (days: number) => {
    setValidDays(days)
    const exp = new Date()
    exp.setDate(exp.getDate() + days)
    setExpirationDate(exp.toISOString().split('T')[0])
  }

  // Presets
  const applyPreset = (preset: VoucherPreset) => {
    const year = new Date().getFullYear()
    const rand = Math.floor(1000 + Math.random() * 9000)

    switch (preset) {
      case 'welcome':
        setVoucherCode(`BIENVENIDA-${rand}`)
        setTitle('Bono de Bienvenida: Primera Cita Odontológica')
        setDiscountType('fixed_amount')
        setDiscountValue(1500)
        setBeneficiaryName('Al Portador')
        handleDaysChange(30)
        break
      case 'gift':
        setVoucherCode(`GIFT-CARD-${rand}`)
        setTitle('Tarjeta de Regalo: Sonrisa Radiante')
        setDiscountType('fixed_amount')
        setDiscountValue(3000)
        setBeneficiaryName('')
        handleDaysChange(60)
        break
      case 'birthday':
        setVoucherCode(`CUMPLE-${rand}`)
        setTitle('Bono Especial de Cumpleaños Dental')
        setDiscountType('percentage')
        setDiscountValue(25)
        handleDaysChange(30)
        break
      case 'custom':
        setVoucherCode(`BOUCH-${year}-${rand}`)
        setTitle('Bono Promocional Personalizado')
        break
    }
  }

  const handlePatientSelect = (pId: string) => {
    setPatientId(pId)
    const p = patients.find((item) => item.id === pId)
    if (p) {
      setBeneficiaryName(p.full_name)
      setBeneficiaryPhone(p.phone || '')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!voucherCode.trim()) {
      setErrorMessage('Por favor especifica el código del voucher.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('Por favor especifica el título del bono o voucher.')
      return
    }

    if (!beneficiaryName.trim()) {
      setErrorMessage('Por favor especifica el nombre del beneficiario o escribe "Al Portador".')
      return
    }

    if (discountValue <= 0) {
      setErrorMessage('El valor del descuento debe ser mayor a 0.')
      return
    }

    if (!expirationDate) {
      setErrorMessage('Por favor selecciona la fecha de expiración.')
      return
    }

    try {
      const created = await createVoucher({
        voucher_code: voucherCode.toUpperCase().trim(),
        title: title.trim(),
        offer_id: offerId || null,
        procedure_id: procedureId || null,
        patient_id: isRegisteredPatient && patientId ? patientId : null,
        beneficiary_name: beneficiaryName.trim(),
        beneficiary_phone: beneficiaryPhone.trim() || null,
        discount_type: discountType,
        discount_value: Number(discountValue),
        expiration_date: expirationDate,
        status: 'active',
        terms: terms.trim() || undefined,
        notes: notes.trim() || undefined,
      })

      onCreated?.(created)
      onClose()
    } catch (err: any) {
      console.error('Error creating voucher:', err)
      setErrorMessage(err.message || 'Error al emitir el voucher.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emitir Voucher / Tarjeta de Regalo Dental"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-montserrat text-xs">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="block font-semibold text-navy mb-1.5">
            Plantillas rápidas de voucher:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => applyPreset('welcome')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gold/40 bg-sand/30 hover:bg-sand/60 text-navy transition-colors text-left"
            >
              🎉 Bienvenida (RD$ 1,500)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('gift')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gold/40 bg-sand/30 hover:bg-sand/60 text-navy transition-colors text-left"
            >
              🎁 Gift Card (RD$ 3,000)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('birthday')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gold/40 bg-sand/30 hover:bg-sand/60 text-navy transition-colors text-left"
            >
              🎂 Cumpleaños (25% OFF)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('custom')}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors text-left"
            >
              ✨ Personalizado
            </button>
          </div>
        </div>

        {/* Code and Title */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div>
            <label className="block font-semibold text-navy mb-1">
              Código Único *
            </label>
            <input
              type="text"
              required
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="BOUCH-2026-0001"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md font-mono font-bold text-gold uppercase bg-white focus:ring-1 focus:ring-gold"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-navy mb-1">
              Título / Motivo del Voucher *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. Bono de Descuento para Limpieza o Blanqueamiento"
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
            />
          </div>
        </div>

        {/* Beneficiary */}
        <div className="space-y-2.5 bg-sand/20 p-3.5 rounded-lg border border-gold/30">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-navy uppercase tracking-wider text-[11px]">
              Beneficiario del Voucher
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegisteredPatient(!isRegisteredPatient)
                if (!isRegisteredPatient) {
                  setBeneficiaryName('')
                } else {
                  setBeneficiaryName('Al Portador')
                }
              }}
              className="text-xs text-gold hover:underline font-semibold"
            >
              {isRegisteredPatient ? '← Cambiar a Al Portador / Prospecto' : '+ Seleccionar de Pacientes Registrados'}
            </button>
          </div>

          {isRegisteredPatient ? (
            <div>
              <label className="block font-medium text-gray-700 mb-1">Seleccionar Paciente:</label>
              <select
                value={patientId}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
              >
                <option value="">-- Buscar paciente --</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} {p.phone ? `(${p.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Nombre del Beneficiario *</label>
                <input
                  type="text"
                  required
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  placeholder="ej. Laura Mercedes Gómez (o 'Al Portador')"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-1">WhatsApp / Teléfono</label>
                <input
                  type="tel"
                  value={beneficiaryPhone}
                  onChange={(e) => setBeneficiaryPhone(e.target.value)}
                  placeholder="809-555-1234 (para envío directo)"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
                />
              </div>
            </div>
          )}
        </div>

        {/* Value and Applicability */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold text-navy mb-1">Tipo de Descuento</label>
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as any)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
            >
              <option value="fixed_amount">Monto Fijo (RD$ / USD)</option>
              <option value="percentage">Porcentaje (%)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">
              Valor del Beneficio *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold">
                {discountType === 'percentage' ? '%' : '$'}
              </span>
              <input
                type="number"
                min={1}
                required
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-md bg-white font-bold text-navy focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">Tratamiento Aplicable</label>
            <select
              value={procedureId}
              onChange={(e) => setProcedureId(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
            >
              <option value="">Cualquier Tratamiento</option>
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiration and Terms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-navy">Fecha de Vencimiento *</label>
              <div className="flex gap-1">
                {[30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaysChange(d)}
                    className={`px-1.5 py-0.5 text-[10px] rounded ${
                      validDays === d ? 'bg-navy text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              required
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">Vincular con Oferta (Opcional)</label>
            <select
              value={offerId}
              onChange={(e) => setOfferId(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
            >
              <option value="">Sin oferta vinculada</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.title} ({o.promo_code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Terms */}
        <div>
          <label className="block font-semibold text-navy mb-1">
            Términos y Condiciones del Bono
          </label>
          <textarea
            rows={2}
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
          />
        </div>

        {/* Actions */}
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
            disabled={isCreatingVoucher}
            className="px-5 py-2 text-xs font-bold text-white bg-gold hover:bg-gold/90 disabled:opacity-50 rounded-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {isCreatingVoucher ? 'Emitiendo Voucher...' : 'Emitir Voucher'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
