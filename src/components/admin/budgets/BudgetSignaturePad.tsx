import React, { useRef, useState, useEffect, useCallback } from 'react'

export interface BudgetSignatureData {
  signatureDataUrl: string
  signerName: string
  signerIdDoc: string
  signerRole: 'patient' | 'guardian' | 'representative'
}

interface BudgetSignaturePadProps {
  initialSignerName?: string
  initialSignerIdDoc?: string
  initialSignerRole?: 'patient' | 'guardian' | 'representative'
  onSave: (data: BudgetSignatureData) => void
  onCancel?: () => void
  isSubmitting?: boolean
  title?: string
  description?: string
}

interface Point {
  x: number
  y: number
}

export const BudgetSignaturePad: React.FC<BudgetSignaturePadProps> = ({
  initialSignerName = '',
  initialSignerIdDoc = '',
  initialSignerRole = 'patient',
  onSave,
  onCancel,
  isSubmitting = false,
  title = 'Firma Digital de Conformidad',
  description = 'Firme en el recuadro utilizando su dedo, lápiz óptico o ratón',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([])
  const [hasSignature, setHasSignature] = useState(false)
  const [signerName, setSignerName] = useState(initialSignerName)
  const [signerIdDoc, setSignerIdDoc] = useState(initialSignerIdDoc)
  const [signerRole, setSignerRole] = useState<'patient' | 'guardian' | 'representative'>(initialSignerRole)
  const [acceptedTerms, setAcceptedTerms] = useState(true)
  const [lastPoint, setLastPoint] = useState<Point | null>(null)

  // Initialize and resize canvas for High-DPI screens (Retina, iPads, Tablets)
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    // Only re-dimension if needed to prevent canvas clearing on simple re-renders
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 2.5
        ctx.strokeStyle = '#0F172A' // Navy Dark Ink
      }
    }
  }, [])

  useEffect(() => {
    setupCanvas()
    window.addEventListener('resize', setupCanvas)
    return () => window.removeEventListener('resize', setupCanvas)
  }, [setupCanvas])

  // Get canvas coordinates from pointer event
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  // Pointer Down: Start drawing stroke
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    // Capture pointer to continue drawing even if touch drifts slightly outside bounding box
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Ignored for environments where pointer capture isn't supported
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save snapshot to history before drawing new stroke
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setStrokeHistory((prev) => [...prev, snapshot])

    const coords = getCanvasCoords(e)
    setIsDrawing(true)
    setLastPoint(coords)

    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
    // Draw a small dot on single touch/click
    ctx.lineTo(coords.x + 0.1, coords.y + 0.1)
    ctx.stroke()
    setHasSignature(true)
  }

  // Pointer Move: Smooth stroke interpolation
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPoint) return

    const currentPoint = getCanvasCoords(e)

    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)

    // Midpoint quadratic curve for smoother handwriting
    const midPoint = {
      x: (lastPoint.x + currentPoint.x) / 2,
      y: (lastPoint.y + currentPoint.y) / 2,
    }

    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midPoint.x, midPoint.y)
    ctx.lineTo(currentPoint.x, currentPoint.y)
    ctx.stroke()

    setLastPoint(currentPoint)
    setHasSignature(true)
  }

  // Pointer Up: Finish stroke
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()
    setIsDrawing(false)
    setLastPoint(null)

    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
  }

  // Undo last stroke
  const handleUndo = () => {
    const canvas = canvasRef.current
    if (!canvas || strokeHistory.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const lastSnapshot = strokeHistory[strokeHistory.length - 1]
    ctx.putImageData(lastSnapshot, 0, 0)
    setStrokeHistory((prev) => prev.slice(0, prev.length - 1))

    if (strokeHistory.length <= 1) {
      setHasSignature(false)
    }
  }

  // Clear entire canvas
  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setStrokeHistory([])
    setHasSignature(false)
    setLastPoint(null)
  }

  // Submit and export signature
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return
    if (!signerName.trim()) return

    // Export crisp PNG data url
    const signatureDataUrl = canvas.toDataURL('image/png')

    onSave({
      signatureDataUrl,
      signerName: signerName.trim(),
      signerIdDoc: signerIdDoc.trim(),
      signerRole,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-montserrat">
      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-base font-bold text-navy font-playfair">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      {/* Signer Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-sand/20 p-3 rounded-lg border border-gold/30">
        <div>
          <label className="block text-xs font-semibold text-navy mb-1">
            Nombre del Firmante *
          </label>
          <input
            type="text"
            required
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="ej. Juan Pérez"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">
            Cédula / Documento de Identidad
          </label>
          <input
            type="text"
            value={signerIdDoc}
            onChange={(e) => setSignerIdDoc(e.target.value)}
            placeholder="001-0000000-0"
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1">
            Calidad / Parentesco
          </label>
          <select
            value={signerRole}
            onChange={(e) => setSignerRole(e.target.value as any)}
            className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-gold"
          >
            <option value="patient">Paciente Titular</option>
            <option value="guardian">Padre / Madre / Tutor Legal</option>
            <option value="representative">Representante Autorizado</option>
          </select>
        </div>
      </div>

      {/* Interactive Touchscreen Canvas */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-navy flex items-center gap-1.5">
            <span>✍️</span> Trazo de Firma Manuscrita
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokeHistory.length === 0}
              className="text-gray-600 hover:text-navy disabled:opacity-40 font-medium text-[11px] flex items-center gap-1"
              title="Deshacer el último trazo"
            >
              ↺ Deshacer trazo
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasSignature}
              className="text-red-600 hover:text-red-700 disabled:opacity-40 font-medium text-[11px] flex items-center gap-1"
              title="Borrar lienzo y volver a firmar"
            >
              ✕ Borrar
            </button>
          </div>
        </div>

        {/* Canvas container with touch-action: none */}
        <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-white shadow-inner select-none">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-44 sm:h-48 cursor-crosshair touch-none bg-white block"
            style={{ touchAction: 'none' }}
          />

          {/* Guide baseline */}
          <div className="absolute bottom-8 left-8 right-8 border-b border-gray-200 pointer-events-none flex justify-between text-[10px] text-gray-300">
            <span>✕ Firme sobre esta línea</span>
            <span>Documento Digital Clínico</span>
          </div>

          {!hasSignature && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-300 gap-1">
              <span className="text-2xl">✍️</span>
              <span className="text-xs font-medium">Toque o deslice aquí para firmar</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center">
          Compatible con pantallas táctiles, iPads, tablets Android, lápices digitales y ratón.
        </p>
      </div>

      {/* Legal Acceptance Clause */}
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex items-start gap-2.5">
        <input
          type="checkbox"
          id="accept-budget-terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-gold focus:ring-gold cursor-pointer"
        />
        <label htmlFor="accept-budget-terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
          Certifico que he revisado y acepto los tratamientos odontológicos presupuestados, las condiciones clínicas, los plazos estimados y el cronograma de pago acordado.
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={!hasSignature || !signerName.trim() || !acceptedTerms || isSubmitting}
          className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-white text-xs font-bold rounded-md shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Guardando firma...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Confirmar y Guardar Firma</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
