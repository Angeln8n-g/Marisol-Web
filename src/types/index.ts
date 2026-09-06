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

export interface DayHours {
  open: string // HH:mm format
  close: string // HH:mm format
  closed: boolean
}

export interface OperatingHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface SpecialHour {
  date: string // YYYY-MM-DD format
  reason: string
  open?: string // HH:mm format
  close?: string // HH:mm format
  closed: boolean
}

export interface Clinic {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  whatsapp: string
  operating_hours: OperatingHours
  special_hours: SpecialHour[]
  is_active: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface ClinicWithAvailability extends Clinic {
  available_slots_30d: number
  available_slots_7d: number
  has_availability: boolean
  is_open_now: boolean
}

export interface GeocodingResult {
  latitude: number
  longitude: number
  formatted_address: string
  confidence: 'high' | 'medium' | 'low'
}

export interface AvailabilityQuery {
  clinic_id: string
  start_date: string
  end_date: string
}

export interface AvailabilityResult {
  clinic_id: string
  available_slots: number
  next_available_date: string | null
}

export interface PatientMedicalHistory {
  hypertension?: boolean
  diabetes?: boolean
  heart_disease?: boolean
  asthma?: boolean
  hepatitis?: boolean
  allergies_penicillin?: boolean
  allergies_latex?: boolean
  allergies_anesthesia?: boolean
  allergies_other?: string
  current_medications?: string
  previous_surgeries?: string
  is_pregnant?: boolean
  is_breastfeeding?: boolean
  smoker?: boolean
  alcohol?: boolean
  bruxism?: boolean
  notes?: string
}

export interface Patient {
  id: string
  full_name: string
  email: string | null
  phone: string
  birth_date: string | null
  gender: Gender | null
  medical_alerts: string | null
  identification_type?: 'cedula' | 'passport' | 'rnc' | 'other'
  identification_number?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  emergency_contact_relationship?: string | null
  insurance_provider?: string | null
  insurance_card_number?: string | null
  occupation?: string | null
  civil_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'other' | null
  medical_history?: PatientMedicalHistory | null
  created_at: string
  updated_at: string
}

export interface Procedure {
  id: string
  name: string
  category: string
  description: string | null
  duration_minutes: number
  clinical_duration_minutes?: number
  setup_buffer_minutes?: number
  cleanup_buffer_minutes?: number
  estimated_sessions?: number
  min_days_between_sessions?: number
  requires_previous_cleaning?: boolean
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

export type InventoryItemType = 'tool' | 'consumable_clinical' | 'consumable_admin' | 'other'
export type InventoryItemStatus = 'active' | 'in_maintenance' | 'damaged' | 'retired'
export type MaintenanceType = 'preventive' | 'corrective' | 'calibration'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface InventoryCategory {
  id: string
  name: string
  item_type: InventoryItemType
  description?: string | null
}

export interface InventoryBatch {
  id: string
  item_id: string
  batch_number: string
  initial_quantity: number
  current_quantity: number
  expiration_date: string
  received_date: string
  status: 'active' | 'expired' | 'depleted'
  created_at: string
}

export interface InventoryItem {
  id: string
  clinic_id?: string | null
  category_id?: string | null
  name: string
  code?: string | null
  item_type: InventoryItemType
  unit: string
  current_stock: number
  minimum_stock: number
  cost_price?: number | null
  brand?: string | null
  serial_number?: string | null
  location_room?: string | null
  status: InventoryItemStatus
  is_active: boolean
  created_at: string
  updated_at: string
  clinic?: Clinic
  batches?: InventoryBatch[]
}

export interface EquipmentMaintenance {
  id: string
  item_id: string
  clinic_id?: string | null
  maintenance_type: MaintenanceType
  title: string
  description?: string | null
  technician_name: string
  technician_contact?: string | null
  status: MaintenanceStatus
  scheduled_date: string
  completed_date?: string | null
  cost: number
  next_maintenance_date?: string | null
  findings?: string | null
  actions_taken?: string | null
  created_at: string
  updated_at: string
  item?: InventoryItem
}

export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled'
export type BillStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type BillCategory = 'dental_supplies' | 'dental_lab' | 'utilities' | 'rent' | 'maintenance' | 'marketing' | 'salaries' | 'other'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'insurance' | 'check' | 'other'

export interface InvoiceItem {
  id: string
  invoice_id: string
  procedure_id?: string | null
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface PaymentReceived {
  id: string
  invoice_id: string
  patient_id: string
  clinic_id?: string | null
  amount: number
  payment_method: PaymentMethod
  reference_number?: string | null
  payment_date: string
  notes?: string | null
  created_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  clinic_id?: string | null
  appointment_id?: string | null
  issue_date: string
  due_date: string
  subtotal: number
  discount: number
  tax: number
  total: number
  balance_due: number
  status: InvoiceStatus
  notes?: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  clinic?: Clinic
  items?: InvoiceItem[]
  payments?: PaymentReceived[]
}

export interface PaymentMade {
  id: string
  bill_id: string
  clinic_id?: string | null
  amount: number
  payment_method: PaymentMethod
  reference_number?: string | null
  payment_date: string
  notes?: string | null
  created_at: string
}

export interface BillPayable {
  id: string
  bill_number?: string | null
  vendor_name: string
  category: BillCategory
  clinic_id?: string | null
  bill_date: string
  due_date: string
  subtotal: number
  tax: number
  total: number
  balance_due: number
  status: BillStatus
  notes?: string | null
  attachment_url?: string | null
  created_at: string
  updated_at: string
  clinic?: Clinic
  payments?: PaymentMade[]
}

export interface MarketingCampaign {
  id: string
  name: string
  description?: string | null
  objective: 'leads' | 'brand_awareness' | 'procedure_promotion' | 'retention'
  status: 'draft' | 'active' | 'paused' | 'completed'
  start_date: string
  end_date?: string | null
  budget: number
  actual_spend: number
  created_at: string
}

export interface MarketingOffer {
  id: string
  campaign_id?: string | null
  procedure_id?: string | null
  title: string
  promo_code?: string | null
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  start_date: string
  end_date?: string | null
  is_active: boolean
  redemptions_count: number
  created_at: string
  procedure?: Procedure
}

export interface SocialMediaPost {
  id: string
  campaign_id?: string | null
  title: string
  platforms: string[]
  content_copy: string
  media_url?: string | null
  scheduled_for?: string | null
  published_at?: string | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  notes?: string | null
  created_at: string
}

export interface MarketingVoucher {
  id: string
  voucher_code: string
  title: string
  offer_id?: string | null
  procedure_id?: string | null
  patient_id?: string | null
  beneficiary_name: string
  beneficiary_phone?: string | null
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  expiration_date: string
  status: 'active' | 'redeemed' | 'expired' | 'cancelled'
  redeemed_at?: string | null
  notes?: string | null
  terms?: string | null
  created_at: string
  updated_at: string
  patient?: {
    id: string
    full_name: string
    phone?: string | null
    email?: string | null
  } | null
  procedure?: {
    id: string
    name: string
    category: string
  } | null
}

export interface ConsentTemplate {
  id: string
  procedure_id?: string | null
  title: string
  description?: string | null
  template_content: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SignedConsent {
  id: string
  patient_id: string
  procedure_id?: string | null
  doctor_id?: string | null
  doctor_name: string
  appointment_id?: string | null
  template_id?: string | null
  content_rendered: string
  signature_data_url?: string | null
  status: 'signed' | 'revoked'
  signed_at: string
  created_at: string
  procedure?: Procedure
}

export interface AppointmentReminder {
  id: string
  appointment_id: string
  patient_id: string
  reminder_type: 'whatsapp' | 'email' | 'sms'
  status: 'pending' | 'sent' | 'failed' | 'confirmed'
  scheduled_time: string
  sent_at?: string | null
  message_content: string
  created_at: string
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
  identification_type?: 'cedula' | 'passport' | 'rnc' | 'other'
  identification_number?: string
  address?: string
  city?: string
  province?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  insurance_provider?: string
  insurance_card_number?: string
  occupation?: string
  civil_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'other'
  medical_history?: PatientMedicalHistory
}

export interface UpdatePatientDTO {
  full_name?: string
  phone?: string
  email?: string
  birth_date?: string
  gender?: Gender
  medical_alerts?: string
  identification_type?: 'cedula' | 'passport' | 'rnc' | 'other'
  identification_number?: string
  address?: string
  city?: string
  province?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relationship?: string
  insurance_provider?: string
  insurance_card_number?: string
  occupation?: string
  civil_status?: 'single' | 'married' | 'divorced' | 'widowed' | 'other'
  medical_history?: PatientMedicalHistory
}

export interface CreateProcedureDTO {
  name: string
  category: string
  description?: string
  duration_minutes: number
  clinical_duration_minutes?: number
  setup_buffer_minutes?: number
  cleanup_buffer_minutes?: number
  estimated_sessions?: number
  min_days_between_sessions?: number
  requires_previous_cleaning?: boolean
}

export interface UpdateProcedureDTO {
  name?: string
  category?: string
  description?: string
  duration_minutes?: number
  clinical_duration_minutes?: number
  setup_buffer_minutes?: number
  cleanup_buffer_minutes?: number
  estimated_sessions?: number
  min_days_between_sessions?: number
  requires_previous_cleaning?: boolean
  is_active?: boolean
}

export interface CreateClinicDTO {
  name: string
  address: string
  latitude: number
  longitude: number
  phone: string
  whatsapp: string
  operating_hours: OperatingHours
  special_hours?: SpecialHour[]
}

export interface UpdateClinicDTO {
  name?: string
  address?: string
  latitude?: number
  longitude?: number
  phone?: string
  whatsapp?: string
  operating_hours?: OperatingHours
  special_hours?: SpecialHour[]
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
        Insert: Omit<Clinic, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Clinic, 'id' | 'created_at' | 'updated_at'>>
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
