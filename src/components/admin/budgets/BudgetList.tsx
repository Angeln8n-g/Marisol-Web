import React, { useState } from 'react'
import { useBudgets, useBudgetMutations } from '../../../hooks/useBudgets'
import { useClinics } from '../../../hooks/useClinics'
import { BudgetModal } from './BudgetModal'
import { BudgetInvoiceModal } from './BudgetInvoiceModal'
import { BudgetSignModal } from './BudgetSignModal'
import { openBudgetPrintWindow } from '../../../lib/budgetPrintUtils'
import { formatDate } from '../../../lib/utils'
import type { Budget, BudgetStatus } from '../../../types'

export const BudgetList: React.FC = () => {
  const [selectedClinicId, setSelectedClinicId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<BudgetStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)
  const [budgetToInvoice, setBudgetToInvoice] = useState<Budget | null>(null)
  const [budgetToSign, setBudgetToSign] = useState<Budget | null>(null)

  const { clinics } = useClinics()
  const { data: budgets = [], isLoading, refetch } = useBudgets({
    clinicId: selectedClinicId || undefined,
    status: selectedStatus,
    searchQuery: searchQuery || undefined,
  })

  const { deleteBudget } = useBudgetMutations()

  // Summary Metrics
  const totalBudgeted = budgets.reduce((sum, b) => sum + (Number(b.total) || 0), 0)
  const approvedBudgets = budgets.filter((b) => b.status === 'approved' || b.status === 'partially_invoiced' || b.status === 'invoiced')
  const totalApproved = approvedBudgets.reduce((sum, b) => sum + (Number(b.total) || 0), 0)
  const invoicedBudgets = budgets.filter((b) => b.status === 'invoiced')
  const approvalRate = budgets.length > 0 ? Math.round((approvedBudgets.length / budgets.length) * 100) : 0

  const statusBadge = (status: BudgetStatus) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">Borrador</span>
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Enviado</span>
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Aprobado</span>
      case 'partially_invoiced':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Facturado Parcial</span>
      case 'invoiced':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Facturado Total</span>
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Rechazado</span>
      case 'expired':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-500">Vencido</span>
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">{status}</span>
    }
  }

  const modalityBadge = (modality: string) => {
    switch (modality) {
      case 'single_payment':
        return <span className="text-[11px] text-emerald-700 font-medium">Contado</span>
      case 'installments':
        return <span className="text-[11px] text-blue-700 font-medium">Inicial + Cuotas</span>
      case 'per_session':
        return <span className="text-[11px] text-purple-700 font-medium">Por Sesión</span>
      case 'custom_financing':
        return <span className="text-[11px] text-amber-700 font-medium">Fases a Medida</span>
      default:
        return <span className="text-[11px] text-gray-600">{modality}</span>
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este presupuesto? Esta acción no se puede deshacer.')) {
      await deleteBudget(id)
      refetch()
    }
  }

  return (
    <div className="space-y-6 font-montserrat print:m-0 print:p-0">
      <div className="print:hidden space-y-6">
        {/* Header with Title and Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-playfair text-navy font-bold">Gestión de Presupuestos Odontológicos</h1>
            <p className="text-sm text-gray-600 mt-0.5">
            Elaboración formal de cotizaciones, modalidades de financiamiento por cuotas y facturación automática
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setBudgetToEdit(null)
            setIsCreateModalOpen(true)
          }}
          className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          + Nuevo Presupuesto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Total Cotizado</span>
          <p className="text-2xl font-bold text-navy font-playfair">
            RD$ {totalBudgeted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-500">{budgets.length} presupuestos registrados</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Monto Aprobado</span>
          <p className="text-2xl font-bold text-emerald-600 font-playfair">
            RD$ {totalApproved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-gray-500">{approvedBudgets.length} presupuestos aceptados</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Tasa de Conversión</span>
          <p className="text-2xl font-bold text-gold font-playfair">
            {approvalRate}%
          </p>
          <span className="text-[11px] text-gray-500">De cotizaciones a tratamientos activos</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Completamente Facturados</span>
          <p className="text-2xl font-bold text-purple-600 font-playfair">
            {invoicedBudgets.length}
          </p>
          <span className="text-[11px] text-gray-500">Tratamientos liquidados en caja</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          {(['all', 'draft', 'sent', 'approved', 'partially_invoiced', 'invoiced'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedStatus === st
                  ? 'bg-navy text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'all'
                ? 'Todos'
                : st === 'draft'
                ? 'Borradores'
                : st === 'sent'
                ? 'Enviados'
                : st === 'approved'
                ? 'Aprobados'
                : st === 'partially_invoiced'
                ? 'En Cuotas'
                : 'Facturados'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-navy focus:ring-1 focus:ring-gold"
          >
            <option value="">Todas las Sedes</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Buscar por cotización o paciente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg w-full md:w-56 focus:ring-1 focus:ring-gold"
          />
        </div>
      </div>

      {/* Table of Budgets */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-gray-400">Cargando presupuestos...</div>
        ) : budgets.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            No se encontraron presupuestos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">No. Cotización</th>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">Sede</th>
                  <th className="px-6 py-3">Emisión</th>
                  <th className="px-6 py-3">Modalidad de Pago</th>
                  <th className="px-6 py-3 text-right">Total (RD$)</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy font-mono">
                      {b.budget_number}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-navy block">
                        {b.patient?.full_name || b.patient_name || 'Paciente'}
                      </span>
                      {(b.patient?.phone || b.patient_phone) && (
                        <span className="text-[11px] text-gray-400 block">
                          Tel: {b.patient?.phone || b.patient_phone}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {b.clinic?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDate(b.issue_date)}
                    </td>
                    <td className="px-6 py-4">
                      {modalityBadge(b.payment_modality)}
                      {b.installments && b.installments.length > 0 && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {b.installments.filter((i) => i.status === 'paid').length} de {b.installments.length} cuotas pagadas
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-navy text-right font-mono">
                      RD$ {Number(b.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {statusBadge(b.status)}
                        {b.patient_signature_url ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span>✓</span> Firmado
                          </span>
                        ) : (
                          <span className="block text-[10px] text-gray-400">Sin firma</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botón Firmar Digitalmente */}
                        {!b.patient_signature_url && b.status !== 'rejected' && b.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setBudgetToSign(b)}
                            className="px-2.5 py-1 bg-gold hover:bg-gold/90 text-navy rounded text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1"
                            title="Firmar en pantalla táctil con el paciente"
                          >
                            <span>✍️</span> Firmar
                          </button>
                        )}

                        {/* Botón Facturar (Solo disponible si está aprobado o facturado parcial) */}
                        {(b.status === 'approved' || b.status === 'partially_invoiced') && (
                          <button
                            type="button"
                            onClick={() => setBudgetToInvoice(b)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition-colors"
                            title="Emitir factura de este presupuesto o cuota"
                          >
                            + Facturar
                          </button>
                        )}

                        {/* Botón Ver / Imprimir */}
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetToEdit(b)
                            setIsCreateModalOpen(true)
                          }}
                          className="px-2.5 py-1 bg-navy hover:bg-navy/90 text-gold rounded text-[11px] font-bold shadow-xs transition-colors"
                          title="Ver detalle o modificar"
                        >
                          Ver / Editar
                        </button>

                        {/* Botón Rápido PDF / Imprimir en ventana limpia */}
                        <button
                          type="button"
                          onClick={() => openBudgetPrintWindow({ budget: b })}
                          className="p-1 text-gray-500 hover:text-navy transition-colors"
                          title="Abrir e imprimir presupuesto formal / Guardar en PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar presupuesto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>

      {/* Modal: Crear / Editar Presupuesto */}
      <BudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        budgetToEdit={budgetToEdit}
        onSaved={() => refetch()}
      />

      {/* Modal: Facturar Presupuesto */}
      <BudgetInvoiceModal
        isOpen={!!budgetToInvoice}
        onClose={() => setBudgetToInvoice(null)}
        budget={budgetToInvoice}
        onSuccess={() => refetch()}
      />

      {/* Modal: Firma Digital Táctil */}
      <BudgetSignModal
        isOpen={!!budgetToSign}
        onClose={() => setBudgetToSign(null)}
        budget={budgetToSign}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
