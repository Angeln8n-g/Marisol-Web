// src/types/index.ts

// ─── Enumeraciones ───────────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'

export type ProcedureTrackingStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type UserRole = 'admin' | 'doctor' | 'receptionist'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

export type TimeSlot = 'morning' | 'afternoon'

export type Currency = 'DOP' | 'USD' | 'EUR'

// ─── Entidades de Base de Datos ──────────────────────────────────────────────

export interface Clinic {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  whatsapp: string
  is_active: boolean
  created_at: string
}

export interface Patient {
  id: string
  full_name: string
  email: string | null
  phone: string
  birth_date: string | null
  gender: Gender | null
  medical_alerts: string | null
  created_at: string
  updated_at: string
}

export interface Procedure {
  id: string
  name: string
  category: string
  description: string | null
  duration_minutes: number
  is_active: boolean
  created_at: string
  current_price?: ProcedurePrice
}

export interface ProcedurePrice {
  id: string
  procedure_id: string
  price: number
  currency: string
  effective_from: string
  effective_to: string | null
  changed_by: string
  change_reason: string | null
}

export interface Appointment {
  id: string
  patient_id: string
  clinic_id: string
  procedure_id: string
  assigned_doctor: string | null
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Relaciones expandidas
  patient?: Patient
  clinic?: Clinic
  procedure?: Procedure
}

export interface MedicalRecord {
  id: string
  patient_id: string
  appointment_id: string | null
  created_by: string
  chief_complaint: string
  diagnosis: string | null
  treatment_plan: string | null
  notes: string | null
  record_date: string
  created_at: string
  documents?: RecordDocument[]
}

export interface RecordDocument {
  id: string
  medical_record_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size_bytes: number
  uploaded_at: string
}

export interface ProcedureTracking {
  id: string
  patient_id: string
  procedure_id: string
  appointment_id: string | null
  status: ProcedureTrackingStatus
  start_date: string
  expected_end_date: string | null
  actual_end_date: string | null
  progress_notes: string | null
  next_followup_date: string | null
  alert_sent: boolean
  patient?: Patient
  procedure?: Procedure
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  clinic_id: string | null
  is_active: boolean
}

// ─── DTOs (Data Transfer Objects) ────────────────────────────────────────────

export interface CreateAppointmentDTO {
  patient_id: string
  clinic_id: string
  procedure_id: string
  scheduled_at: string
  duration_minutes?: number
  notes?: string
}

export interface PublicAppointmentRequestDTO {
  full_name: string
  phone: string
  service: string
  preferred_date: string
  preferred_time_slot: TimeSlot
  clinic_id?: string
}

export interface UpdateAppointmentDTO {
  status?: AppointmentStatus
  scheduled_at?: string
  notes?: string
  assigned_doctor?: string
}

export interface CreateMedicalRecordDTO {
  patient_id: string
  appointment_id?: string
  chief_complaint: string
  diagnosis?: string
  treatment_plan?: string
  notes?: string
  record_date: string
}

export interface UpdatePriceDTO {
  procedure_id: string
  price: number
  currency: string
  effective_from: string
  change_reason: string
}

export interface CreatePatientDTO {
  full_name: string
  phone: string
  email?: string
  birth_date?: string
  gender?: Gender
  medical_alerts?: string
}

export interface UpdatePatientDTO {
  full_name?: string
  phone?: string
  email?: string
  birth_date?: string
  gender?: Gender
  medical_alerts?: string
}

export interface CreateProcedureDTO {
  name: string
  category: string
  description?: string
  duration_minutes: number
}

export interface UpdateProcedureDTO {
  name?: string
  category?: string
  description?: string
  duration_minutes?: number
  is_active?: boolean
}

export interface CreateClinicDTO {
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  whatsapp: string
}

export interface UpdateClinicDTO {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  whatsapp?: string
  is_active?: boolean
}

export interface CreateProcedureTrackingDTO {
  patient_id: string
  procedure_id: string
  appointment_id?: string
  start_date: string
  expected_end_date?: string
  progress_notes?: string
  next_followup_date?: string
}

export interface UpdateProcedureTrackingDTO {
  status?: ProcedureTrackingStatus
  expected_end_date?: string
  actual_end_date?: string
  progress_notes?: string
  next_followup_date?: string
  alert_sent?: boolean
}

// ─── Tipos de UI ─────────────────────────────────────────────────────────────

export interface ClinicWorkload {
  clinic: Clinic
  total_appointments: number
  pending_appointments: number
  confirmed_appointments: number
  capacity_percentage: number
}

export interface DashboardStats {
  total_appointments_today: number
  pending_confirmations: number
  active_procedures: number
  upcoming_followups: number
  appointments_by_clinic: ClinicWorkload[]
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: AppointmentStatus
  patient_name: string
  clinic_name: string
  color: string
}

// ─── Tipos de Base de Datos (Supabase) ───────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      clinics: {
        Row: Clinic
        Insert: Omit<Clinic, 'id' | 'created_at'>
        Update: Partial<Omit<Clinic, 'id' | 'created_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      procedures: {
        Row: Procedure
        Insert: Omit<Procedure, 'id' | 'created_at' | 'current_price'>
        Update: Partial<Omit<Procedure, 'id' | 'created_at' | 'current_price'>>
      }
      procedure_prices: {
        Row: ProcedurePrice
        Insert: Omit<ProcedurePrice, 'id'>
        Update: Partial<Omit<ProcedurePrice, 'id'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient' | 'clinic' | 'procedure'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'patient' | 'clinic' | 'procedure'>>
      }
      medical_records: {
        Row: MedicalRecord
        Insert: Omit<MedicalRecord, 'id' | 'created_at' | 'documents'>
        Update: Partial<Omit<MedicalRecord, 'id' | 'created_at' | 'documents'>>
      }
      record_documents: {
        Row: RecordDocument
        Insert: Omit<RecordDocument, 'id' | 'uploaded_at'>
        Update: Partial<Omit<RecordDocument, 'id' | 'uploaded_at'>>
      }
      procedure_tracking: {
        Row: ProcedureTracking
        Insert: Omit<ProcedureTracking, 'id' | 'patient' | 'procedure'>
        Update: Partial<Omit<ProcedureTracking, 'id' | 'patient' | 'procedure'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id'>
        Update: Partial<Omit<User, 'id'>>
      }
    }
  }
}
