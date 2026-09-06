import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInvoices, useBillsPayable, useAccountingSummary, useAccountingMutations } from '../../hooks/useAccounting'
import { useBudgets } from '../../hooks/useBudgets'
import { useClinics } from '../../hooks/useClinics'
import { usePatients } from '../../hooks/usePatients'
import { useProcedures } from '../../hooks/useProcedures'
import type { Invoice, BillPayable, BillCategory } from '../../types'
import { openReceiptPrintWindow } from '../../lib/receiptPrintUtils'

export const AccountingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable' | 'utilities'>('receivable')
  const [selectedClinicId, setSelectedClinicId] = useState<string>('')

  const { clinics } = useClinics()
  const { procedures } = useProcedures()
  const { patients } = usePatients({ pageSize: 50 })
  const { data: approvedBudgets = [] } = useBudgets({
    clinicId: selectedClinicId || undefined,
    status: 'approved',
  })

  const { data: summary } = useAccountingSummary(selectedClinicId || undefined)

  const { data: invoices = [], isLoading: loadingInvoices } = useInvoices({
    clinicId: selectedClinicId || undefined,
  })

  const { data: bills = [], isLoading: loadingBills } = useBillsPayable({
    clinicId: selectedClinicId || undefined,
    category: activeTab === 'utilities' ? 'utilities' : 'all',
  })

  const {
    createInvoice,
    registerPaymentReceived,
    createBill,
    registerPaymentMade,
    isCreatingInvoice,
    isCreatingBill,
  } = useAccountingMutations()

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showPaymentRecModal, setShowPaymentRecModal] = useState(false)
  const [targetInvoice, setTargetInvoice] = useState<Invoice | null>(null)

  const [showBillModal, setShowBillModal] = useState(false)
  const [showPaymentMadeModal, setShowPaymentMadeModal] = useState(false)
  const [targetBill, setTargetBill] = useState<BillPayable | null>(null)

  // Invoice Form State
  const [invPatientId, setInvPatientId] = useState('')
  const [invBudgetId, setInvBudgetId] = useState('')
  const [invProcedureId, setInvProcedureId] = useState('')
  const [invDescription, setInvDescription] = useState('')
  const [invAmount, setInvAmount] = useState<number>(0)
  const [invDiscount, setInvDiscount] = useState<number>(0)

  // Payment Received Form State
  const [payRecAmount, setPayRecAmount] = useState<number>(0)
  const [payRecMethod, setPayRecMethod] = useState('cash')
  const [payRecRef, setPayRecRef] = useState('')

  // Bill Form State
  const [billVendor, setBillVendor] = useState('')
  const [billCat, setBillCat] = useState<BillCategory>('utilities')
  const [billAmount, setBillAmount] = useState<number>(0)
  const [billDueDate, setBillDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0])
  const [billNotes, setBillNotes] = useState('')

  // Payment Made Form State
  const [payMadeAmount, setPayMadeAmount] = useState<number>(0)
  const [payMadeMethod, setPayMadeMethod] = useState('transfer')
  const [payMadeRef, setPayMadeRef] = useState('')

  const handleProcedureSelect = (procId: string) => {
    setInvProcedureId(procId)
    const proc = procedures.find((p) => p.id === procId)
    if (proc) {
      setInvDescription(proc.name)
      setInvAmount(1500)
    }
  }

  const handleBudgetSelect = (bId: string) => {
    setInvBudgetId(bId)
    const b = approvedBudgets.find((item) => item.id === bId)
    if (b) {
      if (b.patient_id) setInvPatientId(b.patient_id)
      setInvDescription(`Tratamiento Odontológico s/ Presupuesto ${b.budget_number}`)
      setInvAmount(Number(b.total))
      setInvDiscount(Number(b.discount_amount) || 0)
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invPatientId || !invDescription || invAmount <= 0) return

    await createInvoice({
      patient_id: invPatientId,
      clinic_id: selectedClinicId || undefined,
      budget_id: invBudgetId || undefined,
      items: [
        {
          procedure_id: invProcedureId || undefined,
          description: invDescription,
          quantity: 1,
          unit_price: Number(invAmount),
        },
      ],
      discount: Number(invDiscount) || 0,
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    })

    setShowInvoiceModal(false)
    setInvPatientId('')
    setInvBudgetId('')
    setInvProcedureId('')
    setInvDescription('')
    setInvAmount(0)
    setInvDiscount(0)
  }

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetInvoice || payRecAmount <= 0) return

    await registerPaymentReceived({
      invoice_id: targetInvoice.id,
      patient_id: targetInvoice.patient_id,
      clinic_id: targetInvoice.clinic_id || undefined,
      amount: Number(payRecAmount),
      payment_method: payRecMethod,
      reference_number: payRecRef || undefined,
    })

    setShowPaymentRecModal(false)
    setTargetInvoice(null)
    setPayRecAmount(0)
    setPayRecRef('')
  }

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!billVendor.trim() || billAmount <= 0) return

    await createBill({
      vendor_name: billVendor,
      category: billCat,
      clinic_id: selectedClinicId || undefined,
      total: Number(billAmount),
      due_date: billDueDate,
      notes: billNotes || undefined,
    })

    setShowBillModal(false)
    setBillVendor('')
    setBillAmount(0)
    setBillNotes('')
  }

  const handleRegisterPaymentMade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetBill || payMadeAmount <= 0) return

    await registerPaymentMade({
      bill_id: targetBill.id,
      clinic_id: targetBill.clinic_id || undefined,
      amount: Number(payMadeAmount),
      payment_method: payMadeMethod,
      reference_number: payMadeRef || undefined,
    })

    setShowPaymentMadeModal(false)
    setTargetBill(null)
    setPayMadeAmount(0)
    setPayMadeRef('')
  }

  return (
    <div className="space-y-6 font-montserrat">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Módulo de Contabilidad y Tesorería</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Gestión de cuentas por cobrar a pacientes, cuentas por pagar y servicios recurrentes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClinicId}
            onChange={(e) => setSelectedClinicId(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-navy focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="">Todas las Sedes</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <Link
            to="/admin/budgets"
            className="px-3.5 py-2 border border-gold text-navy text-xs font-semibold rounded-lg hover:bg-gold/10 transition-colors flex items-center gap-1.5"
          >
            Presupuestos →
          </Link>

          {activeTab === 'receivable' ? (
            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="px-4 py-2 bg-gold text-white text-xs font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Factura
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setBillCat(activeTab === 'utilities' ? 'utilities' : 'dental_supplies')
                setShowBillModal(true)
              }}
              className="px-4 py-2 bg-navy text-gold text-xs font-bold rounded-lg hover:bg-navy/90 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {activeTab === 'utilities' ? 'Registrar Pago de Servicio' : 'Registrar Cuenta por Pagar'}
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Por Cobrar (Pacientes)</span>
          <p className="text-2xl font-bold text-amber-600 font-playfair">
            RD$ {summary?.totalReceivable.toLocaleString() || '0'}
          </p>
          <span className="text-[11px] text-gray-500">Saldo pendiente de cobro</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Por Pagar (Proveedores)</span>
          <p className="text-2xl font-bold text-red-600 font-playfair">
            RD$ {summary?.totalPayable.toLocaleString() || '0'}
          </p>
          <span className="text-[11px] text-gray-500">Facturas de compras y servicios</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Total Cobrado</span>
          <p className="text-2xl font-bold text-emerald-600 font-playfair">
            RD$ {summary?.totalCollected.toLocaleString() || '0'}
          </p>
          <span className="text-[11px] text-gray-500">Ingresos netos percibidos</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 font-bold">Flujo Operativo</span>
          <p className={`text-2xl font-bold font-playfair ${Number(summary?.netOperatingIncome) >= 0 ? 'text-navy' : 'text-red-600'}`}>
            RD$ {summary?.netOperatingIncome.toLocaleString() || '0'}
          </p>
          <span className="text-[11px] text-gray-500">Cobrado menos Pagado</span>
        </div>
      </div>

      {/* Pestañas de Módulo */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'receivable'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Cuentas por Cobrar (Pacientes)
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'payable'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Cuentas por Pagar (Proveedores / Labs)
        </button>
        <button
          onClick={() => setActiveTab('utilities')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'utilities'
              ? 'border-gold text-navy font-bold'
              : 'border-transparent text-gray-500 hover:text-navy'
          }`}
        >
          Pagos de Servicios y Gastos Fijos
        </button>
      </div>

      {/* Tab 1: Cuentas por Cobrar */}
      {activeTab === 'receivable' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loadingInvoices ? (
            <div className="p-12 text-center text-xs text-gray-400">Cargando facturas...</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No hay facturas emitidas a pacientes. Haz clic en "Nueva Factura" para crear la primera.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">No. Factura</th>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">Emisión</th>
                  <th className="px-6 py-3">Vencimiento</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Pendiente</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-navy block font-mono">{inv.invoice_number}</span>
                      {inv.budget?.budget_number && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sand/50 text-navy border border-gold/30">
                          Cot: {inv.budget.budget_number}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-navy">
                      {inv.patient?.full_name}
                      {inv.patient?.phone && <span className="block text-[11px] text-gray-400">Tel: {inv.patient.phone}</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{inv.issue_date}</td>
                    <td className="px-6 py-4 text-gray-600">{inv.due_date}</td>
                    <td className="px-6 py-4 font-semibold text-navy">RD$ {inv.total?.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-amber-700">RD$ {inv.balance_due?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        inv.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : inv.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.status === 'paid' ? 'Pagada' : inv.status === 'partial' ? 'Abono Parcial' : 'Emitida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            openReceiptPrintWindow({
                              invoiceNumber: inv.invoice_number,
                              issueDate: inv.issue_date,
                              patientName: inv.patient?.full_name || 'Paciente',
                              patientPhone: inv.patient?.phone || '',
                              clinicName: inv.clinic?.name || 'Clínica Odontológica Dra. Marisol',
                              clinicAddress: inv.clinic?.address || 'Santo Domingo, R.D.',
                              items: (inv.items || []).map((it) => ({
                                description: it.description,
                                quantity: it.quantity,
                                unit_price: it.unit_price,
                                total: it.total,
                              })),
                              subtotal: Number(inv.subtotal) || Number(inv.total),
                              discount: Number(inv.discount) || 0,
                              tax: Number(inv.tax) || 0,
                              total: Number(inv.total),
                              isPaid: inv.status === 'paid',
                              notes: inv.notes || undefined,
                            })
                          }}
                          className="px-2.5 py-1 text-gray-700 bg-sand/30 hover:bg-sand/60 border border-gold/30 rounded text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Imprimir Recibo Oficial de Pago"
                        >
                          <span>🧾 Recibo</span>
                        </button>

                        {inv.balance_due > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetInvoice(inv)
                              setPayRecAmount(inv.balance_due)
                              setShowPaymentRecModal(true)
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-[11px] font-bold hover:bg-emerald-700 shadow-sm"
                          >
                            + Registrar Abono
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">✓ Cancelada</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2 y 3: Cuentas por Pagar y Servicios */}
      {(activeTab === 'payable' || activeTab === 'utilities') && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loadingBills ? (
            <div className="p-12 text-center text-xs text-gray-400">Cargando cuentas por pagar...</div>
          ) : bills.length === 0 ? (
            <div className="p-12 text-center text-sm text-gray-500">
              No hay cuentas por pagar registradas en esta categoría.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3">Proveedor / Servicio</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Vencimiento</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Por Pagar</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-navy">
                      {bill.vendor_name}
                      {bill.bill_number && <span className="block text-[11px] text-gray-400">No. {bill.bill_number}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                        {bill.category === 'utilities'
                          ? 'Servicio / Luz / Agua'
                          : bill.category === 'dental_lab'
                          ? 'Laboratorio Dental'
                          : bill.category === 'rent'
                          ? 'Alquiler'
                          : 'Insumos / Proveedor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{bill.bill_date}</td>
                    <td className="px-6 py-4 text-gray-600">{bill.due_date}</td>
                    <td className="px-6 py-4 font-semibold text-navy">RD$ {bill.total?.toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-red-700">RD$ {bill.balance_due?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        bill.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {bill.status === 'paid' ? 'Pagado' : bill.status === 'partial' ? 'Abono Parcial' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.balance_due > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetBill(bill)
                            setPayMadeAmount(bill.balance_due)
                            setShowPaymentMadeModal(true)
                          }}
                          className="px-3 py-1 bg-navy text-gold rounded text-[11px] font-bold hover:bg-navy/90 shadow-sm"
                        >
                          Pagar Factura
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">✓ Liquidado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal: Nueva Factura a Paciente */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">Emitir Factura a Paciente</h3>
              <button type="button" onClick={() => setShowInvoiceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Paciente *</label>
                <select
                  required
                  value={invPatientId}
                  onChange={(e) => setInvPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.phone})</option>
                  ))}
                </select>
              </div>

              {approvedBudgets.length > 0 && (
                <div>
                  <label className="block font-medium text-navy mb-1">Cargar de Presupuesto Aprobado (Opcional)</label>
                  <select
                    value={invBudgetId}
                    onChange={(e) => handleBudgetSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gold/40 bg-sand/20 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="">-- Ninguno (Facturación Directa) --</option>
                    {approvedBudgets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.budget_number} · {b.patient?.full_name || b.patient_name} (RD$ {Number(b.total).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-navy mb-1">Procedimiento Asociado</label>
                <select
                  value={invProcedureId}
                  onChange={(e) => handleProcedureSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="">Seleccionar del catálogo</option>
                  {procedures.map((proc) => (
                    <option key={proc.id} value={proc.id}>{proc.name} ({proc.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Concepto / Descripción *</label>
                <input
                  type="text"
                  required
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  placeholder="ej. Tratamiento de Blanqueamiento Dental y Limpieza"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Monto Total (RD$) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={invAmount}
                    onChange={(e) => setInvAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Descuento Especial (RD$)</label>
                  <input
                    type="number"
                    min={0}
                    value={invDiscount}
                    onChange={(e) => setInvDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingInvoice}
                  className="px-5 py-2 bg-gold text-white font-bold rounded-lg hover:bg-gold/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingInvoice ? 'Emitiendo...' : 'Emitir Factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Abono de Paciente */}
      {showPaymentRecModal && targetInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">Registrar Abono / Pago</h3>
                <p className="text-xs text-gray-500">Factura {targetInvoice.invoice_number} · {targetInvoice.patient?.full_name}</p>
              </div>
              <button type="button" onClick={() => setShowPaymentRecModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-4 text-xs">
              <div className="p-3 bg-sand/30 rounded-lg border border-gold/20 flex justify-between items-center">
                <span className="text-gray-600">Saldo Pendiente:</span>
                <span className="text-sm font-bold text-navy">RD$ {targetInvoice.balance_due.toLocaleString()}</span>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Monto a Cobrar (RD$) *</label>
                <input
                  type="number"
                  min={1}
                  max={targetInvoice.balance_due}
                  required
                  value={payRecAmount}
                  onChange={(e) => setPayRecAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Método de Pago *</label>
                <select
                  value={payRecMethod}
                  onChange={(e) => setPayRecMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta de Crédito / Débito</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="insurance">Cobertura Seguro Médico / ARS</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">No. Comprobante / Referencia</label>
                <input
                  type="text"
                  value={payRecRef}
                  onChange={(e) => setPayRecRef(e.target.value)}
                  placeholder="ej. Voucher 482910"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentRecModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Factura por Pagar / Servicio */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-playfair font-bold text-navy">
                {billCat === 'utilities' ? 'Registrar Gasto de Servicio' : 'Registrar Cuenta por Pagar'}
              </h3>
              <button type="button" onClick={() => setShowBillModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-navy mb-1">Proveedor / Entidad de Servicio *</label>
                <input
                  type="text"
                  required
                  value={billVendor}
                  onChange={(e) => setBillVendor(e.target.value)}
                  placeholder={billCat === 'utilities' ? 'ej. EdeEste / CAASD / Claro Dominicana' : 'ej. Laboratorio Dental García & Asoc.'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-navy mb-1">Categoría del Gasto *</label>
                  <select
                    value={billCat}
                    onChange={(e) => setBillCat(e.target.value as BillCategory)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                  >
                    <option value="utilities">Servicios Básicos (Luz, Agua, Internet)</option>
                    <option value="dental_lab">Laboratorio Dental Externo</option>
                    <option value="dental_supplies">Proveedor de Insumos Dentales</option>
                    <option value="rent">Alquiler de Local</option>
                    <option value="maintenance">Mantenimiento de Instalaciones</option>
                    <option value="marketing">Publicidad y Marketing</option>
                    <option value="salaries">Nómina / Honorarios</option>
                    <option value="other">Otro Gasto Operativo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-navy mb-1">Monto Total (RD$) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={billAmount}
                    onChange={(e) => setBillAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Fecha Límite de Pago *</label>
                <input
                  type="date"
                  required
                  value={billDueDate}
                  onChange={(e) => setBillDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Notas / Referencia</label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="ej. Factura mes de Septiembre 2026"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingBill}
                  className="px-5 py-2 bg-navy text-gold font-bold rounded-lg hover:bg-navy/90 shadow-sm disabled:opacity-50"
                >
                  {isCreatingBill ? 'Guardando...' : 'Registrar Cuenta por Pagar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Pago Emitido */}
      {showPaymentMadeModal && targetBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-playfair font-bold text-navy">Emitir Pago</h3>
                <p className="text-xs text-gray-500">Proveedor: {targetBill.vendor_name}</p>
              </div>
              <button type="button" onClick={() => setShowPaymentMadeModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleRegisterPaymentMade} className="space-y-4 text-xs">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                <span className="text-gray-600">Monto Pendiente:</span>
                <span className="text-sm font-bold text-red-700">RD$ {targetBill.balance_due.toLocaleString()}</span>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Monto Pagado (RD$) *</label>
                <input
                  type="number"
                  min={1}
                  max={targetBill.balance_due}
                  required
                  value={payMadeAmount}
                  onChange={(e) => setPayMadeAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">Método de Pago *</label>
                <select
                  value={payMadeMethod}
                  onChange={(e) => setPayMadeMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                >
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="card">Tarjeta Débito / Crédito</option>
                  <option value="cash">Efectivo</option>
                  <option value="check">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-navy mb-1">No. Confirmación / Transacción</label>
                <input
                  type="text"
                  value={payMadeRef}
                  onChange={(e) => setPayMadeRef(e.target.value)}
                  placeholder="ej. TR-998811"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPaymentMadeModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy text-gold font-bold rounded-lg hover:bg-navy/90 shadow-sm"
                >
                  Confirmar Desembolso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
