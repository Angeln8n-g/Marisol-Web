import React from 'react'
import type { ProcedurePrice } from '../../../types'
import { formatDate, formatCurrency } from '../../../lib/utils'
import { Modal } from '../../ui'

interface PriceHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  procedureName: string
  history: ProcedurePrice[]
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  isOpen,
  onClose,
  procedureName,
  history,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Historial de Precios: ${procedureName}`} size="lg">
      {history.length === 0 ? (
        <p className="text-sm text-gray-500 font-montserrat py-4">No hay historial de precios disponible</p>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div
              key={entry.id}
              className={`p-4 rounded-lg border ${
                !entry.effective_to ? 'border-gold bg-gold/5' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-playfair font-bold text-navy">
                  {formatCurrency(entry.price, entry.currency)}
                </p>
                {!entry.effective_to && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                    Vigente
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-montserrat text-gray-500">
                <div>
                  <span className="font-medium text-gray-700">Moneda:</span> {entry.currency}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Desde:</span> {formatDate(entry.effective_from)}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Hasta:</span>{' '}
                  {entry.effective_to ? formatDate(entry.effective_to) : '—'}
                </div>
              </div>

              {entry.change_reason && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-700 font-montserrat mb-0.5">Motivo:</p>
                  <p className="text-xs text-gray-600 font-montserrat">{entry.change_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
