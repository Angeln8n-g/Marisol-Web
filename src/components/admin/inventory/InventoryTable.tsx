import React from 'react'
import type { InventoryItem } from '../../../types'

interface InventoryTableProps {
  items: InventoryItem[]
  isLoading: boolean
  onEditItem: (item: InventoryItem) => void
  onDeleteItem: (item: InventoryItem) => void
  onOpenBatchModal: (item: InventoryItem) => void
  onOpenQuickMovement: (item: InventoryItem) => void
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  isLoading,
  onEditItem,
  onDeleteItem,
  onOpenBatchModal,
  onOpenQuickMovement,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold border-t-transparent mb-3"></div>
        <p className="text-xs text-gray-500 font-montserrat">Cargando inventario general...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm space-y-3 font-montserrat">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-navy">No se encontraron artículos</h4>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          No hay artículos que coincidan con los filtros seleccionados. Prueba cambiando la búsqueda o registrando un nuevo producto.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm font-montserrat">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-50/80 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-5 py-3.5">Artículo / SKU</th>
              <th className="px-5 py-3.5">Categoría</th>
              <th className="px-5 py-3.5">Nivel de Stock</th>
              <th className="px-5 py-3.5">Mínimo</th>
              <th className="px-5 py-3.5">Costo Unit.</th>
              <th className="px-5 py-3.5">Valor Total</th>
              <th className="px-5 py-3.5">Sede / Ubicación</th>
              <th className="px-5 py-3.5">Lotes / Venc.</th>
              <th className="px-5 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const currentStock = Number(item.current_stock) || 0
              const minStock = Number(item.minimum_stock) || 0
              const costPrice = Number(item.cost_price) || 0
              const totalValuation = currentStock * costPrice

              const isOutOfStock = currentStock === 0
              const isLowStock = !isOutOfStock && currentStock <= minStock
              const isOptimal = currentStock > minStock

              // Porcentaje visual del stock respecto al mínimo (máx 100%)
              const stockRatio = minStock > 0 ? Math.min(100, Math.round((currentStock / (minStock * 2)) * 100)) : 100

              return (
                <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                  {/* Nombre y SKU */}
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-navy text-xs">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {item.code && (
                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                          {item.code}
                        </span>
                      )}
                      {item.brand && <span>Marca: {item.brand}</span>}
                      {item.serial_number && <span>S/N: {item.serial_number}</span>}
                    </div>
                  </td>

                  {/* Tipo / Categoría */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        item.item_type === 'tool'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : item.item_type === 'consumable_clinical'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.item_type === 'consumable_admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.item_type === 'tool'
                        ? 'Herramienta / Equipo'
                        : item.item_type === 'consumable_clinical'
                        ? 'Consumible Clínico'
                        : item.item_type === 'consumable_admin'
                        ? 'Administrativo'
                        : 'Otro'}
                    </span>
                  </td>

                  {/* Stock Actual con Barra de Salud */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`font-bold text-sm ${
                          isOutOfStock
                            ? 'text-red-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-navy'
                        }`}
                      >
                        {currentStock}
                      </span>
                      <span className="text-[10px] text-gray-500">{item.unit}</span>
                    </div>

                    {/* Desglose de unidades individuales si el empaque contiene más de 1 */}
                    {Boolean(item.units_per_package && item.units_per_package > 1) && (
                      <div className="text-[10px] text-gray-400 font-mono">
                        ≈ {Math.round(currentStock * (item.units_per_package || 1)).toLocaleString()} {item.dispense_unit || 'uds'}
                      </div>
                    )}

                    {/* Barra de progreso de stock */}
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOutOfStock
                            ? 'bg-red-500 w-full'
                            : isLowStock
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, stockRatio)}%` }}
                      />
                    </div>

                    <div className="mt-0.5">
                      {isOutOfStock && (
                        <span className="text-[9px] font-bold text-red-600 uppercase tracking-tight">
                          Agotado
                        </span>
                      )}
                      {isLowStock && (
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tight">
                          Bajo Stock
                        </span>
                      )}
                      {isOptimal && (
                        <span className="text-[9px] font-medium text-emerald-600">
                          Normal
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock Mínimo */}
                  <td className="px-5 py-3.5 text-gray-600">
                    <span className="font-medium">{minStock}</span>{' '}
                    <span className="text-[10px] text-gray-400">{item.unit}</span>
                  </td>

                  {/* Costo Unitario */}
                  <td className="px-5 py-3.5 text-navy font-medium">
                    RD$ {costPrice.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Valor Total en Stock */}
                  <td className="px-5 py-3.5 font-semibold text-navy">
                    RD$ {totalValuation.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Sede y Ubicación */}
                  <td className="px-5 py-3.5 text-gray-600">
                    <span className="font-medium text-navy block text-xs">
                      {item.clinic?.name || 'Sede General'}
                    </span>
                    {item.location_room && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                        📍 {item.location_room}
                      </span>
                    )}
                  </td>

                  {/* Lotes / Vencimiento */}
                  <td className="px-5 py-3.5">
                    {item.item_type === 'consumable_clinical' ? (
                      <button
                        type="button"
                        onClick={() => onOpenBatchModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-gold/15 hover:bg-gold/25 text-navy font-semibold text-[11px] border border-gold/40 flex items-center gap-1 transition-all active:scale-95"
                      >
                        <svg className="w-3.5 h-3.5 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Lotes</span>
                        <span className="bg-white/80 px-1 rounded text-[10px] text-navy">
                          {item.batches?.length || 0}
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-300 text-[11px]">N/A</span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenQuickMovement(item)}
                        className="px-2 py-1 rounded-lg bg-navy/5 hover:bg-navy/15 text-navy font-bold text-xs transition-colors border border-navy/20 flex items-center gap-1 shadow-2xs"
                        title="Registrar entrada o salida rápida"
                      >
                        <svg className="w-3 h-3 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>± Mov</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-gold text-navy hover:text-gold font-semibold text-xs transition-colors bg-white shadow-2xs"
                        title="Editar artículo"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="Desactivar / Dar de baja"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
