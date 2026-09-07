import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { Patient, PeriodontogramToothData } from '../../../types'
import { getPeriodontalChartViewerUrl } from './periodontalChartApiEncoder'

interface PeriodontalOnlineExportModalProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  teethData: Record<string, PeriodontogramToothData>
  recordTitle?: string
  examDate?: string
}

export const PeriodontalOnlineExportModal: React.FC<PeriodontalOnlineExportModalProps> = ({
  isOpen,
  onClose,
  patient,
  teethData,
  recordTitle = 'Periodontograma Inicial',
  examDate,
}) => {
  const isDefaultReevaluation = recordTitle.toLowerCase().includes('reevaluac')
  const [isReevaluation, setIsReevaluation] = useState(isDefaultReevaluation)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const viewerUrl = getPeriodontalChartViewerUrl(teethData, { isReevaluation })

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('Error al copiar enlace:', err)
    }
  }

  const handleOpenViewer = () => {
    window.open(viewerUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const qrElement = document.getElementById('periodontal-qr-svg')
    const qrSvgHtml = qrElement ? qrElement.outerHTML : ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Periodontograma Interactivo - ${patient.full_name}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              text-align: center;
              padding: 2rem;
              color: #1e293b;
            }
            .card {
              border: 2px dashed #0d9488;
              border-radius: 16px;
              padding: 2.5rem;
              max-width: 420px;
              background: #f8fafc;
            }
            h1 { font-size: 1.4rem; color: #0f766e; margin-bottom: 0.5rem; }
            h2 { font-size: 1.1rem; color: #334155; margin-bottom: 1.5rem; font-weight: normal; }
            .qr-wrapper { margin: 1.5rem auto; display: flex; justify-content: center; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.5; }
            .badge {
              display: inline-block;
              background: #ccfbf1;
              color: #0f766e;
              padding: 0.35rem 0.8rem;
              border-radius: 9999px;
              font-size: 0.8rem;
              font-weight: 600;
              margin-bottom: 1rem;
            }
            .date { font-size: 0.85rem; color: #94a3b8; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">CLÍNICA DENTAL - DRA. MARISOL GARCÍA</span>
            <h1>Tu Periodontograma Online</h1>
            <h2>Paciente: <strong>${patient.full_name}</strong></h2>
            <div class="qr-wrapper">
              ${qrSvgHtml}
            </div>
            <p>Escanea este código QR con la cámara de tu teléfono para explorar tu periodontograma gráfico interactivo.</p>
            <div class="date">Fecha: ${examDate ? new Date(examDate).toLocaleDateString() : new Date().toLocaleDateString()}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 backdrop-blur-md rounded-xl">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Visor Online & Código QR</h3>
              <p className="text-xs text-teal-100">
                Universidad de Berna (periodontalchart-online.com)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 space-y-6">
          {/* Selector de Examen Inicial vs Reevaluación */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Paciente
              </span>
              <span className="text-sm font-bold text-slate-800">
                {patient.full_name}
              </span>
            </div>

            <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setIsReevaluation(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !isReevaluation
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Examen Inicial
              </button>
              <button
                type="button"
                onClick={() => setIsReevaluation(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isReevaluation
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reevaluación
              </button>
            </div>
          </div>

          {/* Sección Principal: QR y Enlace */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Código QR */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50/70 border border-slate-200 rounded-2xl">
              <div className="bg-white p-3 rounded-xl shadow-md border border-slate-100 flex items-center justify-center">
                <QRCodeSVG
                  id="periodontal-qr-svg"
                  value={viewerUrl}
                  size={180}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-[11px] text-slate-500 text-center mt-3 font-medium">
                📱 Escanear con el smartphone del paciente
              </p>
              <button
                type="button"
                onClick={handlePrintQR}
                className="mt-2 text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center space-x-1 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir tarjeta QR</span>
              </button>
            </div>

            {/* Acciones e Información */}
            <div className="md:col-span-7 space-y-4">
              <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-teal-900 font-semibold text-sm">
                  <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Protocolo de 1.800 dígitos numéricos</span>
                </div>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Las mediciones registradas en Marisol-Web se han codificado de forma anónima en el enlace. No se transmiten datos personales ni nombres del paciente a servidores externos.
                </p>
              </div>

              {/* Botón Principal: Abrir Visor */}
              <button
                type="button"
                onClick={handleOpenViewer}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 text-sm"
              >
                <span>Abrir en Visor Periodontal Online</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              {/* Botón Secundario: Copiar Enlace */}
              <button
                type="button"
                onClick={handleCopyLink}
                className={`w-full py-2.5 px-4 font-medium rounded-xl border transition-all flex items-center justify-center space-x-2 text-xs ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>¡Enlace copiado al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copiar enlace al portapapeles</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
