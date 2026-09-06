import React, { useState, useMemo } from 'react'
import type { InventoryMovement, InventoryMovementType } from '../../../types'
import { exportToCSV } from '../../../lib/exportUtils'

interface KardexTableProps {
  movements: InventoryMovement[]
  isLoading: boolean
  onOpenMovementModal: () => void
}

export const KardexTable: React.FC<KardexTableProps> = ({
  movements,
  isLoading,
  onOpenMovementModal,
}) => {
  const [filterType, setFilterType] = useState<InventoryMovementType | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (filterType !== 'all' && m.movement_type !== filterType) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const itemName = m.item?.name?.toLowerCase() || ''
        const itemCode = m.item?.code?.toLowerCase() || ''
        const reason = m.reason?.toLowerCase() || ''
        const batchNum = m.batch?.batch_number?.toLowerCase() || ''
        return itemName.includes(q) || itemCode.includes(q) || reason.includes(q) || batchNum.includes(q)
      }
      return true
    })
  }, [movements, filterType, searchQuery])

  const handleExportKardex = () => {
    if (filteredMovements.length === 0) return

    const exportData = filteredMovements.map((m) => ({
      'Fecha': new Date(m.created_at).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      'Artículo': m.item?.name || 'N/A',
      'Código / SKU': m.item?.code || 'N/A',
      'Tipo de Operación': m.movement_type,
      'Cantidad': m.quantity,
      'Unidad': m.item?.unit || 'unidad',
      'Lote': m.batch?.batch_number || 'N/A',
      'Sede': m.clinic?.name || 'General',
      'Sede Destino': m.destination_clinic?.name || 'N/A',
      'Motivo': m.reason || 'Sin observación',
    }))

    const dateStr = new Date().toISOString().split('T')[0]
    exportToCSV(exportData, `kardex-movimientos-${dateStr}`)
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm font-montserrat">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gold border-t-transparent mb-3"></div>
        <p className="text-xs text-gray-500">Cargando bitácora de movimientos (Kárdex)...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 font-montserrat">
      {/* Barra de Filtros del Kárdex */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Izquierda: Buscador */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por artículo, SKU, lote o motivo..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Derecha: Exportar y Registrar Movimiento */}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleExportKardex}
            className="px-3.5 py-2 bg-white border border-gray-300 hover:border-navy text-navy text-xs font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-navy/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Kárdex
          </button>

          <button
            type="button"
            onClick={onOpenMovementModal}
            className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-xl hover:bg-gold/90 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Chips de filtro por tipo de movimiento */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filterType === 'all'
              ? 'bg-navy text-white shadow-xs'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Todos ({movements.length})
        </button>
        <button
          onClick={() => setFilterType('entry')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
            filterType === 'entry'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
          }`}
        >
          <span>📥 Entradas</span>
        </button>
        <button
          onClick={() => setFilterType('exit_clinical')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
            filterType === 'exit_clinical'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          <span>🩺 Salidas Clínicas</span>
        </button>
        <button
          onClick={() => setFilterType('exit_admin')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
            filterType === 'exit_admin'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'
          }`}
        >
          <span>🏢 Salidas Admin</span>
        </button>
        <button
          onClick={() => setFilterType('adjustment')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
            filterType === 'adjustment'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <span>⚖️ Ajustes</span>
        </button>
        <button
          onClick={() => setFilterType('transfer')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
            filterType === 'transfer'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
          }`}
        >
          <span>🔄 Traslados</span>
        </button>
      </div>

      {/* Tabla de Movimientos */}
      {filteredMovements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center shadow-sm space-y-3 font-montserrat">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h4 className="text-sm font-bold text-navy">Sin registros en el Kárdex</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No se han encontrado movimientos con los filtros actuales. Haz clic en "Nuevo Movimiento" para registrar entradas, salidas o traslados.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm font-montserrat">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-600 uppercase font-bold text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Fecha y Hora</th>
                  <th className="px-5 py-3.5">Artículo / SKU</th>
                  <th className="px-5 py-3.5">Tipo de Operación</th>
                  <th className="px-5 py-3.5">Cantidad</th>
                  <th className="px-5 py-3.5">Sede / Ruta</th>
                  <th className="px-5 py-3.5">Lote</th>
                  <th className="px-5 py-3.5">Motivo / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMovements.map((m) => {
                  const isEntry = m.movement_type === 'entry'
                  const isExit = m.movement_type === 'exit_clinical' || m.movement_type === 'exit_admin'
                  const isTransfer = m.movement_type === 'transfer'

                  const dateObj = new Date(m.created_at)
                  const formattedDate = dateObj.toLocaleDateString('es-DO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                  const formattedTime = dateObj.toLocaleTimeString('es-DO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Fecha */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-navy block text-xs">{formattedDate}</span>
                        <span className="text-[10px] text-gray-400">{formattedTime}</span>
                      </td>

                      {/* Artículo */}
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-navy block text-xs">{m.item?.name}</span>
                        {m.item?.code && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            SKU: {m.item.code}
                          </span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            m.movement_type === 'entry'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : m.movement_type === 'exit_clinical'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : m.movement_type === 'exit_admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : m.movement_type === 'transfer'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {m.movement_type === 'entry'
                            ? '📥 Entrada'
                            : m.movement_type === 'exit_clinical'
                            ? '🩺 Salida Clínica'
                            : m.movement_type === 'exit_admin'
                            ? '🏢 Salida Admin'
                            : m.movement_type === 'transfer'
                            ? '🔄 Traslado'
                            : '⚖️ Ajuste'}
                        </span>
                      </td>

                      {/* Cantidad con signo */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-bold text-sm ${
                            isEntry
                              ? 'text-emerald-600'
                              : isExit || isTransfer
                              ? 'text-red-600'
                              : 'text-navy'
                          }`}
                        >
                          {isEntry ? `+${m.quantity}` : isExit || isTransfer ? `-${m.quantity}` : `${m.quantity}`}
                        </span>{' '}
                        <span className="text-[10px] text-gray-400 font-medium">
                          {m.item?.unit || 'uds.'}
                        </span>
                      </td>

                      {/* Sede / Ruta */}
                      <td className="px-5 py-3.5 text-gray-600">
                        {isTransfer && m.destination_clinic ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="font-semibold text-navy">{m.clinic?.name || 'General'}</span>
                            <span className="text-gray-400">➔</span>
                            <span className="font-semibold text-indigo-700">{m.destination_clinic.name}</span>
                          </div>
                        ) : (
                          <span className="font-medium text-navy text-xs">
                            {m.clinic?.name || 'Sede General'}
                          </span>
                        )}
                      </td>

                      {/* Lote */}
                      <td className="px-5 py-3.5">
                        {m.batch ? (
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-[10px] text-gray-700">
                            {m.batch.batch_number}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>

                      {/* Motivo */}
                      <td className="px-5 py-3.5 text-gray-700">
                        <span className="block text-xs max-w-xs truncate" title={m.reason || ''}>
                          {m.reason || 'Sin observación'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
