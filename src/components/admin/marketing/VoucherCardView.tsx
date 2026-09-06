import React, { useState } from 'react'
import { Modal } from '../../ui'
import type { MarketingVoucher } from '../../../types'
import { formatDate } from '../../../lib/utils'

interface VoucherCardViewProps {
  isOpen: boolean
  onClose: () => void
  voucher: MarketingVoucher | null
  onRedeemClick?: (voucher: MarketingVoucher) => void
}

export const VoucherCardView: React.FC<VoucherCardViewProps> = ({
  isOpen,
  onClose,
  voucher,
  onRedeemClick,
}) => {
  const [copied, setCopied] = useState(false)

  if (!voucher) return null

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.voucher_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  const whatsappMessage = encodeURIComponent(
    `¡Hola ${voucher.beneficiary_name}! Te compartimos este *Voucher Exclusivo de Regalo* de la clínica Dra. Marisol García:\n\n*${voucher.title}*\n🎟 Código: *${voucher.voucher_code}*\n💰 Beneficio: *${voucher.discount_type === 'percentage' ? `${voucher.discount_value}% OFF` : `RD$ ${Number(voucher.discount_value).toLocaleString()} de regalo`}*\n📅 Válido hasta: *${formatDate(voucher.expiration_date)}*\n\nPuedes presentarlo en recepción al agendar tu cita. ¡Esperamos verte pronto!`
  )

  const whatsappUrl = voucher.beneficiary_phone
    ? `https://wa.me/${voucher.beneficiary_phone.replace(/\D/g, '')}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tarjeta de Regalo / Voucher Odontológico"
      size="lg"
    >
      <div className="space-y-5 font-montserrat">
        {/* Printable Luxury Gift Card Container */}
        <div
          id="printable-voucher"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-[#1E2E52] to-[#121D36] text-white p-7 sm:p-9 shadow-xl border-2 border-gold/40"
        >
          {/* Decorative luxury corners and background ornaments */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-gold/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            {/* Card Header */}
            <div className="flex justify-between items-start border-b border-gold/30 pb-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-gold">
                  Certificado Exclusivo de Atención Dental
                </span>
                <h2 className="text-xl sm:text-2xl font-playfair font-bold text-white tracking-wide mt-0.5">
                  DRA. MARISOL GARCÍA
                </h2>
                <p className="text-[11px] text-gray-300">
                  Odontología Integral & Estética Dental de Vanguardia
                </p>
              </div>

              <div className="text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  voucher.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : voucher.status === 'redeemed'
                    ? 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  {voucher.status === 'active' ? 'Válido / Activo' : voucher.status === 'redeemed' ? 'Canjeado' : 'Vencido'}
                </span>
              </div>
            </div>

            {/* Voucher Body: Title & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-1">
                <h3 className="text-lg font-playfair font-bold text-sand">
                  {voucher.title}
                </h3>
                <p className="text-xs text-gray-300">
                  Beneficiario: <strong className="text-white">{voucher.beneficiary_name}</strong>
                </p>
                {voucher.procedure && (
                  <p className="text-xs text-gold/90">
                    Aplica a: <strong>{voucher.procedure.name}</strong>
                  </p>
                )}
              </div>

              {/* Big Value Badge */}
              <div className="text-center bg-sand/10 rounded-xl p-3 border border-gold/30 backdrop-blur-xs">
                <span className="text-[10px] uppercase tracking-wider text-gray-300 block">
                  Valor del Bono
                </span>
                <span className="text-2xl sm:text-3xl font-playfair font-bold text-gold">
                  {voucher.discount_type === 'percentage'
                    ? `${voucher.discount_value}%`
                    : `RD$ ${Number(voucher.discount_value).toLocaleString()}`}
                </span>
                <span className="text-[10px] text-gray-300 block">
                  {voucher.discount_type === 'percentage' ? 'De Descuento' : 'De Regalo'}
                </span>
              </div>
            </div>

            {/* Voucher Code and Expiry */}
            <div className="bg-black/25 rounded-xl p-3.5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  Código del Voucher (Presentar al agendar o pagar):
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-base sm:text-lg font-bold text-gold tracking-widest">
                    {voucher.voucher_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-[11px] text-gray-300 hover:text-white px-2 py-0.5 rounded bg-white/10 transition-colors"
                  >
                    {copied ? '✓ Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="text-right sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-white/10 pt-2 sm:pt-0">
                <span className="text-[10px] uppercase tracking-wider text-gray-400 block">
                  Fecha de Caducidad
                </span>
                <span className="text-xs font-semibold text-white">
                  {formatDate(voucher.expiration_date)}
                </span>
              </div>
            </div>

            {/* Terms */}
            {voucher.terms && (
              <p className="text-[10px] text-gray-400 leading-relaxed border-t border-white/10 pt-3">
                * {voucher.terms}
              </p>
            )}
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          {voucher.status === 'active' && onRedeemClick && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onRedeemClick(voucher)
              }}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Canjear este Voucher Ahora
            </button>
          )}

          <div className="flex gap-2 w-full sm:w-auto justify-end ml-auto">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
              </svg>
              Enviar por WhatsApp
            </a>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-navy hover:bg-navy/90 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir Tarjeta
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
