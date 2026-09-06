import React, { useState } from 'react'
import type { InventoryItem } from '../../../types'

interface InventoryBatchesModalProps {
  isOpen: boolean
  onClose: () => void
  item: InventoryItem | null
  onAddBatch: (params: {
    item_id: string
    batch_number: string
    initial_quantity: number
    current_quantity: number
    expiration_date: string
    status: 'active'
  }) => Promise<void>
  isAddingBatch: boolean
  onDepleteBatch: (batchId: string, itemId: string, discountQuantity: number) => Promise<void>
  isUpdatingBatch: boolean
}

export const InventoryBatchesModal: React.FC<InventoryBatchesModalProps> = ({
  isOpen,
  onClose,
  item,
  onAddBatch,
  isAddingBatch,
  onDepleteBatch,
  isUpdatingBatch,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [batchNumber, setBatchNumber] = useState('')
  const [quantity, setQuantity] = useState<number>(10)
  const [expDate, setExpDate] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen || !item) return null

  // Ordenar lotes por FEFO (First Expired First Out)
  const batches = [...(item.batches || [])].sort((a, b) => {
    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
  })

  const today = new Date()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!batchNumber.trim() || !expDate) {
      setErrorMsg('Por favor completa todos los campos del lote.')
      return
    }

    try {
      await onAddBatch({
        item_id: item.id,
        batch_number: batchNumber.trim(),
        initial_quantity: Math.max(1, Number(quantity)),
        current_quantity: Math.max(1, Number(quantity)),
        expiration_date: expDate,
        status: 'active',
      })
      setBatchNumber('')
      setQuantity(10)
      setExpDate('')
      setActiveTab('list')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar lote.')
    }
  }

  const handleDeplete = async (batchId: string, availableQty: number) => {
    const confirm = window.confirm(
      `¿Deseas dar de baja este lote? Se descontarán las ${availableQty} ${item.unit} restantes del stock total.`
    )
    if (!confirm) return

    try {
      await onDepleteBatch(batchId, item.id, availableQty)
    } catch {
      setErrorMsg('Error al dar de baja el lote.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
          <div>
            <h3 className="text-lg font-playfair font-bold text-navy">
              Control de Lotes y Caducidades
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {item.name} · Stock Total: <strong>{item.current_stock} {item.unit}</strong>
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

        {/* Tabs internas */}
        <div className="flex border-b border-gray-200 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2 px-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'list'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            Lotes Registrados ({batches.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-2 px-3 text-xs font-semibold transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'create'
                ? 'border-gold text-navy font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            <span>+ Registrar Nuevo Lote</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Contenido: Lista de Lotes con Semáforo */}
        {activeTab === 'list' && (
          <div className="space-y-3 text-xs">
            {batches.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
                <p className="text-gray-500 font-medium">No hay lotes registrados para este artículo.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-1.5 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 transition-all shadow-xs"
                >
                  Registrar Primer Lote
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200/80 rounded-2xl overflow-hidden">
                {batches.map((b) => {
                  const expDateObj = new Date(b.expiration_date)
                  const diffDays = Math.ceil((expDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const isExpired = diffDays <= 0 || b.status === 'expired'
                  const isSoon = !isExpired && diffDays <= 60
                  const isDepleted = b.current_quantity === 0 || b.status === 'depleted'

                  return (
                    <div
                      key={b.id}
                      className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                        isExpired
                          ? 'bg-red-50/40'
                          : isSoon
                          ? 'bg-amber-50/40'
                          : 'bg-white hover:bg-gray-50/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-navy text-xs">
                            {b.batch_number}
                          </span>
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                              VENCIDO ({Math.abs(diffDays)}d)
                            </span>
                          ) : isSoon ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              Vence en {diffDays} días
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Vigente ({diffDays} días)
                            </span>
                          )}

                          {isDepleted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              Agotado
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-gray-500">
                          <span>Fecha Caducidad: <strong>{b.expiration_date}</strong></span>
                          {b.received_date && (
                            <span className="ml-2 text-gray-400">· Recibido: {b.received_date}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-right">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Disponible</span>
                          <span className="font-bold text-sm text-navy">
                            {b.current_quantity}{' '}
                            <span className="text-xs font-normal text-gray-400">/ {b.initial_quantity}</span>
                          </span>
                        </div>

                        {!isDepleted && (
                          <button
                            type="button"
                            disabled={isUpdatingBatch}
                            onClick={() => handleDeplete(b.id, Number(b.current_quantity))}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Descartar lote (vencimiento o merma)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Contenido: Formulario para Agregar Nuevo Lote */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 text-xs font-montserrat">
            <div>
              <label className="block font-semibold text-navy mb-1">Número de Lote *</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="ej. LOT-2026-X8 o BATCH-309"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy mb-1">
                  Cantidad Recibida ({item.unit}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>El stock del artículo se incrementará automáticamente en {quantity} {item.unit}.</span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
              >
                Volver a la lista
              </button>
              <button
                type="submit"
                disabled={isAddingBatch}
                className="px-5 py-2 bg-gold text-white font-bold rounded-xl hover:bg-gold/90 transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {isAddingBatch ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Registrar Lote</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
