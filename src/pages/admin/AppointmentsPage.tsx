import React, { useState } from 'react'
import {
  AppointmentCalendar,
  AppointmentFilters,
  AppointmentCard,
  AppointmentModal,
  AppointmentListView,
  RescheduleModal,
  QuickInvoiceModal,
  WhatsAppTemplateModal,
} from '../../components/admin/appointments'
import { useAppointments } from '../../hooks/useAppointments'
import { useAppointmentStore } from '../../store/appointmentStore'
import type { Appointment, AppointmentStatus } from '../../types'

export const AppointmentsPage: React.FC = () => {
  const { filters, setCalendarDate, setCalendarView, calendarDate, calendarView } =
    useAppointmentStore()

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null)
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  // Operational modals state
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<Appointment | null>(null)
  const [appointmentToInvoice, setAppointmentToInvoice] = useState<Appointment | null>(null)
  const [appointmentForWhatsApp, setAppointmentForWhatsApp] = useState<Appointment | null>(null)

  const {
    appointments,
    count,
    isLoading,
    updateAppointment,
    deleteAppointment,
    refetch,
  } = useAppointments({
    filters: {
      clinicId: filters.clinicId,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      searchQuery: filters.searchQuery,
    },
    pageSize: 100,
  })

  const handleOpenCreateModal = () => {
    setAppointmentToEdit(null)
    setModalInitialDate(null)
    setIsModalOpen(true)
  }

  const handleSlotSelected = (date: Date) => {
    setAppointmentToEdit(null)
    setModalInitialDate(date)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (apt: Appointment) => {
    setAppointmentToEdit(apt)
    setModalInitialDate(null)
    setIsModalOpen(true)
  }

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    await updateAppointment({ id, status })
    if (selectedAppointment?.id === id) {
      setSelectedAppointment((prev) => prev ? { ...prev, status } : null)
    }
  }

  const handleCancel = async (id: string) => {
    await updateAppointment({ id, status: 'cancelled' })
    if (selectedAppointment?.id === id) {
      setSelectedAppointment((prev) => prev ? { ...prev, status: 'cancelled' } : null)
    }
  }

  const handleDelete = async (id: string) => {
    await deleteAppointment(id)
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-playfair text-navy font-bold">Gestión de Citas</h1>
          <p className="text-sm text-gray-600 font-montserrat mt-1">
            Agenda, reprograma y consulta las citas de pacientes en todas las sedes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-md border border-gray-200 bg-white p-0.5 shadow-sm">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded font-montserrat flex items-center gap-1.5 transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-gray-600 hover:text-navy hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded font-montserrat flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-gray-600 hover:text-navy hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Lista ({count})
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-gold text-white text-sm font-semibold rounded-md hover:bg-gold/90 transition-colors flex items-center gap-2 shadow-sm font-montserrat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            + Nueva Cita
          </button>
        </div>
      </div>

      {/* Filters */}
      <AppointmentFilters />

      {/* Content depending on view mode */}
      {viewMode === 'calendar' ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 flex items-center justify-center shadow-sm">
                <div className="flex flex-col items-center gap-2">
                  <svg className="animate-spin h-8 w-8 text-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs text-gray-500 font-montserrat">Cargando calendario de citas...</span>
                </div>
              </div>
            ) : (
              <AppointmentCalendar
                appointments={appointments}
                onSelectEvent={(apt) => setSelectedAppointment(apt)}
                onSelectSlot={(date) => handleSlotSelected(date)}
                date={calendarDate}
                onNavigate={(d) => setCalendarDate(d)}
                onView={(v) => setCalendarView(v as 'month' | 'week' | 'day' | 'agenda')}
                defaultView={calendarView}
              />
            )}
          </div>

          <div>
            {selectedAppointment ? (
              <AppointmentCard
                appointment={selectedAppointment}
                onConfirm={(id) => handleStatusChange(id, 'confirmed')}
                onStatusChange={handleStatusChange}
                onCancel={handleCancel}
                onEdit={handleEditAppointment}
                onDelete={handleDelete}
                onClose={() => setSelectedAppointment(null)}
                onReschedule={(id) => {
                  const apt = appointments.find((a) => a.id === id) || selectedAppointment
                  if (apt) setAppointmentToReschedule(apt)
                }}
                onInvoice={(apt) => setAppointmentToInvoice(apt)}
                onWhatsAppModal={(apt) => setAppointmentForWhatsApp(apt)}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center shadow-sm">
                <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-semibold text-navy font-montserrat mt-3">
                  Detalle de Cita
                </p>
                <p className="text-xs text-gray-500 font-montserrat mt-1">
                  Selecciona una cita en el calendario para ver detalles, cambiar su estado o enviar recordatorios.
                </p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleOpenCreateModal}
                    className="text-xs text-gold font-semibold hover:underline font-montserrat"
                  >
                    + Agendar cita directamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <AppointmentListView
            appointments={appointments}
            onSelectAppointment={(apt) => {
              setSelectedAppointment(apt)
              handleEditAppointment(apt)
            }}
            onEditAppointment={handleEditAppointment}
            onStatusChange={handleStatusChange}
            onCancelAppointment={handleCancel}
            onReschedule={(apt) => setAppointmentToReschedule(apt)}
            onInvoice={(apt) => setAppointmentToInvoice(apt)}
            onWhatsAppModal={(apt) => setAppointmentForWhatsApp(apt)}
          />
        </div>
      )}

      {/* Appointment Create / Edit Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={modalInitialDate}
        appointmentToEdit={appointmentToEdit}
        onSaved={() => {
          refetch()
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={!!appointmentToReschedule}
        onClose={() => setAppointmentToReschedule(null)}
        appointment={appointmentToReschedule}
        onRescheduled={() => {
          refetch()
          setAppointmentToReschedule(null)
          if (selectedAppointment && appointmentToReschedule?.id === selectedAppointment.id) {
            setSelectedAppointment(null)
          }
        }}
      />

      {/* Quick Invoice Modal */}
      <QuickInvoiceModal
        isOpen={!!appointmentToInvoice}
        onClose={() => setAppointmentToInvoice(null)}
        appointment={appointmentToInvoice}
        onInvoiceCreated={() => {
          refetch()
        }}
      />

      {/* WhatsApp Template Messaging Center */}
      <WhatsAppTemplateModal
        isOpen={!!appointmentForWhatsApp}
        onClose={() => setAppointmentForWhatsApp(null)}
        appointment={appointmentForWhatsApp}
      />
    </div>
  )
}

