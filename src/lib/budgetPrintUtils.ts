import type { Budget, BudgetItem, BudgetInstallment } from '../types'
import { formatDate } from './utils'

export interface PrintBudgetOptions {
  budget: Partial<Budget> & {
    items?: BudgetItem[]
    installments?: BudgetInstallment[]
  }
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  doctorName?: string
}

export const modalityDisplayNames: Record<string, string> = {
  single_payment: 'Pago Único de Contado',
  installments: 'Inicial + Cuotas Periódicas',
  per_session: 'Pago Progresivo por Cita / Sesión',
  custom_financing: 'Financiamiento Odontológico por Fases',
}

export function generateBudgetPrintHtml(options: PrintBudgetOptions): string {
  const {
    budget,
    clinicName = 'Clínica Odontológica Dra. Marisol García',
    clinicAddress = 'Calle Federico Geraldino 84, Piantini, Santo Domingo, D.N.',
    clinicPhone = '(809) 555-1234',
    doctorName = 'Dra. Marisol García',
  } = options

  const patientDisplayName = budget.patient?.full_name || budget.patient_name || 'Paciente'
  const patientPhone = budget.patient?.phone || budget.patient_phone || ''
  const patientEmail = budget.patient?.email || budget.patient_email || ''
  const patientIdNumber = budget.patient?.identification_number || budget.patient_id_number || ''
  const budgetNumber = budget.budget_number || 'COT-BORRADOR'
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

  const itemsHtml = (budget.items || [])
    .filter((it) => it.name?.trim())
    .map(
      (it, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#fafafa'};">
        <td style="padding: 5px 8px; text-align: center; font-weight: 600; color: #64748b; font-size: 10px;">${idx + 1}</td>
        <td style="padding: 5px 8px;">
          <span style="font-weight: 700; color: #0f172a; font-size: 11px;">${it.name}</span>
          ${it.category ? `<span style="display: inline-block; margin-left: 6px; font-size: 9px; color: #996515; font-weight: 700; text-transform: uppercase;">[${it.category}]</span>` : ''}
          ${it.notes ? `<div style="font-size: 9.5px; color: #64748b; margin-top: 1px;">${it.notes}</div>` : ''}
        </td>
        <td style="padding: 5px 8px; text-align: center; color: #475569; font-size: 10.5px;">${it.sessions_estimated || 1} ses.</td>
        <td style="padding: 5px 8px; text-align: center; font-weight: 700; color: #0f172a; font-size: 10.5px;">${it.quantity}</td>
        <td style="padding: 5px 8px; text-align: right; font-family: monospace; color: #334155; font-size: 10.5px;">
          RD$ ${Number(it.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
        <td style="padding: 5px 8px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a; font-size: 10.5px;">
          RD$ ${((Number(it.quantity) || 1) * (Number(it.unit_price) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
    )
    .join('')

  const installmentsHtml =
    budget.installments && budget.installments.length > 0
      ? `
      <table style="width: 100%; border-collapse: collapse; font-size: 10px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden;">
        <thead>
          <tr style="background: #0f172a; color: #ffffff; text-align: left; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em;">
            <th style="padding: 4px 6px; width: 24px; text-align: center;">#</th>
            <th style="padding: 4px 6px;">Concepto</th>
            <th style="padding: 4px 6px; width: 85px;">Vence</th>
            <th style="padding: 4px 6px; width: 80px; text-align: right;">Monto</th>
            <th style="padding: 4px 6px; width: 65px; text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${budget.installments
            .map(
              (inst, i) => `
            <tr style="border-bottom: 1px solid #f1f5f9; background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              <td style="padding: 4px 6px; text-align: center; font-weight: 700; color: #0f172a;">${inst.installment_number}</td>
              <td style="padding: 4px 6px; font-weight: 600; color: #0f172a;">${inst.concept}</td>
              <td style="padding: 4px 6px; color: #475569;">${inst.due_date ? formatDate(inst.due_date) : 'Al agendar'}</td>
              <td style="padding: 4px 6px; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">
                RD$ ${Number(inst.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td style="padding: 4px 6px; text-align: center;">
                <span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-size: 8.5px; font-weight: 700; background: ${
                  inst.status === 'paid' ? '#dcfce7; color: #15803d;' : inst.status === 'invoiced' ? '#e0e7ff; color: #3730a3;' : '#f1f5f9; color: #475569;'
                }">
                  ${inst.status === 'paid' ? 'PAGADO' : inst.status === 'invoiced' ? 'FACTURADO' : 'PROGRAMADO'}
                </span>
              </td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `
      : `
      <div style="padding: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; font-size: 10px; color: #64748b; text-align: center;">
        Modalidad de Pago Único de Contado (Liquidación al inicio o término del procedimiento).
      </div>
    `

  // Patient Signature block
  const patientSignatureHtml = isSigned
    ? `
      <div style="text-align: center; width: 220px;">
        <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
          <img src="${budget.patient_signature_url}" alt="Firma Paciente" style="max-height: 46px; max-width: 200px; object-contain: true;" />
        </div>
        <div style="border-bottom: 1px solid #0f172a; width: 200px; margin: 0 auto 3px auto;"></div>
        <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${budget.patient_signed_name || patientDisplayName}</div>
        <div style="font-size: 9.5px; color: #64748b;">
          ${budget.patient_signed_role === 'guardian' ? 'Tutor Legal / Representante' : 'Paciente Titular'}
          ${budget.patient_signed_id_doc ? `· Cédula/ID: ${budget.patient_signed_id_doc}` : patientIdNumber ? `· Doc: ${patientIdNumber}` : ''}
        </div>
        <div style="display: inline-block; font-size: 8.5px; color: #15803d; font-weight: 700; background: #dcfce7; padding: 1px 6px; border-radius: 8px; margin-top: 2px;">
          ✓ Firma Digital Certificada · ${budget.patient_signed_at ? formatDate(budget.patient_signed_at) : 'Válida'}
        </div>
      </div>
    `
    : `
      <div style="text-align: center; width: 220px;">
        <div style="height: 48px;"></div>
        <div style="border-bottom: 1px solid #64748b; width: 200px; margin: 0 auto 3px auto;"></div>
        <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${patientDisplayName}</div>
        <div style="font-size: 9.5px; color: #64748b;">Firma de Conformidad (Paciente o Tutor)</div>
        ${patientIdNumber ? `<div style="font-size: 9px; color: #94a3b8;">Cédula/ID: ${patientIdNumber}</div>` : ''}
      </div>
    `

  // Doctor Signature block
  const doctorSignatureHtml = budget.doctor_signature_url
    ? `
      <div style="text-align: center; width: 220px;">
        <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
          <img src="${budget.doctor_signature_url}" alt="Firma Doctor" style="max-height: 46px; max-width: 200px; object-contain: true;" />
        </div>
        <div style="border-bottom: 1px solid #0f172a; width: 200px; margin: 0 auto 3px auto;"></div>
        <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${budget.doctor_signed_name || doctorName}</div>
        <div style="font-size: 9.5px; color: #64748b;">Odontóloga Especialista · Dirección Clínica</div>
      </div>
    `
    : `
      <div style="text-align: center; width: 220px;">
        <div style="height: 48px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
          <span style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 17px; color: #996515; letter-spacing: 1px;">Marisol García D.</span>
        </div>
        <div style="border-bottom: 1px solid #0f172a; width: 200px; margin: 0 auto 3px auto;"></div>
        <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${doctorName}</div>
        <div style="font-size: 9.5px; color: #64748b;">Odontóloga Especialista · Exequatur 4521-18</div>
      </div>
    `

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Presupuesto Oficial - ${budgetNumber} - Dra. Marisol García</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');

    @page {
      size: letter portrait;
      margin: 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      line-height: 1.35;
      font-size: 11px;
    }

    .toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .toolbar-title {
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      cursor: pointer;
      border: none;
      padding: 7px 15px;
      border-radius: 5px;
      font-weight: 700;
      font-size: 11px;
      transition: opacity 0.15s;
    }

    .btn-gold {
      background: #c5a059;
      color: #ffffff;
    }

    .btn-secondary {
      background: #334155;
      color: #ffffff;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .document-page {
      max-width: 800px;
      margin: 56px auto 20px auto;
      padding: 24px 28px;
      background: #ffffff;
      box-shadow: 0 1px 15px rgba(0,0,0,0.08);
      border-radius: 4px;
    }

    @media print {
      .toolbar {
        display: none !important;
      }
      .document-page {
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Floating Screen Toolbar (Hidden on Print) -->
  <div class="toolbar">
    <div class="toolbar-title">
      <span>📄 Presupuesto Clínico Oficial:</span>
      <span style="color: #c5a059; font-family: monospace; font-weight: 700;">${budgetNumber}</span>
      ${isSigned ? '<span style="background: #15803d; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">✓ Firmado</span>' : ''}
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
      <button class="btn btn-gold" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>
  </div>

  <div class="document-page">
    <!-- Header Membrete Oficial -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #c5a059; padding-bottom: 12px; margin-bottom: 12px;">
      <!-- Logo y Datos Clínicos -->
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <!-- Luxury Dental Emblem SVG -->
        <div style="width: 44px; height: 44px; border-radius: 8px; background: #0f172a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c5a059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 .5 4 1 6 .6 2.4 1.5 5.5 2.5 7.5.4.8 1.5.8 1.9 0 .8-1.6 1.6-4.5 2.6-7.5.5-2 1-4 1-6 0-3-2.5-5.5-6-5.5z"/>
            <path d="M9 7h6"/>
            <path d="M12 4v6"/>
          </svg>
        </div>

        <div>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: 0.03em; line-height: 1.1;">
            ${doctorName.toUpperCase()}
          </h1>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: #996515; margin-top: 2px;">
            Odontología Especializada & Rehabilitación Oral
          </div>
          <div style="font-size: 9px; color: #475569; margin-top: 4px; line-height: 1.3;">
            <span>${budget.clinic?.name || clinicName} · ${budget.clinic?.address || clinicAddress}</span>
            <br />
            <span>Tel: ${budget.clinic?.phone || clinicPhone} · RNC: 1-31-88942-1 · Exequatur: 4521-18</span>
          </div>
        </div>
      </div>

      <!-- Cuadro Oficial de Cotización -->
      <div style="text-align: right;">
        <div style="display: inline-block; background-color: #fdfbf7; border: 1.5px solid #c5a059; padding: 5px 12px; border-radius: 5px; text-align: right;">
          <span style="font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #996515; display: block; letter-spacing: 0.05em;">Presupuesto Formal</span>
          <span style="font-family: monospace; font-weight: 700; font-size: 14px; color: #0f172a;">${budgetNumber}</span>
        </div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 4px;">
          Emisión: <strong style="color: #0f172a;">${issueDateFormatted}</strong>
        </div>
        <div style="font-size: 9.5px; color: #64748b;">
          Válido hasta: <strong style="color: #0f172a;">${validUntilFormatted}</strong>
        </div>
        <div style="margin-top: 3px;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; background: ${
            isSigned || budget.status === 'approved' ? '#dcfce7; color: #15803d;' : '#f1f5f9; color: #475569;'
          }">
            ${isSigned ? '✓ APROBADO & FIRMADO' : (budget.status || 'Borrador').toUpperCase()}
          </span>
        </div>
      </div>
    </div>

    <!-- Franja de Datos del Paciente y Modalidad -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 8px 12px; margin-bottom: 12px; font-size: 10.5px;">
      <div>
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #996515; display: block;">Paciente Titular</span>
        <strong style="color: #0f172a; font-size: 12px;">${patientDisplayName}</strong>
        ${patientIdNumber ? `<div style="color: #64748b; font-size: 9.5px; margin-top: 1px;">Doc: <strong>${patientIdNumber}</strong></div>` : ''}
      </div>
      <div>
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #996515; display: block;">Contacto</span>
        <div style="color: #475569;">${patientPhone ? `Tel: <strong>${patientPhone}</strong>` : '—'}</div>
        ${patientEmail ? `<div style="color: #64748b; font-size: 9.5px;">${patientEmail}</div>` : ''}
      </div>
      <div style="text-align: right;">
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #996515; display: block;">Modalidad de Pago</span>
        <strong style="color: #0f172a;">${modalityText}</strong>
      </div>
    </div>

    <!-- Sección 1: Tabla de Tratamientos Odontológicos -->
    <div style="margin-bottom: 12px;">
      <div style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 5px;">
        1. Tratamientos Odontológicos Presupuestados
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden;">
        <thead>
          <tr style="background-color: #0f172a; color: #ffffff; text-align: left; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.04em;">
            <th style="padding: 6px 8px; width: 28px; text-align: center;">#</th>
            <th style="padding: 6px 8px;">Tratamiento / Procedimiento Odontológico</th>
            <th style="padding: 6px 8px; width: 65px; text-align: center;">Sesiones</th>
            <th style="padding: 6px 8px; width: 44px; text-align: center;">Cant.</th>
            <th style="padding: 6px 8px; width: 110px; text-align: right;">Precio Unit.</th>
            <th style="padding: 6px 8px; width: 110px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Sección 2: Disposición de Pagos & Resumen Financiero (LADO A LADO) -->
    <div class="avoid-break" style="display: grid; grid-template-columns: 56% 42%; gap: 16px; margin-bottom: 12px;">
      <!-- Columna Izquierda: Cronograma de Pagos -->
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 4px;">
          2. Disposición de Pagos Acordada
        </div>
        ${installmentsHtml}
      </div>

      <!-- Columna Derecha: Resumen de Totales -->
      <div>
        <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; margin-bottom: 4px;">
          Resumen Financiero
        </div>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px 12px; font-size: 10.5px;">
          <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 4px;">
            <span>Subtotal tratamientos:</span>
            <span style="font-family: monospace;">RD$ ${(budget.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          ${
            (budget.discount_amount || 0) > 0
              ? `
            <div style="display: flex; justify-content: space-between; color: #15803d; font-weight: 600; margin-bottom: 4px;">
              <span>Descuento aplicado (${budget.discount_percent || 0}%):</span>
              <span style="font-family: monospace;">-RD$ ${(budget.discount_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          `
              : ''
          }
          ${
            (budget.tax || 0) > 0
              ? `
            <div style="display: flex; justify-content: space-between; color: #475569; margin-bottom: 4px;">
              <span>ITBIS / Impuesto de ley:</span>
              <span style="font-family: monospace;">+RD$ ${(budget.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          `
              : ''
          }
          <div style="display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; color: #0f172a; border-top: 1.5px solid #cbd5e1; padding-top: 6px; margin-top: 2px;">
            <span>TOTAL PRESUPUESTO:</span>
            <span style="color: #996515; font-family: monospace;">RD$ ${(budget.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Sección 3: Observaciones y Garantías (Compactas) -->
    <div class="avoid-break" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #fafafa; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; margin-bottom: 14px; font-size: 9px; line-height: 1.35; color: #475569;">
      <div>
        <strong style="color: #0f172a; display: block; margin-bottom: 1px;">Observaciones Clínicas:</strong>
        <div>${budget.notes || 'Plan de tratamiento sujeto a evolución clínica y mantenimiento higiénico del paciente.'}</div>
      </div>
      <div>
        <strong style="color: #0f172a; display: block; margin-bottom: 1px;">Términos & Garantía Odontológica:</strong>
        <div>${budget.terms_and_conditions || 'Aceptamos Efectivo, Tarjeta y Transferencia. Las cuotas deben cubrirse según las fechas programadas.'}</div>
      </div>
    </div>

    <!-- Sección 4: Bloque de Firmas -->
    <div class="avoid-break" style="display: flex; justify-content: space-around; align-items: flex-end; padding-top: 8px; border-top: 1.5px solid #cbd5e1; margin-top: 8px;">
      ${doctorSignatureHtml}
      ${patientSignatureHtml}
    </div>

    <!-- Pie de página con certificación de seguridad -->
    <div style="margin-top: 12px; padding-top: 6px; border-top: 1px solid #f1f5f9; text-align: center; font-size: 8px; color: #94a3b8;">
      Presupuesto formal emitido por Marisol Odontología Especializada · Documento legal confidencial · ${isSigned ? 'Certificado con firma digital y verificación de consentimiento.' : 'Documento pendiente de firma física o digital.'}
    </div>
  </div>

</body>
</html>
`
}

/**
 * Opens a clean, dedicated print/PDF preview window and triggers browser print
 */
export function openBudgetPrintWindow(options: PrintBudgetOptions): void {
  const html = generateBudgetPrintHtml(options)
  const printWindow = window.open('', '_blank', 'width=920,height=840,scrollbars=yes,resizable=yes')

  if (!printWindow) {
    // If popup is blocked by browser, print in-place
    window.print()
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 450)
  }
}
