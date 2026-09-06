import { formatDate } from './utils'

export interface ReceiptItem {
  description: string
  quantity: number
  unit_price: number
  total?: number
}

export interface PrintReceiptOptions {
  invoiceNumber: string
  issueDate?: string
  patientName: string
  patientPhone?: string
  patientIdDoc?: string
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  clinicRnc?: string
  doctorName?: string
  procedureName?: string
  appointmentDate?: string
  items: ReceiptItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod?: string
  referenceNumber?: string
  isPaid?: boolean
  notes?: string
}

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  credit_card: 'Tarjeta de Crédito',
  debit_card: 'Tarjeta de Débito',
  bank_transfer: 'Transferencia Bancaria',
  insurance: 'Seguro Médico Dental',
  check: 'Cheque',
  other: 'Otro Medio de Pago',
}

/**
 * Genera el documento HTML completo y profesional para impresión de Recibo Dental
 * Totalmente aislado del DOM de la página para evitar que se imprima el calendario o la pantalla de citas.
 */
export function generateReceiptPrintHtml(options: PrintReceiptOptions): string {
  const {
    invoiceNumber,
    issueDate = new Date().toISOString(),
    patientName,
    patientPhone = '',
    patientIdDoc = '',
    clinicName = 'Clínica Odontológica Dra. Marisol',
    clinicAddress = 'Calle Federico Geraldino 84, Piantini, Santo Domingo, D.N.',
    clinicPhone = '(809) 555-0199',
    clinicRnc = '1-31-98765-4',
    doctorName = 'Dra. Marisol',
    procedureName = 'Consulta Odontológica',
    appointmentDate = '',
    items = [],
    subtotal,
    discount,
    tax,
    total,
    paymentMethod = 'cash',
    referenceNumber = '',
    isPaid = true,
    notes = '',
  } = options

  const formattedDate = formatDate(issueDate)
  const currentTime = new Date().toLocaleTimeString('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const paymentLabel = paymentMethodLabels[paymentMethod] || 'Efectivo'

  const itemsRows = items
    .map((item, idx) => {
      const lineTotal = item.total ?? item.quantity * item.unit_price
      return `
      <tr style="border-bottom: 1px solid #e2e8f0; background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 7px 10px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 7px 10px; color: #0f172a; font-size: 11.5px; font-weight: 600;">${item.description || 'Atención Odontológica'}</td>
        <td style="padding: 7px 10px; text-align: center; color: #334155; font-size: 11.5px; font-weight: 600;">${item.quantity}</td>
        <td style="padding: 7px 10px; text-align: right; color: #334155; font-family: monospace; font-size: 11.5px;">
          RD$ ${Number(item.unit_price).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 7px 10px; text-align: right; color: #0f172a; font-family: monospace; font-weight: 700; font-size: 11.5px;">
          RD$ ${Number(lineTotal).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `
    })
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Recibo Oficial - ${invoiceNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

    @page {
      size: letter portrait;
      margin: 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    .toolbar {
      width: 100%;
      max-width: 780px;
      margin: 14px auto 0 auto;
      padding: 10px 16px;
      background: #0f172a;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    }

    .toolbar-title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-gold {
      background: #c5a059;
      color: #ffffff;
    }

    .btn-gold:hover {
      background: #b08d47;
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .receipt-container {
      width: 100%;
      max-width: 780px;
      margin: 14px auto 24px auto;
      padding: 24px 28px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    }

    @media print {
      body {
        background: #ffffff !important;
      }
      .toolbar {
        display: none !important;
      }
      .receipt-container {
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        max-width: 100% !important;
      }
    }
  </style>
</head>
<body>

  <!-- Floating Screen Toolbar -->
  <div class="toolbar">
    <div class="toolbar-title">
      <span>🧾 Recibo de Pago Odontológico:</span>
      <span style="color: #c5a059; font-family: monospace; font-weight: 700;">${invoiceNumber}</span>
      <span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px;">
        ${isPaid ? '✓ Cobrado en Caja' : 'Emitido'}
      </span>
    </div>
    <div class="toolbar-actions">
      <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
      <button class="btn btn-gold" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    </div>
  </div>

  <!-- Document Sheet -->
  <div class="receipt-container">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #c5a059; padding-bottom: 14px; margin-bottom: 14px;">
      <!-- Clinic Logo & Info -->
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 46px; height: 46px; border-radius: 10px; background: #0f172a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#c5a059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 .5 4 1 6 .6 2.4 1.5 5.5 2.5 7.5.4.8 1.5.8 1.9 0 .8-1.6 1.6-4.5 2.6-7.5.5-2 1-4 1-6 0-3-2.5-5.5-6-5.5z"/>
            <path d="M9 7h6"/>
            <path d="M12 4v6"/>
          </svg>
        </div>
        <div>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #0f172a; margin: 0; line-height: 1.1;">
            ${clinicName.toUpperCase()}
          </h1>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #c5a059; margin-top: 2px;">
            Odontología Especializada & Estética Dental
          </div>
          <div style="font-size: 9.5px; color: #475569; margin-top: 4px; line-height: 1.3;">
            <span>📍 ${clinicAddress}</span><br />
            <span>📞 Tel/WhatsApp: ${clinicPhone} · RNC: ${clinicRnc}</span>
          </div>
        </div>
      </div>

      <!-- Receipt Voucher Badge -->
      <div style="text-align: right; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; min-width: 210px;">
        <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b;">
          COMPROBANTE DE PAGO
        </div>
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; margin: 2px 0;">
          ${invoiceNumber}
        </div>
        <div style="font-size: 9.5px; color: #475569;">
          Fecha: <strong>${formattedDate}</strong> (${currentTime})
        </div>
        <div style="margin-top: 4px;">
          <span style="display: inline-block; background: ${isPaid ? '#dcfce7' : '#fef3c7'}; color: ${isPaid ? '#15803d' : '#b45309'}; font-size: 9.5px; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">
            ${isPaid ? '✓ COBRADO EN CAJA' : 'PENDIENTE DE PAGO'}
          </span>
        </div>
      </div>
    </div>

    <!-- Patient & Appointment Info -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; font-size: 10.5px;">
      <div>
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; display: block;">Datos del Paciente</span>
        <strong style="font-size: 12.5px; color: #0f172a; display: block; margin-top: 1px;">${patientName}</strong>
        ${patientIdDoc ? `<span style="color: #475569; font-size: 10px;">Doc. Identidad: ${patientIdDoc}</span><br />` : ''}
        ${patientPhone ? `<span style="color: #475569; font-size: 10px;">Teléfono: ${patientPhone}</span>` : ''}
      </div>

      <div style="text-align: right;">
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; display: block;">Atención Odontológica</span>
        <strong style="color: #0f172a; font-size: 11.5px; display: block; margin-top: 1px;">${procedureName}</strong>
        <span style="color: #475569; font-size: 10px;">Especialista: ${doctorName}</span><br />
        ${appointmentDate ? `<span style="color: #64748b; font-size: 9.5px;">Fecha Cita: ${appointmentDate}</span>` : ''}
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background: #0f172a; color: #ffffff; text-align: left; text-transform: uppercase; font-size: 9.5px; letter-spacing: 0.05em;">
          <th style="padding: 7px 10px; width: 35px; text-align: center;">#</th>
          <th style="padding: 7px 10px;">Concepto / Procedimiento Realizado</th>
          <th style="padding: 7px 10px; width: 55px; text-align: center;">Cant.</th>
          <th style="padding: 7px 10px; width: 110px; text-align: right;">Precio Unit.</th>
          <th style="padding: 7px 10px; width: 120px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Financial Breakdown & Payment Info -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; margin-bottom: 16px;">
      <!-- Payment Method & Notes -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 10.5px;">
        <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; color: #0f172a; display: block; margin-bottom: 6px;">
          Modalidad y Método de Pago
        </span>
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Forma de Pago:</span>
          <strong style="color: #0f172a;">${paymentLabel}</strong>
        </div>
        ${
          referenceNumber
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span style="color: #64748b;">N° Referencia / Lote:</span>
                <span style="font-family: monospace; font-weight: 600; color: #0f172a;">${referenceNumber}</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
          <span style="color: #64748b;">Moneda:</span>
          <strong style="color: #0f172a;">DOP (Pesos Dominicanos)</strong>
        </div>

        ${
          notes
            ? `<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 9.5px; color: #475569;">
                <strong>Observaciones:</strong> ${notes}
              </div>`
            : ''
        }
      </div>

      <!-- Financial Totals -->
      <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px 14px; font-size: 11px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
          <span>Subtotal:</span>
          <span style="font-family: monospace;">RD$ ${Number(subtotal).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        ${
          discount > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;">
                <span>Descuento aplicado:</span>
                <span style="font-family: monospace;">- RD$ ${Number(discount).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>`
            : ''
        }

        ${
          tax > 0
            ? `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #64748b;">
                <span>ITBIS / Impuestos:</span>
                <span style="font-family: monospace;">+ RD$ ${Number(tax).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>`
            : ''
        }

        <div style="display: flex; justify-content: space-between; align-items: baseline; padding-top: 8px; margin-top: 6px; border-top: 2px solid #0f172a; font-size: 14px; font-weight: 800; color: #0f172a;">
          <span>TOTAL PAGADO:</span>
          <span style="font-family: monospace; color: #15803d; font-size: 16px;">
            RD$ ${Number(total).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>

    <!-- Signatures -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 24px; padding-top: 10px;">
      <div style="text-align: center;">
        <div style="border-top: 1px solid #94a3b8; width: 85%; margin: 0 auto; padding-top: 6px;">
          <strong style="font-size: 10px; color: #0f172a; text-transform: uppercase; display: block;">Cajero(a) / Recepción</strong>
          <span style="font-size: 9px; color: #64748b;">Firma y Sello de la Clínica</span>
        </div>
      </div>

      <div style="text-align: center;">
        <div style="border-top: 1px solid #94a3b8; width: 85%; margin: 0 auto; padding-top: 6px;">
          <strong style="font-size: 10px; color: #0f172a; text-transform: uppercase; display: block;">${patientName}</strong>
          <span style="font-size: 9px; color: #64748b;">Recibí Conforme</span>
        </div>
      </div>
    </div>

    <!-- Security & Gratitude Footer -->
    <div style="margin-top: 20px; padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 8.5px; color: #64748b; line-height: 1.4;">
      🦷 <em>¡Gracias por confiar en nosotros para cuidar de tu sonrisa!</em><br />
      Este documento constituye un comprobante formal de pago emitido por <strong>${clinicName}</strong>. Consérvelo para fines contables y de garantía clínica.
    </div>
  </div>

</body>
</html>`
}

/**
 * Abre una ventana emergente limpia y dedicada con el recibo odontológico y detona la impresión.
 * Garantiza que NINGÚN elemento del calendario o de la pantalla de citas sea impreso.
 */
export function openReceiptPrintWindow(options: PrintReceiptOptions): void {
  const html = generateReceiptPrintHtml(options)
  const printWindow = window.open('', '_blank', 'width=880,height=900,scrollbars=yes,resizable=yes')

  if (!printWindow) {
    // Si el navegador bloqueó la ventana emergente, fallback controlado
    alert('Por favor permite ventanas emergentes (popups) en tu navegador para imprimir el recibo.')
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 400)
  }
}
