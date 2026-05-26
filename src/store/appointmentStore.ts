// src/store/appointmentStore.ts

import { create } from 'zustand'
import type { AppointmentStatus } from '../types'

interface AppointmentFilters {
  clinicId: string | null
  status: AppointmentStatus | null
  dateFrom: string | null
  dateTo: string | null
  searchQuery: string
}

interface AppointmentState {
  // Filtros activos
  filters: AppointmentFilters
  
  // Vista del calendario
  calendarView: 'month' | 'week' | 'day' | 'agenda'
  calendarDate: Date
  
  // Cita seleccionada
  selectedAppointmentId: string | null
  
  // Acciones de filtros
  setClinicFilter: (clinicId: string | null) => void
  setStatusFilter: (status: AppointmentStatus | null) => void
  setDateRangeFilter: (dateFrom: string | null, dateTo: string | null) => void
  setSearchQuery: (query: string) => void
  clearFilters: () => void
  
  // Acciones de calendario
  setCalendarView: (view: 'month' | 'week' | 'day' | 'agenda') => void
  setCalendarDate: (date: Date) => void
  
  // Acciones de selección
  setSelectedAppointment: (id: string | null) => void
}

const initialFilters: AppointmentFilters = {
  clinicId: null,
  status: null,
  dateFrom: null,
  dateTo: null,
  searchQuery: '',
}

/**
 * Store de estado de citas usando Zustand.
 * 
 * Gestiona los filtros activos del módulo de citas, la vista del calendario
 * y la cita seleccionada actualmente.
 * 
 * @example
 * const { filters, setClinicFilter, setStatusFilter } = useAppointmentStore()
 * 
 * // Filtrar por clínica
 * setClinicFilter('clinic-uuid')
 * 
 * // Filtrar por estado
 * setStatusFilter('pending')
 */
export const useAppointmentStore = create<AppointmentState>((set) => ({
  // Estado inicial
  filters: initialFilters,
  calendarView: 'month',
  calendarDate: new Date(),
  selectedAppointmentId: null,
  
  // Acciones de filtros
  setClinicFilter: (clinicId) =>
    set((state) => ({
      filters: { ...state.filters, clinicId },
    })),
  
  setStatusFilter: (status) =>
    set((state) => ({
      filters: { ...state.filters, status },
    })),
  
  setDateRangeFilter: (dateFrom, dateTo) =>
    set((state) => ({
      filters: { ...state.filters, dateFrom, dateTo },
    })),
  
  setSearchQuery: (searchQuery) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery },
    })),
  
  clearFilters: () =>
    set({
      filters: initialFilters,
    }),
  
  // Acciones de calendario
  setCalendarView: (calendarView) => set({ calendarView }),
  
  setCalendarDate: (calendarDate) => set({ calendarDate }),
  
  // Acciones de selección
  setSelectedAppointment: (selectedAppointmentId) =>
    set({ selectedAppointmentId }),
}))
