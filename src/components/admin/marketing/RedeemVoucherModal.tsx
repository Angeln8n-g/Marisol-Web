import React, { useState, useEffect } from 'react'
import { Modal } from '../../ui'
import { useMarketingVouchers, useMarketingMutations } from '../../../hooks/useMarketing'
import type { MarketingVoucher } from '../../../types'
import { formatDate } from '../../../lib/utils'

interface RedeemVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  initialVoucher?: MarketingVoucher | null
  onRedeemed?: (voucher: MarketingVoucher) => void
}

export const RedeemVoucherModal: React.FC<RedeemVoucherModalProps> = ({
  isOpen,
  onClose,
  initialVoucher,
  onRedeemed,
}) => {
  const { redeemVoucher, isRedeemingVoucher } = useMarketingMutations()
  const [searchCode, setSearchCode] = useState<string>('')
  const [selectedVoucher, setSelectedVoucher] = useState<MarketingVoucher | null>(null)
  const [notes, setNotes] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean>(false)

  // Query vouchers for search
  const { data: allVouchers = [] } = useMarketingVouchers({ status: 'all' })

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false)
      setErrorMessage(null)
      setNotes('')
      if (initialVoucher) {
        setSelectedVoucher(initialVoucher)
        setSearchCode(initialVoucher.voucher_code)
      } else {
        setSelectedVoucher(null)
        setSearchCode('')
      }
    }
  }, [isOpen, initialVoucher])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const code = searchCode.trim().toUpperCase()
    if (!code) return

    const found = allVouchers.find((v) => v.voucher_code.toUpperCase() === code)
    if (!found) {
      setErrorMessage(`No se encontró ningún voucher con el código "${code}". Verifica el código ingresado.`)
      setSelectedVoucher(null)
      return
    }

    setSelectedVoucher(found)
  }

  const handleConfirmRedeem = async () => {
    if (!selectedVoucher) return
    setErrorMessage(null)

    if (selectedVoucher.status === 'redeemed') {
      setErrorMessage('Este voucher ya fue canjeado anteriormente.')
      return
    }

    if (selectedVoucher.status === 'cancelled') {
      setErrorMessage('Este voucher ha sido cancelado.')
      return
    }

    try {
      const redeemed = await redeemVoucher({
        id: selectedVoucher.id,
        notes: notes.trim() || undefined,
      })

      setIsSuccess(true)
      onRedeemed?.(redeemed)
    } catch (err: any) {
      console.error('Error redeeming voucher:', err)
      setErrorMessage(err.message || 'Error al canjear el voucher.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Validar y Canjear Voucher Odontológico"
      size="md"
    >
      <div className="space-y-4 font-montserrat text-xs">
        {!isSuccess ? (
          <>
            {/* Search Code Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Ingresa el código (ej. BOUCH-2026-XXXX)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono font-bold text-navy uppercase focus:ring-1 focus:ring-gold focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-navy hover:bg-navy/90 text-white font-semibold rounded-lg transition-colors"
              >
                Buscar
              </button>
            </form>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {errorMessage}
              </div>
            )}

            {/* Voucher Details if found */}
            {selectedVoucher && (
              <div className="bg-sand/20 border border-gold/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gold">Voucher Encontrado</span>
                    <h4 className="font-playfair font-bold text-navy text-sm mt-0.5">
                      {selectedVoucher.title}
                    </h4>
                    <p className="font-mono text-xs font-bold text-navy mt-1">
                      Código: {selectedVoucher.voucher_code}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedVoucher.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : selectedVoucher.status === 'redeemed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedVoucher.status === 'active' ? '● Válido' : selectedVoucher.status === 'redeemed' ? 'Ya Canjeado' : 'Inactivo'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gold/20">
                  <div>
                    <span className="text-gray-500">Beneficiario:</span>
                    <p className="font-semibold text-navy">{selectedVoucher.beneficiary_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Beneficio:</span>
                    <p className="font-bold text-gold text-xs">
                      {selectedVoucher.discount_type === 'percentage'
                        ? `${selectedVoucher.discount_value}% de Descuento`
                        : `RD$ ${Number(selectedVoucher.discount_value).toLocaleString()} de Descuento`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Válido hasta:</span>
                    <p className="font-medium text-navy">{formatDate(selectedVoucher.expiration_date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tratamiento:</span>
                    <p className="font-medium text-navy">{selectedVoucher.procedure?.name || 'Cualquier procedimiento'}</p>
                  </div>
                </div>

                {/* Redemption notes */}
                {selectedVoucher.status === 'active' && (
                  <div className="pt-2 border-t border-gold/20">
                    <label className="block font-semibold text-navy mb-1">
                      Nota de canje (ej. N° de factura, cita atendida):
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Canjeado en cita de profilaxis, factura FAC-2026-..."
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-md bg-white focus:ring-1 focus:ring-gold"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
              {selectedVoucher && selectedVoucher.status === 'active' && (
                <button
                  type="button"
                  onClick={handleConfirmRedeem}
                  disabled={isRedeemingVoucher}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isRedeemingVoucher ? 'Canjeando...' : 'Aplicar y Canjear Voucher'}
                </button>
              )}
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-playfair font-bold text-navy">¡Voucher Canjeado Exitosamente!</h4>
              <p className="text-xs text-gray-500 mt-1">
                El beneficio ha sido registrado en el sistema y descontado de la cuenta del paciente.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/90 transition-colors"
              >
                Listo, Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
