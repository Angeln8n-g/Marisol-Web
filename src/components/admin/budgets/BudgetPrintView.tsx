import React from 'react'
import type { Budget, BudgetItem, BudgetInstallment } from '../../../types'
import { formatDate } from '../../../lib/utils'
import { openBudgetPrintWindow, modalityDisplayNames } from '../../../lib/budgetPrintUtils'

interface BudgetPrintViewProps {
  budget: Partial<Budget> & {
    items?: BudgetItem[]
    installments?: BudgetInstallment[]
  }
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  doctorName?: string
  onSignRequest?: () => void
  showActions?: boolean
}

export const BudgetPrintView: React.FC<BudgetPrintViewProps> = ({
  budget,
  clinicName = 'Clínica Odontológica Dra. Marisol García',
  clinicAddress = 'Calle Federico Geraldino 84, Piantini, Santo Domingo, D.N.',
  clinicPhone = '(809) 555-1234',
  doctorName = 'Dra. Marisol García',
  onSignRequest,
  showActions = false,
}) => {
  const patientDisplayName = budget.patient?.full_name || budget.patient_name || 'Paciente'
  const patientPhone = budget.patient?.phone || budget.patient_phone || ''
  const patientEmail = budget.patient?.email || budget.patient_email || ''
  const patientIdNumber = budget.patient?.identification_number || budget.patient_id_number || ''

  const issueDateFormatted = budget.issue_date ? formatDate(budget.issue_date) : formatDate(new Date().toISOString())
  const validUntilFormatted = budget.valid_until ? formatDate(budget.valid_until) : '30 días desde emisión'

  const modalityText =
    budget.payment_modality === 'installments'
      ? `Inicial + Cuotas (${budget.installments_count || 1} Cuotas - ${
          budget.payment_frequency === 'weekly'
            ? 'Semanal'
            : budget.payment_frequency === 'biweekly'
            ? 'Quincenal'
            : 'Mensual'
        })`
      : modalityDisplayNames[budget.payment_modality || 'single_payment'] || 'Pago Único de Contado'

  const isSigned = Boolean(budget.patient_signature_url)

  const handleOpenCleanPrint = () => {
    openBudgetPrintWindow({
      budget,
      clinicName: budget.clinic?.name || clinicName,
      clinicAddress: budget.clinic?.address || clinicAddress,
      clinicPhone: budget.clinic?.phone || clinicPhone,
      doctorName,
    })
  }

  const handleSendWhatsApp = () => {
    const rawPhone = patientPhone.replace(/\D/g, '')
    if (!rawPhone) {
      alert('El paciente no tiene un número de teléfono válido registrado.')
      return
    }

    const itemsSummary = (budget.items || [])
      .filter((it) => it.name?.trim())
      .map((it) => `• ${it.quantity}x ${it.name} - RD$ ${((it.quantity || 1) * (it.unit_price || 0)).toLocaleString()}`)
      .join('\n')

    const message = `Hola ${patientDisplayName},\n\nLe compartimos el presupuesto odontológico formal expedido por la ${doctorName} (${budget.clinic?.name || clinicName}):\n\n*Cotización:* ${budget.budget_number || 'COT'}\n*Válido hasta:* ${validUntilFormatted}\n*Modalidad:* ${modalityText}\n\n*Tratamientos Presupuestados:*\n${itemsSummary}\n\n*Total a Pagar:* RD$ ${Number(budget.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n${
      isSigned ? '✓ Presupuesto formalmente aceptado y firmado digitalmente.' : 'Quedamos a su entera disposición para coordinar el inicio de su tratamiento.'
    }`

    window.open(`https://wa.me/${rawPhone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <div className="space-y-3 font-montserrat">
      {/* Barra de Herramientas en Pantalla (Oculta al imprimir) */}
      {showActions && (
        <div className="no-print flex flex-wrap items-center justify-between gap-2 p-2.5 bg-navy text-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gold font-playfair">Presupuesto Formal</span>
            <span className="font-mono bg-navy-light px-2 py-0.5 rounded text-[11px] font-bold text-sand">
              {budget.budget_number || 'COT'}
            </span>
            {isSigned ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-semibold text-[10px] border border-emerald-500/30">
                ✓ Firmado Digitalmente
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-semibold text-[10px] border border-amber-500/30">
                Pendiente de Firma
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isSigned && onSignRequest && (
              <button
                type="button"
                onClick={onSignRequest}
                className="px-3 py-1.5 bg-gold hover:bg-gold/90 text-navy font-bold rounded text-xs flex items-center gap-1 transition-colors shadow-xs"
              >
                <span>✍️</span> Firmar con Paciente
              </button>
            )}

            {patientPhone && (
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs flex items-center gap-1 transition-colors shadow-xs"
              >
                <span>💬</span> WhatsApp
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCleanPrint}
              className="px-3.5 py-1.5 bg-gold text-navy font-bold rounded text-xs flex items-center gap-1 hover:bg-gold/90 transition-colors shadow-xs"
              title="Abrir presupuesto oficial e imprimir / guardar en PDF"
            >
              <span>🖨️</span> Imprimir / PDF
            </button>
          </div>
        </div>
      )}

      {/* Documento Clínico Membretado Oficial (Diseño Compacto de 1 Página) */}
      <div
        id="printable-budget"
        className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm print:p-0 print:border-none print:shadow-none print:rounded-none font-montserrat text-navy space-y-3"
      >
        {/* Header Membrete Oficial */}
        <div className="flex justify-between items-start border-b-2 border-gold pb-3">
          <div className="flex items-start gap-3">
            {/* Emblema Odontológico Dorado */}
            <div className="w-10 h-10 rounded-lg bg-navy flex items-center justify-center flex-shrink-0 shadow-xs">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5A059" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 .5 4 1 6 .6 2.4 1.5 5.5 2.5 7.5.4.8 1.5.8 1.9 0 .8-1.6 1.6-4.5 2.6-7.5.5-2 1-4 1-6 0-3-2.5-5.5-6-5.5z"/>
                <path d="M9 7h6"/>
                <path d="M12 4v6"/>
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-playfair font-bold text-navy tracking-wide leading-tight">
                {doctorName.toUpperCase()}
              </h2>
              <p className="text-[9.5px] text-gold font-bold uppercase tracking-widest mt-0.5">
                Odontología Especializada & Rehabilitación Oral
              </p>
              <div className="text-[9px] text-gray-500 mt-1 leading-tight">
                <p>{budget.clinic?.name || clinicName} · {budget.clinic?.address || clinicAddress}</p>
                <p>Tel: {budget.clinic?.phone || clinicPhone} · RNC: 1-31-88942-1 · Exequatur: 4521-18</p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block bg-sand/30 border border-gold/50 px-3 py-1 rounded text-right">
              <span className="text-[8.5px] uppercase font-bold text-gold block tracking-wider">Presupuesto Formal</span>
              <span className="text-sm font-mono font-bold text-navy">{budget.budget_number || 'COT-BORRADOR'}</span>
            </div>
            <p className="text-[9.5px] text-gray-500 mt-1.5">
              Emisión: <span className="font-semibold text-navy">{issueDateFormatted}</span>
            </p>
            {validUntilFormatted && (
              <p className="text-[9.5px] text-gray-500">
                Válido hasta: <span className="font-semibold text-navy">{validUntilFormatted}</span>
              </p>
            )}
            <div className="mt-1">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase ${
                  isSigned || budget.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {isSigned ? '✓ Aprobado y Firmado' : (budget.status || 'Borrador')}
              </span>
            </div>
          </div>
        </div>

        {/* Franja de Datos del Paciente y Modalidad */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-sand/10 border border-gold/20 rounded p-2.5 text-[10.5px] break-inside-avoid">
          <div>
            <span className="text-gray-500 block text-[9px] uppercase font-bold text-gold">Paciente Titular:</span>
            <span className="text-xs font-bold text-navy">{patientDisplayName}</span>
            {patientIdNumber && (
              <p className="text-gray-600 text-[9.5px] mt-0.5">
                Cédula / ID: <span className="font-medium text-navy">{patientIdNumber}</span>
              </p>
            )}
          </div>
          <div>
            <span className="text-gray-500 block text-[9px] uppercase font-bold text-gold">Contacto:</span>
            {patientPhone && (
              <p className="text-gray-600 text-[9.5px]">Tel: <span className="font-medium text-navy">{patientPhone}</span></p>
            )}
            {patientEmail && (
              <p className="text-gray-500 text-[9px]">{patientEmail}</p>
            )}
          </div>
          <div className="sm:text-right">
            <span className="text-gray-500 block text-[9px] uppercase font-bold text-gold">Modalidad de Pago:</span>
            <span className="font-bold text-navy text-[10.5px]">{modalityText}</span>
          </div>
        </div>

        {/* Tabla de Tratamientos Odontológicos */}
        <div className="break-inside-avoid">
          <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider mb-1.5">
            1. Tratamientos Odontológicos Presupuestados
          </h4>
          <table className="w-full text-[10.5px] border-collapse border border-gray-200 rounded overflow-hidden">
            <thead>
              <tr className="bg-navy text-white text-left uppercase text-[9px] tracking-wider">
                <th className="py-1.5 px-2 w-8 text-center">#</th>
                <th className="py-1.5 px-2">Descripción del Tratamiento</th>
                <th className="py-1.5 px-2 w-16 text-center">Sesiones</th>
                <th className="py-1.5 px-2 w-12 text-center">Cant.</th>
                <th className="py-1.5 px-2 text-right w-24">Precio Unit.</th>
                <th className="py-1.5 px-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(budget.items || [])
                .filter((it) => it.name?.trim())
                .map((it, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-1.5 px-2 text-center text-gray-500 font-semibold text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-2">
                      <span className="font-bold text-navy">{it.name}</span>
                      {it.category && <span className="text-[9px] text-gold font-semibold ml-2">[{it.category}]</span>}
                      {it.notes && <p className="text-[9px] text-gray-500 mt-0.5">{it.notes}</p>}
                    </td>
                    <td className="py-1.5 px-2 text-center text-gray-600">{it.sessions_estimated || 1} ses.</td>
                    <td className="py-1.5 px-2 text-center font-semibold text-navy">{it.quantity}</td>
                    <td className="py-1.5 px-2 text-right font-mono text-gray-700">
                      RD$ {Number(it.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1.5 px-2 text-right font-mono font-bold text-navy">
                      RD$ {((Number(it.quantity) || 1) * (Number(it.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Sección Balanceada (Lado a Lado): Disposición de Pagos & Resumen Financiero */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 break-inside-avoid pt-1">
          {/* Columna Izquierda (7 de 12 columnas): Cronograma de Cuotas */}
          <div className="sm:col-span-7">
            <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider mb-1">
              2. Disposición de Pagos Acordada
            </h4>
            {budget.installments && budget.installments.length > 0 ? (
              <table className="w-full text-[10px] border-collapse border border-gray-200 rounded overflow-hidden">
                <thead>
                  <tr className="bg-navy text-white uppercase text-[8.5px]">
                    <th className="py-1 px-2 w-6 text-center">#</th>
                    <th className="py-1 px-2 text-left">Concepto</th>
                    <th className="py-1 px-2 text-left w-24">Vence</th>
                    <th className="py-1 px-2 text-right w-20">Monto</th>
                    <th className="py-1 px-2 text-center w-16">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {budget.installments.map((inst, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-1 px-2 text-center font-bold text-navy">{inst.installment_number}</td>
                      <td className="py-1 px-2 font-medium text-navy">{inst.concept}</td>
                      <td className="py-1 px-2 text-gray-600">{inst.due_date ? formatDate(inst.due_date) : 'Al agendar'}</td>
                      <td className="py-1 px-2 text-right font-mono font-bold text-navy">
                        RD$ {Number(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-1 px-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            inst.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inst.status === 'invoiced'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {inst.status === 'paid' ? 'Pagado' : inst.status === 'invoiced' ? 'Facturado' : 'Programado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-2.5 bg-gray-50 border border-gray-200 rounded text-[9.5px] text-gray-500 text-center">
                Pago único de contado a liquidar al inicio o finalización del tratamiento.
              </div>
            )}
          </div>

          {/* Columna Derecha (5 de 12 columnas): Resumen Financiero de Totales */}
          <div className="sm:col-span-5">
            <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider mb-1">
              Resumen Financiero
            </h4>
            <div className="space-y-1 text-[10px] bg-gray-50 p-2.5 rounded border border-gray-200">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal tratamientos:</span>
                <span className="font-mono">RD$ {(budget.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {(budget.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Descuento ({budget.discount_percent || 0}%):</span>
                  <span className="font-mono">-RD$ {(budget.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {(budget.tax || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>ITBIS / Impuesto:</span>
                  <span className="font-mono">+RD$ {(budget.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold text-navy pt-1.5 border-t border-gray-300">
                <span>TOTAL PRESUPUESTO:</span>
                <span className="text-gold font-mono">
                  RD$ {(budget.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Condiciones y Observaciones (Compactas en 2 Columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9px] bg-sand/10 border border-gold/20 p-2 rounded break-inside-avoid text-gray-600 leading-tight">
          <div>
            <p className="font-bold text-navy uppercase tracking-wider text-[8.5px]">Observaciones Clínicas:</p>
            <p className="mt-0.5">{budget.notes || 'Plan de tratamiento sujeto a evolución clínica y cuidados de higiene oral del paciente.'}</p>
          </div>
          <div>
            <p className="font-bold text-navy uppercase tracking-wider text-[8.5px]">Términos & Garantía Odontológica:</p>
            <p className="mt-0.5">{budget.terms_and_conditions || 'Aceptamos Efectivo, Tarjeta y Transferencia. Las cuotas deben cubrirse según las fechas programadas.'}</p>
          </div>
        </div>

        {/* Firmas de Conformidad (Doctor y Paciente lado a lado) */}
        <div className="flex justify-around items-end pt-3 mt-1 border-t-2 border-gray-200 text-center text-[10px] break-inside-avoid">
          {/* Firma Doctor */}
          <div className="w-52">
            {budget.doctor_signature_url ? (
              <div className="h-12 flex items-end justify-center mb-1">
                <img
                  src={budget.doctor_signature_url}
                  alt="Firma del Doctor"
                  className="max-h-12 max-w-[180px] object-contain"
                />
              </div>
            ) : (
              <div className="h-12 flex items-end justify-center mb-1">
                <span className="font-playfair italic text-sm text-gold font-semibold tracking-wider">
                  Marisol García D.
                </span>
              </div>
            )}
            <div className="border-b border-navy w-44 mx-auto mb-1" />
            <p className="font-bold text-navy text-[10.5px]">{budget.doctor_signed_name || doctorName}</p>
            <p className="text-[9px] text-gray-500">Odontóloga Especialista · Dirección Clínica</p>
          </div>

          {/* Firma Paciente */}
          <div className="w-52">
            {isSigned ? (
              <div className="space-y-0.5">
                <div className="h-12 flex items-end justify-center mb-1">
                  <img
                    src={budget.patient_signature_url!}
                    alt="Firma del Paciente"
                    className="max-h-12 max-w-[180px] object-contain"
                  />
                </div>
                <div className="border-b border-navy w-44 mx-auto mb-1" />
                <p className="font-bold text-navy text-[10.5px]">
                  {budget.patient_signed_name || patientDisplayName}
                </p>
                <p className="text-[9px] text-gray-500">
                  {budget.patient_signed_role === 'guardian'
                    ? 'Padre / Madre / Tutor Legal'
                    : budget.patient_signed_role === 'representative'
                    ? 'Representante Autorizado'
                    : 'Paciente Titular'}
                  {(budget.patient_signed_id_doc || patientIdNumber) &&
                    ` · Doc: ${budget.patient_signed_id_doc || patientIdNumber}`}
                </p>
                <div className="inline-block text-[8px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓ Firma Digital · {budget.patient_signed_at ? formatDate(budget.patient_signed_at) : 'Certificada'}
                </div>
              </div>
            ) : (
              <div>
                <div className="h-12" />
                <div className="border-b border-gray-400 w-44 mx-auto mb-1" />
                <p className="font-bold text-navy text-[10.5px]">{patientDisplayName}</p>
                <p className="text-[9px] text-gray-500">Firma de Conformidad (Paciente o Tutor)</p>
                {patientIdNumber && (
                  <p className="text-[8.5px] text-gray-400">Doc / Cédula: {patientIdNumber}</p>
                )}

                {onSignRequest && (
                  <div className="no-print pt-1">
                    <button
                      type="button"
                      onClick={onSignRequest}
                      className="px-2.5 py-0.5 bg-gold text-white text-[10px] font-bold rounded hover:bg-gold/90 transition-colors shadow-xs"
                    >
                      ✍️ Firmar en Pantalla
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Micro Footer Legal */}
        <div className="text-center text-[8px] text-gray-400 pt-2 border-t border-gray-100">
          Documento médico-legal emitido por Clínica Odontológica Dra. Marisol García · {isSigned ? 'Certificado con firma electrónica y trazabilidad de consentimiento.' : 'Documento confidencial para uso exclusivo del paciente.'}
        </div>
      </div>
    </div>
  )
}
