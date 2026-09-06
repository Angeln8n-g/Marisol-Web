import React, { useState, useEffect } from 'react'
import type { InventoryItem, Clinic, PredictiveRestockItem } from '../../../types'

interface PurchaseOrderItemForm {
  item_id: string
  package_quantity: number
  unit_cost: number
  notes?: string
}

interface PurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  clinics: Clinic[]
  defaultClinicId?: string
  inventoryItems: InventoryItem[]
  prefilledItems?: PredictiveRestockItem[] | null
  forecastDays?: number
  onSave: (payload: {
    clinic_id?: string | null
    supplier_name: string
    supplier_contact?: string | null
    supplier_rnc?: string | null
    forecast_window_days?: number
    notes?: string | null
    estimated_delivery_date?: string | null
    status: 'draft' | 'sent'
    items: PurchaseOrderItemForm[]
  }) => Promise<void>
  isSaving: boolean
}

export const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  clinics,
  defaultClinicId,
  inventoryItems,
  prefilledItems,
  forecastDays = 14,
  onSave,
  isSaving,
}) => {
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierRnc, setSupplierRnc] = useState('')
  const [clinicId, setClinicId] = useState(defaultClinicId || '')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orderItems, setOrderItems] = useState<PurchaseOrderItemForm[]>([])
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false)

  // Initialize from prefilled predictive restock items or empty state
  useEffect(() => {
    if (!isOpen) return

    setClinicId(defaultClinicId || (clinics.length > 0 ? clinics[0].id : ''))
    setDeliveryDate(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    )
    setOrderNotes('')
    setSupplierName('Distribuidora Dental Dominicana')
    setSupplierContact('809-555-0199')
    setSupplierRnc('')
    setCopiedWhatsapp(false)

    if (prefilledItems && prefilledItems.length > 0) {
      const mapped = prefilledItems.map((pi) => ({
        item_id: pi.item.id,
        package_quantity: pi.suggestedPackagesToOrder,
        unit_cost: Number(pi.item.cost_price) || 0,
        notes: pi.urgency === 'out_of_stock' ? 'URGENTE: Stock Agotado' : undefined,
      }))
      setOrderItems(mapped)
    } else {
      setOrderItems([
        {
          item_id: inventoryItems[0]?.id || '',
          package_quantity: 1,
          unit_cost: Number(inventoryItems[0]?.cost_price) || 0,
        },
      ])
    }
  }, [isOpen, prefilledItems, inventoryItems, clinics, defaultClinicId])

  if (!isOpen) return null

  // Calculations
  const totalAmount = orderItems.reduce((sum, line) => {
    return sum + (Number(line.package_quantity) || 0) * (Number(line.unit_cost) || 0)
  }, 0)

  const handleAddItemLine = () => {
    const firstAvailable = inventoryItems[0]
    setOrderItems((prev) => [
      ...prev,
      {
        item_id: firstAvailable?.id || '',
        package_quantity: 1,
        unit_cost: Number(firstAvailable?.cost_price) || 0,
      },
    ])
  }

  const handleRemoveItemLine = (index: number) => {
    setOrderItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((i) => i.id === itemId)
    setOrderItems((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        item_id: itemId,
        unit_cost: selectedItem ? Number(selectedItem.cost_price) || 0 : copy[index].unit_cost,
      }
      return copy
    })
  }

  const handleLineChange = (index: number, field: keyof PurchaseOrderItemForm, value: any) => {
    setOrderItems((prev) => {
      const copy = [...prev]
      copy[index] = {
        ...copy[index],
        [field]: value,
      }
      return copy
    })
  }

  const handleSubmit = async (targetStatus: 'draft' | 'sent') => {
    if (!supplierName.trim()) {
      alert('Por favor indica el nombre del proveedor.')
      return
    }
    if (orderItems.length === 0) {
      alert('Debes agregar al menos un artículo a la orden de compra.')
      return
    }

    await onSave({
      clinic_id: clinicId || null,
      supplier_name: supplierName.trim(),
      supplier_contact: supplierContact.trim() || null,
      supplier_rnc: supplierRnc.trim() || null,
      forecast_window_days: forecastDays,
      notes: orderNotes.trim() || null,
      estimated_delivery_date: deliveryDate || null,
      status: targetStatus,
      items: orderItems,
    })
  }

  // Copy WhatsApp text format
  const handleCopyWhatsApp = () => {
    const clinicName = clinics.find((c) => c.id === clinicId)?.name || 'Dra. Marisol - Clínica Dental'
    const today = new Date().toLocaleDateString('es-DO')

    const itemsText = orderItems
      .map((line) => {
        const item = inventoryItems.find((i) => i.id === line.item_id)
        return `• *${item?.name || 'Artículo'}* (${item?.code || 'S/C'}): ${line.package_quantity} ${item?.unit || 'uds'} x RD$ ${Number(line.unit_cost).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
      })
      .join('\n')

    const message = `*ORDEN DE COMPRA - ${clinicName.toUpperCase()}*\n📅 *Fecha:* ${today}\n🏪 *Suplidor:* ${supplierName}\n📦 *Fecha Entrega Estimada:* ${deliveryDate || 'Lo antes posible'}\n\n*DETALLE DE ARTÍCULOS:*\n${itemsText}\n\n💰 *Total Estimado:* RD$ ${totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n${orderNotes ? `\n📝 *Notas / Indicaciones:* ${orderNotes}` : ''}\n\n_Por favor confirmar disponibilidad y tiempo de entrega._`

    navigator.clipboard.writeText(message)
    setCopiedWhatsapp(true)
    setTimeout(() => setCopiedWhatsapp(false), 3000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-montserrat overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-100 my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gold/15 text-gold flex items-center justify-center font-bold">
              📦
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
                Generar Orden de Compra a Proveedor
              </h3>
              <p className="text-xs text-gray-500">
                Gestión de compras con cálculo predictivo e integración directa al Kardex
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Supplier & Clinic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-navy mb-1">
              Nombre del Suplidor / Distribuidor *
            </label>
            <input
              type="text"
              required
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="ej. Dental Tech Dominicana / Suplidora Médica"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">
              Contacto / Teléfono / WhatsApp
            </label>
            <input
              type="text"
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              placeholder="809-555-0199 / ventas@suplidora.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">
              Sede Receptora de la Mercancía
            </label>
            <select
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none bg-white"
            >
              <option value="">Sede General / Central</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-navy mb-1">
              Fecha Estimada de Entrega
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Artículos Solicitados ({orderItems.length})
            </span>
            <button
              type="button"
              onClick={handleAddItemLine}
              className="text-xs font-semibold text-gold hover:text-navy transition-colors flex items-center gap-1"
            >
              + Agregar otro artículo
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-2xl divide-y divide-gray-100">
            {orderItems.map((line, idx) => {
              const item = inventoryItems.find((i) => i.id === line.item_id)
              const lineTotal = (Number(line.package_quantity) || 0) * (Number(line.unit_cost) || 0)

              return (
                <div key={idx} className="p-3 grid grid-cols-12 gap-2 items-center text-xs bg-gray-50/50 hover:bg-white transition-colors">
                  {/* Item selector */}
                  <div className="col-span-12 sm:col-span-5">
                    <select
                      value={line.item_id}
                      onChange={(e) => handleItemChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs bg-white focus:ring-1 focus:ring-gold focus:outline-none"
                    >
                      {inventoryItems.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.name} ({inv.code || 'S/C'}) - Stock: {inv.current_stock} {inv.unit}
                        </option>
                      ))}
                    </select>
                    {item && (
                      <span className="text-[10px] text-gray-400 block mt-0.5">
                        Presentación: {item.units_per_package || 1} {item.dispense_unit || 'uds'} / {item.unit}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={line.package_quantity}
                      onChange={(e) => handleLineChange(idx, 'package_quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-center"
                    />
                  </div>

                  {/* Unit Cost */}
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-gray-500 mb-0.5">Costo Unit (RD$)</label>
                    <input
                      type="number"
                      min={0}
                      value={line.unit_cost}
                      onChange={(e) => handleLineChange(idx, 'unit_cost', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-xl text-xs text-right"
                    />
                  </div>

                  {/* Subtotal & delete */}
                  <div className="col-span-4 sm:col-span-3 flex items-center justify-end gap-3">
                    <div className="text-right">
                      <span className="block text-[10px] text-gray-400">Total</span>
                      <span className="font-bold text-navy text-xs">
                        RD$ {lineTotal.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItemLine(idx)}
                      disabled={orderItems.length <= 1}
                      className="w-6 h-6 rounded-lg text-red-400 hover:text-red-700 hover:bg-red-50 flex items-center justify-center transition-colors disabled:opacity-30"
                      title="Eliminar artículo"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-2">
          <div>
            <label className="block text-xs font-semibold text-navy mb-1">
              Notas / Instrucciones al Proveedor
            </label>
            <textarea
              rows={2}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="ej. Favor entregar en horario de mañana; especificar número de lote y fecha de vencimiento."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-gold focus:outline-none"
            />
          </div>

          <div className="bg-sand/30 p-3.5 rounded-2xl border border-sand/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Renglones a ordenar:</span>
              <span className="font-bold">{orderItems.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Total Unidades/Paquetes:</span>
              <span className="font-bold">
                {orderItems.reduce((acc, it) => acc + (Number(it.package_quantity) || 0), 0)}
              </span>
            </div>
            <div className="border-t border-sand/60 pt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-navy">Monto Total Estimado:</span>
              <span className="font-bold text-navy text-base">
                RD$ {totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              {copiedWhatsapp ? '✓ ¡Copiado al Portapapeles!' : '💬 Copiar para WhatsApp'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              🖨️ Imprimir
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              Guardar Borrador
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSubmit('sent')}
              className="px-5 py-2 bg-navy text-gold hover:bg-navy/90 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : '🚀 Guardar y Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
