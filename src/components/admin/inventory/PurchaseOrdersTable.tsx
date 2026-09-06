import React, { useState } from 'react'
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem } from '../../../types'

interface PurchaseOrdersTableProps {
  orders: PurchaseOrder[]
  isLoading: boolean
  onReceiveOrder: (order: PurchaseOrder) => Promise<void>
  onCancelOrder: (orderId: string) => Promise<void>
  onOpenCreateOrder: () => void
  isReceiving?: boolean
}

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  orders,
  isLoading,
  onReceiveOrder,
  onCancelOrder,
  onOpenCreateOrder,
  isReceiving = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true
    return o.status === statusFilter
  })

  const handleConfirmReceive = async () => {
    if (!receivingOrder) return
    try {
      await onReceiveOrder(receivingOrder)
      setReceivingOrder(null)
    } catch {
      // Error handled by caller toast
    }
  }

  const handleCopyOrderText = (order: PurchaseOrder) => {
    const today = new Date(order.created_at).toLocaleDateString('es-DO')
    const itemsText = (order.items || [])
      .map(
        (it: PurchaseOrderItem) =>
          `• *${it.item?.name || 'Artículo'}*: ${it.package_quantity} ${it.item?.unit || 'uds'} x RD$ ${Number(it.unit_cost).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
      )
      .join('\n')

    const message = `*ORDEN DE COMPRA #${order.order_number}*\n📅 *Fecha:* ${today}\n🏪 *Suplidor:* ${order.supplier_name}\n📍 *Sede:* ${order.clinic?.name || 'Clínica Dental'}\n\n*ÍTEMS:*\n${itemsText}\n\n💰 *Total:* RD$ ${Number(order.total_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}\n${order.notes ? `\n📝 *Notas:* ${order.notes}` : ''}`

    navigator.clipboard.writeText(message)
    setCopiedId(order.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'received':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Recibida en Inventario
          </span>
        )
      case 'sent':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold border border-blue-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Enviada a Suplidor
          </span>
        )
      case 'draft':
        return (
          <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold border border-gray-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            Borrador
          </span>
        )
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-bold border border-red-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Cancelada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 font-montserrat">
      {/* Header & Filter tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-playfair font-bold text-navy">
            Historial de Órdenes de Compra
          </h3>
          <p className="text-xs text-gray-500">
            Control de pedidos a suplidores con recepción en un clic que alimenta stock y Kardex
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {(
              [
                { key: 'all', label: 'Todas' },
                { key: 'sent', label: 'Enviadas' },
                { key: 'draft', label: 'Borradores' },
                { key: 'received', label: 'Recibidas' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusFilter(t.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === t.key
                    ? 'bg-white text-navy shadow-xs font-bold'
                    : 'text-gray-500 hover:text-navy'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenCreateOrder}
            className="px-3.5 py-1.5 bg-navy text-gold hover:bg-navy/90 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
          >
            + Nueva Orden
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-xs animate-pulse">
          Cargando órdenes de compra...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto text-xl">
            📦
          </div>
          <p className="text-xs font-semibold text-gray-600">
            No se encontraron órdenes de compra en esta vista.
          </p>
          <p className="text-[11px] text-gray-400">
            Crea una nueva orden de compra o genera una sugerida desde el reorden predictivo.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Nº Orden / Fecha</th>
                <th className="pb-3 font-medium">Suplidor / Contacto</th>
                <th className="pb-3 font-medium">Sede</th>
                <th className="pb-3 font-medium text-center">Renglones</th>
                <th className="pb-3 font-medium text-right">Total (RD$)</th>
                <th className="pb-3 font-medium text-center">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => {
                const itemsCount = order.items?.length || 0
                const isReceived = order.status === 'received'
                const isCancelled = order.status === 'cancelled'

                return (
                  <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3 pr-3">
                      <span className="font-bold text-navy">{order.order_number}</span>
                      <div className="text-[10px] text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('es-DO')}
                        {order.estimated_delivery_date && (
                          <span> • Entrega: {order.estimated_delivery_date}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-3">
                      <div className="font-semibold text-gray-800">{order.supplier_name}</div>
                      {order.supplier_contact && (
                        <div className="text-[10px] text-gray-400">{order.supplier_contact}</div>
                      )}
                    </td>

                    <td className="py-3 pr-3 text-gray-600">
                      {order.clinic?.name || 'General'}
                    </td>

                    <td className="py-3 text-center">
                      <span
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold cursor-help"
                        title={order.items
                          ?.map(
                            (it: PurchaseOrderItem) =>
                              `${it.item?.name}: ${it.package_quantity} ${it.item?.unit || 'uds'}`
                          )
                          .join('\n')}
                      >
                        {itemsCount} artículo(s)
                      </span>
                    </td>

                    <td className="py-3 text-right font-bold text-navy">
                      RD${' '}
                      {Number(order.total_amount).toLocaleString('es-DO', {
                        minimumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-3 text-center">{getStatusBadge(order.status)}</td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp copy */}
                        <button
                          type="button"
                          onClick={() => handleCopyOrderText(order)}
                          className="px-2 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Copiar texto para enviar por WhatsApp al proveedor"
                        >
                          {copiedId === order.id ? '✓ Copiado' : '💬 WhatsApp'}
                        </button>

                        {/* 1-Click Receive in Inventory */}
                        {!isReceived && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => setReceivingOrder(order)}
                            className="px-2.5 py-1 rounded-lg text-white bg-gold hover:bg-gold/90 text-[11px] font-bold transition-all shadow-2xs flex items-center gap-1 hover:scale-105"
                            title="Ingresar mercancía automáticamente a stock y Kardex"
                          >
                            📥 Recibir
                          </button>
                        )}

                        {/* Cancel order if not received */}
                        {!isReceived && !isCancelled && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Estás seguro de cancelar la orden #${order.order_number}?`
                                )
                              ) {
                                onCancelOrder(order.id)
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="Cancelar orden"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal for Receiving Order */}
      {receivingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-montserrat">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                📥
              </div>
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">
                  Confirmar Recepción de Mercancía
                </h3>
                <p className="text-xs text-gray-500">
                  Orden #{receivingOrder.order_number} ({receivingOrder.supplier_name})
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Al confirmar, el sistema automáticamente:
            </p>

            <ul className="text-xs text-gray-700 space-y-1.5 list-disc pl-5">
              <li>
                Incrementará las existencias de{' '}
                <strong>{receivingOrder.items?.length || 0} artículos</strong> en el inventario.
              </li>
              <li>Registrará el movimiento de entrada en el Kardex clínico.</li>
              <li>Actualizará el precio de costo de los artículos.</li>
              <li>Marcará esta orden como <strong>Recibida</strong>.</li>
            </ul>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              💡 <strong>Nota:</strong> Los insumos recibidos satisfarán inmediatamente los requerimientos de las próximas citas.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReceivingOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isReceiving}
                onClick={handleConfirmReceive}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isReceiving ? 'Ingresando...' : '✓ Confirmar e Ingresar a Inventario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
