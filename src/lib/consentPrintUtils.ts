// src/lib/consentPrintUtils.ts
import { format } from 'date-fns'
import { es } from 'date-fns/locale/es'

export interface PrintConsentOptions {
  title: string
  contentRendered: string
  signedAt?: string | null
  patientName: string
  patientIdDoc?: string
  patientPhone?: string
  doctorName?: string
  doctorTitle?: string
  doctorExequatur?: string
  clinicName?: string
  clinicAddress?: string
  clinicPhone?: string
  clinicRnc?: string
  signatureDataUrl?: string | null
  signerRole?: 'patient' | 'guardian' | 'representative' | string
  signerName?: string
  signerIdDoc?: string
  procedureName?: string
  treatmentZone?: string
  toothNumber?: string
  isBlankForManualSign?: boolean
}

export function generateConsentPrintHtml(options: PrintConsentOptions): string {
  const {
    title,
    contentRendered,
    signedAt,
    patientName,
    patientIdDoc = 'Documento no especificado',
    patientPhone = '',
    doctorName = 'Dra. Marisol García',
    doctorTitle = 'Estomatóloga · Periodoncia e Implantes Dentales',
    doctorExequatur = '4521-18',
    clinicName = 'Clínica Odontológica Dra. Marisol García',
    clinicAddress = 'Calle Federico Geraldino 84, Piantini, Santo Domingo, D.N.',
    clinicPhone = '(809) 555-1234',
    clinicRnc = '1-31-88942-1',
    signatureDataUrl,
    signerRole = 'patient',
    signerName,
    signerIdDoc,
    procedureName,
    treatmentZone,
    toothNumber,
    isBlankForManualSign = false,
  } = options

  const formattedDate = signedAt
    ? format(new Date(signedAt), "d 'de' MMMM 'de' yyyy, hh:mm a", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  const isSigned = Boolean(signatureDataUrl && !isBlankForManualSign)

  // Split content by newlines and wrap into clean paragraphs
  const paragraphs = contentRendered
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 6.5px 0; text-align: justify; text-justify: inter-word;">${p}</p>`)
    .join('')

  // Signer label calculation
  const effectiveSignerName = signerRole !== 'patient' && signerName ? signerName : patientName
  const effectiveSignerId = signerRole !== 'patient' && signerIdDoc ? signerIdDoc : patientIdDoc
  const roleDescription =
    signerRole === 'guardian'
      ? 'Padre / Madre / Tutor Legal'
      : signerRole === 'representative'
      ? 'Representante Autorizado'
      : 'Paciente Titular'

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${patientName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');

    @page {
      size: letter portrait;
      margin: 10mm 12mm 8mm 12mm;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10px;
      line-height: 1.42;
    }

    .page-container {
      width: 100%;
      max-width: 780px;
      margin: 0 auto;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 100%;
      justify-content: space-between;
    }

    .header-table {
      width: 100%;
      border-bottom: 2px solid #c5a059;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .logo-badge {
      width: 44px;
      height: 44px;
      background: #0f172a;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      margin-right: 10px;
    }

    .doctor-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: 0.5px;
      line-height: 1.1;
      margin: 0;
    }

    .specialty-sub {
      font-size: 9px;
      font-weight: 700;
      color: #996515;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 2px 0 0 0;
    }

    .clinic-meta {
      font-size: 8px;
      color: #64748b;
      margin-top: 3px;
      line-height: 1.3;
    }

    .doc-folio {
      text-align: right;
      font-size: 8px;
      color: #64748b;
    }

    .doc-badge {
      display: inline-block;
      background: #fdfaf3;
      border: 1px solid #c5a059;
      padding: 3px 8px;
      border-radius: 4px;
      text-align: right;
      margin-bottom: 4px;
    }

    .doc-badge-title {
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: #996515;
      letter-spacing: 0.5px;
    }

    .patient-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
      margin-bottom: 10px;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 8px;
      font-size: 8.5px;
    }

    .patient-label {
      color: #64748b;
      text-transform: uppercase;
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }

    .patient-val {
      color: #0f172a;
      font-weight: 600;
    }

    .consent-title-box {
      text-align: center;
      margin-bottom: 9px;
    }

    .consent-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 3px 0;
    }

    .consent-subtitle {
      font-size: 8px;
      color: #996515;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .legal-content {
      font-size: 9.5px;
      color: #1e293b;
      line-height: 1.45;
      margin-bottom: 12px;
    }

    .signatures-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1.5px solid #cbd5e1;
    }

    .signature-card {
      text-align: center;
    }

    .signature-area {
      height: 52px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 3px;
    }

    .signature-img {
      max-height: 48px;
      max-width: 170px;
      object-contain: contain;
    }

    .signature-line {
      border-bottom: 1px solid #475569;
      width: 190px;
      margin: 0 auto 3px auto;
    }

    .signer-name {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .signer-sub {
      font-size: 8px;
      color: #64748b;
      margin: 1px 0 0 0;
    }

    .cert-badge {
      display: inline-block;
      margin-top: 3px;
      padding: 1.5px 6px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 999px;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .footer-note {
      text-align: center;
      font-size: 7.5px;
      color: #94a3b8;
      margin-top: 10px;
      padding-top: 5px;
      border-top: 1px solid #f1f5f9;
      line-height: 1.3;
    }

    @media print {
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div>
      <!-- HEADER MEMBRETADO OFICIAL (DRA. MARISOL GARCÍA) -->
      <table class="header-table" cellpadding="0" cellspacing="0">
        <tr>
          <td style="vertical-align: middle; width: 62%;">
            <div style="display: flex; align-items: center;">
              <!-- Isotipo Odontológico Dorado -->
              <div class="logo-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2C8.5 2 6 4.5 6 7.5c0 2 .5 4 1 6 .6 2.4 1.5 5.5 2.5 7.5.4.8 1.5.8 1.9 0 .8-1.6 1.6-4.5 2.6-7.5.5-2 1-4 1-6 0-3-2.5-5.5-6-5.5z"/>
                  <path d="M9 7h6"/>
                  <path d="M12 4v6"/>
                </svg>
              </div>
              <div>
                <h1 class="doctor-title">${doctorName.toUpperCase()}</h1>
                <p class="specialty-sub">${doctorTitle}</p>
                <div class="clinic-meta">
                  ${clinicName} · ${clinicAddress}<br>
                  Tel: ${clinicPhone} · RNC: ${clinicRnc} · Exequátur: <strong>${doctorExequatur}</strong>
                </div>
              </div>
            </div>
          </td>
          <td style="vertical-align: middle; width: 38%; text-align: right;">
            <div class="doc-folio">
              <div class="doc-badge">
                <span class="doc-badge-title">Documento Médico-Legal</span>
                <div style="font-weight: 700; color: #0f172a; font-size: 8.5px;">CONSENTIMIENTO INFORMADO</div>
              </div>
              <div>Fecha: <strong>${formattedDate}</strong></div>
              <div style="margin-top: 2px;">
                ${isSigned 
                  ? '<span style="color: #065f46; font-weight: 700;">● DOCUMENTO FIRMADO Y CERTIFICADO</span>' 
                  : '<span style="color: #b45309; font-weight: 700;">○ LISTO PARA FIRMA MANUSCRITA / FÍSICA</span>'
                }
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- TARJETA DE IDENTIFICACIÓN DEL PACIENTE Y DETALLES DEL ACTO -->
      <div class="patient-card">
        <div>
          <div class="patient-label">Paciente Titular:</div>
          <div class="patient-val" style="font-size: 9.5px;">${patientName}</div>
          ${patientPhone ? `<div style="color: #64748b; font-size: 7.5px;">Tel: ${patientPhone}</div>` : ''}
        </div>
        <div>
          <div class="patient-label">Cédula / Documento:</div>
          <div class="patient-val">${patientIdDoc}</div>
        </div>
        <div>
          <div class="patient-label">Acto Clínico:</div>
          <div class="patient-val" style="color: #996515;">
            ${procedureName || treatmentZone ? `${procedureName || 'Tratamiento'}${treatmentZone ? ` · Zona: ${treatmentZone}` : ''}` : (toothNumber ? `Diente No. ${toothNumber}` : 'Odontología Especializada')}
          </div>
        </div>
      </div>

      <!-- TÍTULO DEL CONSENTIMIENTO -->
      <div class="consent-title-box">
        <h2 class="consent-title">${title}</h2>
        <div class="consent-subtitle">Declaración de Voluntad y Comprensión del Paciente</div>
      </div>

      <!-- CUERPO LEGAL Y CLÁUSULAS MÉDICAS -->
      <div class="legal-content">
        ${paragraphs}
      </div>
    </div>

    <!-- SECCIÓN DE FIRMAS DUAL (PACIENTE / TUTOR Y ODONTÓLOGO) -->
    <div>
      <div class="signatures-grid">
        <!-- Firma Paciente / Tutor -->
        <div class="signature-card">
          <div class="signature-area">
            ${isSigned && signatureDataUrl ? `
              <img src="${signatureDataUrl}" alt="Firma Paciente" class="signature-img">
            ` : `
              <div style="height: 100%;"></div>
            `}
          </div>
          <div class="signature-line"></div>
          <p class="signer-name">${effectiveSignerName}</p>
          <p class="signer-sub">${roleDescription} · Doc: ${effectiveSignerId}</p>
          ${isSigned ? `
            <div class="cert-badge">✓ Firma Digital Verificada</div>
          ` : `
            <div style="font-size: 7.5px; color: #94a3b8; margin-top: 2px;">Firma Manuscrita del Paciente o Tutor</div>
          `}
        </div>

        <!-- Firma Profesional Odontólogo -->
        <div class="signature-card">
          <div class="signature-area">
            <div style="text-align: center; width: 100%;">
              <span style="font-family: 'Playfair Display', serif; font-style: italic; font-size: 16px; color: #1e3a8a; font-weight: 600;">
                ${doctorName}
              </span>
            </div>
          </div>
          <div class="signature-line"></div>
          <p class="signer-name">${doctorName}</p>
          <p class="signer-sub">Estomatóloga · Exequátur: <strong>${doctorExequatur}</strong></p>
          <div class="cert-badge" style="background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe;">
            ✓ Profesional Responsable Habilitado
          </div>
        </div>
      </div>

      <!-- PIE DE PÁGINA MÉDICO-LEGAL -->
      <div class="footer-note">
        Este documento constituye un registro legal y médico confidencial conforme a la Ley General de Salud No. 42-01 y las normas bioéticas odontológicas.<br>
        Clínica Dra. Marisol García · Todos los derechos reservados · Expediente clínico confidencial.
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Abre una ventana emergente de impresión optimizada para guardar en PDF o imprimir
 */
export function openConsentPrintWindow(options: PrintConsentOptions): void {
  const html = generateConsentPrintHtml(options)
  const printWindow = window.open('', '_blank', 'width=920,height=840,scrollbars=yes,resizable=yes')

  if (!printWindow) {
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
