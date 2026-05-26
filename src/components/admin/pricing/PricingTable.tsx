import React, { useState } from 'react'
import { usePricing, usePriceHistory } from '../../../hooks/usePricing'
import { PriceUpdateForm, type PriceUpdateFormValues } from './PriceUpdateForm'
import { PriceHistoryModal } from './PriceHistoryModal'
import { formatCurrency } from '../../../lib/utils'

export const PricingTable: React.FC = () => {
  const { currentPrices, isLoading, updatePrice, isUpdating, refetch } = usePricing()
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null)
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: history = [] } = usePriceHistory(showHistoryFor)

  const editingItem = currentPrices.find((p) => p.procedure_id === editingProcedureId)

  const handleUpdate = async (data: PriceUpdateFormValues) => {
    if (!editingProcedureId) return
    setFormError(null)
    try {
      await updatePrice({
        procedure_id: editingProcedureId,
        ...data,
      })
      setEditingProcedureId(null)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al actualizar precio')
    }
  }

  if (editingItem) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-playfair text-navy mb-4">Actualizar Precio</h3>
        {formError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
            {formError}
          </div>
        )}
        <PriceUpdateForm
          procedureName={editingItem.procedure?.name || 'Procedimiento'}
          currentPrice={editingItem.price}
          currentCurrency={editingItem.currency}
          onSubmit={handleUpdate}
          isSubmitting={isUpdating}
          onCancel={() => setEditingProcedureId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : currentPrices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 font-montserrat">No hay precios configurados</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Procedimiento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Moneda</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentPrices.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">
                    {item.procedure?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.procedure?.category || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-navy">
                    {formatCurrency(item.price, item.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.currency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => setEditingProcedureId(item.procedure_id)}
                      className="text-gold hover:text-gold/80 text-sm font-medium"
                    >
                      Actualizar
                    </button>
                    <button
                      onClick={() => setShowHistoryFor(item.procedure_id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PriceHistoryModal
        isOpen={!!showHistoryFor}
        onClose={() => setShowHistoryFor(null)}
        procedureName={currentPrices.find((p) => p.procedure_id === showHistoryFor)?.procedure?.name || 'Procedimiento'}
        history={history}
      />
    </div>
  )
}
