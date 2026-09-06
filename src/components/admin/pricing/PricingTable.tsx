import React, { useState, useMemo } from 'react'
import { usePricing, usePriceHistory } from '../../../hooks/usePricing'
import { PriceUpdateForm, type PriceUpdateFormValues } from './PriceUpdateForm'
import { PriceHistoryModal } from './PriceHistoryModal'
import { formatCurrency, formatDate } from '../../../lib/utils'

export const PricingTable: React.FC = () => {
  const {
    currentPrices,
    totalProcedures,
    pricedCount,
    unpricedCount,
    isLoading,
    updatePrice,
    isUpdating,
    refetch,
  } = usePricing()

  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null)
  const [showHistoryFor, setShowHistoryFor] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<'all' | 'priced' | 'unpriced'>('all')

  const { data: history = [] } = usePriceHistory(showHistoryFor)

  const editingItem = currentPrices.find((p) => p.procedure_id === editingProcedureId)

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    currentPrices.forEach((p) => {
      if (p.procedure?.category) cats.add(p.procedure.category)
    })
    return Array.from(cats).sort()
  }, [currentPrices])

  // Filter items
  const filteredItems = useMemo(() => {
    return currentPrices.filter((item) => {
      const proc = item.procedure
      const matchesSearch =
        searchQuery === '' ||
        proc?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc?.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proc?.description?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' || proc?.category === selectedCategory

      const matchesPriceStatus =
        priceFilter === 'all'
          ? true
          : priceFilter === 'priced'
          ? item.price !== null
          : item.price === null

      return matchesSearch && matchesCategory && matchesPriceStatus
    })
  }, [currentPrices, searchQuery, selectedCategory, priceFilter])

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
      setFormError(e instanceof Error ? e.message : 'Error al guardar precio')
    }
  }

  if (editingItem) {
    const isInitial = editingItem.price === null
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <h3 className="text-lg font-playfair text-navy font-semibold">
            {isInitial ? 'Asignar Precio Inicial' : 'Actualizar Precio'}
          </h3>
          <button
            onClick={() => setEditingProcedureId(null)}
            className="text-xs font-montserrat text-gray-500 hover:text-navy"
          >
            ← Volver al listado
          </button>
        </div>

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
    <div className="space-y-6">
      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider">Total Procedimientos</p>
            <p className="text-2xl font-bold font-playfair text-navy mt-1">{totalProcedures}</p>
          </div>
          <div className="p-3 bg-navy/5 rounded-full text-navy">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider">Con Precio Vigente</p>
            <p className="text-2xl font-bold font-playfair text-emerald-600 mt-1">{pricedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider">Sin Precio Asignado</p>
            <p className={`text-2xl font-bold font-playfair mt-1 ${unpricedCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {unpricedCount}
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-montserrat uppercase tracking-wider">Moneda Tarifaria</p>
            <p className="text-2xl font-bold font-playfair text-gold mt-1">DOP / USD</p>
          </div>
          <div className="p-3 bg-gold/10 rounded-full text-gold">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar procedimiento por nombre o palabra clave..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm font-montserrat focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-montserrat text-navy focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as 'all' | 'priced' | 'unpriced')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-montserrat text-navy focus:outline-none focus:ring-2 focus:ring-gold bg-white"
            >
              <option value="all">Todos los precios</option>
              <option value="priced">Con precio fijado</option>
              <option value="unpriced">Sin precio asignado</option>
            </select>

            {(searchQuery || selectedCategory !== 'all' || priceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setPriceFilter('all')
                }}
                className="text-xs font-montserrat text-gray-500 hover:text-red-600 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center shadow-sm">
          <div className="flex flex-col items-center gap-2">
            <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs text-gray-500 font-montserrat">Cargando catálogo de precios...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
          <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-navy font-montserrat mt-3">No se encontraron procedimientos</p>
          <p className="text-xs text-gray-500 font-montserrat mt-1">Prueba cambiando los filtros de búsqueda o categoría.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Procedimiento</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Categoría</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Duración</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Precio Vigente</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Vigencia Desde</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider font-montserrat">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const hasPrice = item.price !== null
                  return (
                    <tr key={item.procedure_id} className="hover:bg-sand/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-navy">{item.procedure?.name || '—'}</div>
                        {item.procedure?.description && (
                          <div className="text-xs text-gray-500 max-w-sm truncate mt-0.5 font-montserrat">
                            {item.procedure.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-montserrat">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {item.procedure?.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-montserrat">
                        {item.procedure?.clinical_duration_minutes || item.procedure?.duration_minutes || 60} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPrice ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-navy font-montserrat">
                              {formatCurrency(item.price as number, item.currency)}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">({item.currency})</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 font-montserrat">
                            Sin precio asignado
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-montserrat">
                        {item.effective_from ? formatDate(item.effective_from) : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2 text-sm font-montserrat">
                        {hasPrice ? (
                          <>
                            <button
                              onClick={() => setEditingProcedureId(item.procedure_id)}
                              className="px-2.5 py-1 text-xs font-semibold text-gold bg-gold/10 rounded hover:bg-gold/20 transition-colors"
                            >
                              Actualizar
                            </button>
                            <button
                              onClick={() => setShowHistoryFor(item.procedure_id)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                            >
                              Historial
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditingProcedureId(item.procedure_id)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-gold rounded hover:bg-gold/90 transition-colors shadow-sm inline-flex items-center gap-1"
                          >
                            + Asignar Precio
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 font-montserrat flex items-center justify-between">
            <span>
              Mostrando {filteredItems.length} de {currentPrices.length} procedimientos
            </span>
            <span>
              Precios sincronizados con el catálogo clínico
            </span>
          </div>
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
