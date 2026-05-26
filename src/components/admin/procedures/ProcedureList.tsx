import React, { useState } from 'react'
import { useProcedures } from '../../../hooks/useProcedures'
import { ProcedureForm, type ProcedureFormValues } from './ProcedureForm'
import type { Procedure } from '../../../types'

export const ProcedureList: React.FC = () => {
  const [page, setPage] = useState(0)
  const pageSize = 25
  const { procedures, isLoading, createProcedure, isCreating, updateProcedure, isUpdating, toggleActive, refetch, hasNextPage, hasPreviousPage } = useProcedures(page, pageSize)
  const [showForm, setShowForm] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreate = async (data: ProcedureFormValues) => {
    setFormError(null)
    try {
      await createProcedure(data)
      setShowForm(false)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al crear')
    }
  }

  const handleUpdate = async (data: ProcedureFormValues) => {
    if (!editingProcedure) return
    setFormError(null)
    try {
      await updateProcedure({ id: editingProcedure.id, ...data })
      setEditingProcedure(null)
      refetch()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Error al actualizar')
    }
  }

  const formErrorDisplay = formError && (
    <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 font-montserrat" role="alert">
      {formError}
    </div>
  )

  if (showForm) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-playfair text-navy mb-4">Nuevo Procedimiento</h3>
        {formErrorDisplay}
        <ProcedureForm onSubmit={handleCreate} isSubmitting={isCreating} onCancel={() => setShowForm(false)} />
      </div>
    )
  }

  if (editingProcedure) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-playfair text-navy mb-4">Editar Procedimiento</h3>
        {formErrorDisplay}
        <ProcedureForm
          onSubmit={handleUpdate}
          isSubmitting={isUpdating}
          defaultValues={{
            name: editingProcedure.name,
            category: editingProcedure.category,
            description: editingProcedure.description || '',
            duration_minutes: editingProcedure.duration_minutes,
          }}
          onCancel={() => setEditingProcedure(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Procedimiento
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 flex justify-center">
          <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : procedures.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-sm text-gray-500 font-montserrat">No hay procedimientos registrados</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Duración</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {procedures.map((proc) => (
                  <tr key={proc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy">{proc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{proc.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{proc.duration_minutes} min</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(proc.id, proc.is_active)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          proc.is_active
                            ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {proc.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setEditingProcedure(proc)}
                        className="text-gold hover:text-gold/80 text-sm font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 font-montserrat">
              {procedures.length} procedimiento{procedures.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={!hasPreviousPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-montserrat"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
