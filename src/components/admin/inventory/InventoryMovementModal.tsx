import React, { useState, useEffect, useMemo } from 'react'
import type { Clinic, InventoryItem, InventoryMovementType } from '../../../types'

interface InventoryMovementModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  preselectedItem: InventoryItem | null
  clinics: Clinic[]
  defaultClinicId: string
  onRegister: (params: {
    item_id: string
    movement_type: InventoryMovementType
    quantity: number
    clinic_id?: string
    destination_clinic_id?: string
    batch_id?: string
    reason?: string
  }) => Promise<void>
  isRegistering: boolean
}

export const InventoryMovementModal: React.FC<InventoryMovementModalProps> = ({
  isOpen,
  onClose,
  items,
  preselectedItem,
  clinics,
  defaultClinicId,
  onRegister,
  isRegistering,
}) => {
  const [selectedItemId, setSelectedItemId] = useState('')
  const [movementType, setMovementType] = useState<InventoryMovementType>('exit_clinical')
  const [quantity, setQuantity] = useState<number>(1)
  const [batchId, setBatchId] = useState('')
  const [destinationClinicId, setDestinationClinicId] = useState('')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const activeItem = useMemo(() => {
    return items.find((i) => i.id === selectedItemId) || preselectedItem || null
  }, [items, selectedItemId, preselectedItem])

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id)
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id)
    }
  }, [preselectedItem, items, selectedItemId])

  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setReason('')
      setBatchId('')
      setDestinationClinicId('')
      setErrorMsg(null)
    }
  }, [isOpen])

  const currentStock = Number(activeItem?.current_stock) || 0

  // Cálculo predictivo del stock final
  const projectedStock = useMemo(() => {
    if (!activeItem) return 0
    const qty = Number(quantity) || 0
    if (movementType === 'entry') return currentStock + qty
    if (movementType === 'exit_clinical' || movementType === 'exit_admin' || movementType === 'transfer') {
      return Math.max(0, currentStock - qty)
    }
    if (movementType === 'adjustment') return qty
    return currentStock
  }, [activeItem, currentStock, quantity, movementType])

  const isExceedingStock =
    (movementType === 'exit_clinical' || movementType === 'exit_admin' || movementType === 'transfer') &&
    quantity > currentStock

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!activeItem) {
      setErrorMsg('Debes seleccionar un artículo.')
      return
    }

    if (quantity <= 0 && movementType !== 'adjustment') {
      setErrorMsg('La cantidad debe ser mayor a cero.')
      return
    }

    if (isExceedingStock) {
      setErrorMsg(`No puedes retirar más del stock actual (${currentStock} ${activeItem.unit}).`)
      return
    }

    if (movementType === 'transfer' && !destinationClinicId) {
      setErrorMsg('Debes seleccionar la clínica de destino para el traslado.')
      return
    }

    try {
      await onRegister({
        item_id: activeItem.id,
        movement_type: movementType,
        quantity: Number(quantity),
        clinic_id: activeItem.clinic_id || defaultClinicId || undefined,
        destination_clinic_id: movementType === 'transfer' ? destinationClinicId : undefined,
        batch_id: batchId || undefined,
        reason: reason.trim() || undefined,
      })
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el movimiento.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-playfair font-bold text-navy">
              Registrar Movimiento de Inventario
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Trazabilidad en tiempo real de entradas, salidas clínicas y traslados
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Selector de Artículo */}
          <div>
            <label className="block font-semibold text-navy mb-1">Artículo / Insumo *</label>
            {preselectedItem ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-navy text-xs block">{preselectedItem.name}</span>
                  <span className="text-[10px] text-gray-500">
                    {preselectedItem.code ? `SKU: ${preselectedItem.code} · ` : ''}
                    Sede: {preselectedItem.clinic?.name || 'General'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block uppercase">Stock Actual</span>
                  <span className="font-bold text-navy text-sm">
                    {currentStock} {preselectedItem.unit}
                  </span>
                </div>
              </div>
            ) : (
              <select
                required
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs font-medium"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.current_stock} {i.unit} disponibles)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Tipo de Movimiento */}
          <div>
            <label className="block font-semibold text-navy mb-1.5">Tipo de Operación *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('exit_clinical')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  movementType === 'exit_clinical'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="block text-xs">🩺 Salida Clínica</span>
                <span className="text-[10px] text-gray-500 block">Uso en sillón / paciente</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('entry')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  movementType === 'entry'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="block text-xs">📥 Entrada / Compra</span>
                <span className="text-[10px] text-gray-500 block">Recepción de mercancía</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('adjustment')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  movementType === 'adjustment'
                    ? 'border-purple-600 bg-purple-50/50 text-purple-900 font-bold ring-1 ring-purple-500'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="block text-xs">⚖️ Ajuste de Stock</span>
                <span className="text-[10px] text-gray-500 block">Conteo físico / merma</span>
              </button>

              <button
                type="button"
                onClick={() => setMovementType('transfer')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  movementType === 'transfer'
                    ? 'border-amber-600 bg-amber-50/50 text-amber-900 font-bold ring-1 ring-amber-500'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <span className="block text-xs">🔄 Traslado de Sede</span>
                <span className="text-[10px] text-gray-500 block">Envío a otra clínica</span>
              </button>
            </div>
          </div>

          {/* Cantidad y Previsualización de Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-semibold text-navy mb-1">
                {movementType === 'adjustment' ? 'Nuevo Stock Físico *' : `Cantidad a ${movementType === 'entry' ? 'Ingresar' : 'Retirar'} *`}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={movementType === 'adjustment' ? 0 : 1}
                  step="any"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-xl focus:outline-none text-xs font-bold ${
                    isExceedingStock
                      ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-400'
                      : 'border-gray-300 focus:ring-2 focus:ring-gold text-navy'
                  }`}
                />
                <span className="absolute right-3 top-2 text-[10px] text-gray-400 font-medium">
                  {activeItem?.unit || 'unidades'}
                </span>
              </div>
            </div>

            {/* Preview Box */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Impacto en Stock
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{currentStock}</span>
                <span className="text-xs text-gray-400">➔</span>
                <span
                  className={`text-sm font-bold ${
                    projectedStock < Number(activeItem?.minimum_stock || 0)
                      ? 'text-amber-600'
                      : 'text-navy'
                  }`}
                >
                  {projectedStock} {activeItem?.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Selector de Lote (si es consumible clínico y tiene lotes) */}
          {activeItem?.item_type === 'consumable_clinical' && activeItem.batches && activeItem.batches.length > 0 && (
            <div>
              <label className="block font-semibold text-navy mb-1">
                Lote Asociado (Opcional)
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs"
              >
                <option value="">Seleccionar un lote específico...</option>
                {activeItem.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    Lote {b.batch_number} · Vence: {b.expiration_date} · Disp: {b.current_quantity}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clínica de Destino (Solo para Traslados) */}
          {movementType === 'transfer' && (
            <div>
              <label className="block font-semibold text-navy mb-1">Sede de Destino *</label>
              <select
                required
                value={destinationClinicId}
                onChange={(e) => setDestinationClinicId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white text-xs"
              >
                <option value="">Selecciona la sede destino</option>
                {clinics
                  .filter((c) => c.id !== (activeItem?.clinic_id || defaultClinicId))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Motivo o Justificación */}
          <div>
            <label className="block font-semibold text-navy mb-1">Motivo o Justificación</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ej. Procedimiento de resina Box 1, Factura #402, Rotura accidental"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isRegistering || isExceedingStock}
              className="px-6 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isRegistering ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <span>Confirmar Movimiento</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
