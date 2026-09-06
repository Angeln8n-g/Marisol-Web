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
  chair_hourly_cost?: number
  doctor_commission_percent?: number
  lab_cost?: number
  is_active: boolean
  created_at: string
  current_price?: ProcedurePrice
  supplies?: ProcedureSupply[]
}

export interface ProcedureProfitability {
  procedure: Procedure
  price: number
  suppliesCost: number
  labCost: number
  doctorCommissionAmount: number
  doctorCommissionPercent: number
  chairHourlyCost: number
  chairOverheadAmount: number
  grossMargin: number
  grossMarginPercent: number
  netMargin: number
  netMarginPercent: number
  profitPerHour: number
  marginStatus: 'high_margin' | 'moderate_margin' | 'low_margin' | 'loss'
  suppliesCount: number
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

export interface ProcedureSupply {
  id: string
  procedure_id: string
  item_id: string
  quantity: number
  dispense_unit?: string
  is_optional: boolean
  notes?: string | null
  item?: InventoryItem
  created_at: string
  updated_at: string
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
  last_reminder_sent_at?: string | null
  reminder_count?: number
  invoice_id?: string | null
  billing_status?: 'unbilled' | 'billed' | 'exempt'
  // Relaciones expandidas
  patient?: Patient
  clinic?: Clinic
  procedure?: Procedure
  invoice?: Invoice
}

export type WhatsAppTemplateCategory =
  | 'appointment_reminder'
  | 'post_op'
  | 'post_op_checkin'
  | 'treatment_quote'
  | 'custom'

export interface WhatsAppMessageTemplate {
  id: string
  title: string
  category: WhatsAppTemplateCategory
  body: string
  procedure_category?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
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

export type ProcedureBillingStatus = 'unbilled' | 'invoiced' | 'paid' | 'included_in_budget'

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
  budget_id?: string | null
  budget_item_id?: string | null
  invoice_id?: string | null
  billing_status?: ProcedureBillingStatus
  patient?: Patient
  procedure?: Procedure
  budget?: Budget
  invoice?: Invoice
}

export type InventoryItemType = 'tool' | 'consumable_clinical' | 'consumable_admin' | 'other'
export type InventoryItemStatus = 'active' | 'in_maintenance' | 'damaged' | 'retired'
export type MaintenanceType = 'preventive' | 'corrective' | 'calibration'
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type InventoryMovementType = 'entry' | 'exit_clinical' | 'exit_admin' | 'adjustment' | 'transfer'

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
  units_per_package?: number
  dispense_unit?: string
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
  category?: InventoryCategory
  batches?: InventoryBatch[]
}

export interface InventoryMovement {
  id: string
  item_id: string
  batch_id?: string | null
  clinic_id?: string | null
  destination_clinic_id?: string | null
  movement_type: InventoryMovementType
  quantity: number
  reason?: string | null
  performed_by?: string | null
  created_at: string
  item?: InventoryItem
  batch?: InventoryBatch
  clinic?: Clinic
  destination_clinic?: Clinic
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

// ─── Órdenes de Compra & Reorden Predictivo ─────────────────────────────────

export type PurchaseOrderStatus = 'draft' | 'sent' | 'received' | 'cancelled'

export interface PurchaseOrderItem {
  id: string
  order_id: string
  item_id: string
  package_quantity: number
  unit_cost: number
  total_cost: number
  received_quantity?: number
  notes?: string | null
  created_at?: string
  item?: InventoryItem
}

export interface PurchaseOrder {
  id: string
  clinic_id?: string | null
  order_number: string
  supplier_name: string
  supplier_contact?: string | null
  supplier_rnc?: string | null
  status: PurchaseOrderStatus
  forecast_window_days?: number
  notes?: string | null
  total_amount: number
  estimated_delivery_date?: string | null
  received_at?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  clinic?: Clinic
  items?: PurchaseOrderItem[]
}

export interface PredictiveRestockItem {
  item: InventoryItem
  currentStockPackages: number
  minimumStockPackages: number
  unitsPerPackage: number
  dispenseUnit: string
  totalUnitsRequired: number
  availableUnits: number
  projectedRemainingUnits: number
  projectedRemainingPackages: number
  suggestedPackagesToOrder: number
  estimatedCost: number
  urgency: 'out_of_stock' | 'critical_shortage' | 'low_stock' | 'sufficient'
  upcomingAppointments: Array<{
    appointmentId: string
    patientName: string
    scheduledAt: string
    procedureName: string
    requiredUnits: number
  }>
}

// ─── Trazabilidad de Esterilización & Bioseguridad ──────────────────────────

export type SterilizationCycleProgram =
  | 'instrumental_empaquetado'
  | 'instrumental_libre'
  | 'textiles_gomas'
  | 'prion'
  | 'otro'

export type BiologicalIndicatorStatus = 'not_applied' | 'pending' | 'passed' | 'failed'
export type SterilizationCycleStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled'
export type SterilePackageStatus = 'sterile' | 'used' | 'expired' | 'discarded'
export type SterilePackageType = 'pouch' | 'cassette' | 'container' | 'wrap'

export interface SterilizationCycle {
  id: string
  clinic_id?: string | null
  autoclave_item_id?: string | null
  autoclave_name: string
  cycle_number: number
  cycle_date: string
  start_time?: string | null
  end_time?: string | null
  temperature_c: number
  pressure_bar: number
  exposure_time_minutes: number
  drying_time_minutes: number
  cycle_program: SterilizationCycleProgram
  operator_name: string
  chemical_indicator_passed: boolean
  biological_indicator_status: BiologicalIndicatorStatus
  biological_indicator_lot?: string | null
  biological_indicator_read_date?: string | null
  status: SterilizationCycleStatus
  notes?: string | null
  created_at: string
  updated_at: string
  packages?: SterilizationPackage[]
  autoclave?: InventoryItem
}

export interface SterilizationPackage {
  id: string
  cycle_id: string
  clinic_id?: string | null
  package_code: string
  description: string
  item_id?: string | null
  package_type: SterilePackageType
  sterilization_date: string
  expiration_date: string
  status: SterilePackageStatus
  used_in_appointment_id?: string | null
  used_at?: string | null
  used_by_patient_name?: string | null
  notes?: string | null
  created_at: string
  item?: InventoryItem
  cycle?: SterilizationCycle
}

// ─── Fotografía Clínica & Casos Antes / Después ─────────────────────────────

export type ClinicalPhotoStage = 'before' | 'in_progress' | 'after'

export type ClinicalPhotoType =
  | 'frontal_smile'
  | 'intraoral_frontal'
  | 'intraoral_upper'
  | 'intraoral_lower'
  | 'lateral_right'
  | 'lateral_left'
  | 'profile'
  | 'other'

export interface PatientClinicalPhoto {
  id: string
  patient_id: string
  procedure_id?: string | null
  case_title: string
  stage: ClinicalPhotoStage
  photo_type: ClinicalPhotoType
  image_url: string
  taken_at: string
  doctor_notes?: string | null
  consent_for_marketing: boolean
  created_by?: string | null
  created_at: string
  procedure?: Procedure
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

export type PaymentModality = 'single_payment' | 'installments' | 'per_session' | 'custom_financing'
export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected' | 'partially_invoiced' | 'invoiced' | 'expired' | 'cancelled'
export type InstallmentStatus = 'pending' | 'invoiced' | 'paid' | 'cancelled'
export type PaymentFrequency = 'per_visit' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export interface BudgetItem {
  id: string
  budget_id: string
  procedure_id?: string | null
  name: string
  category?: string | null
  quantity: number
  unit_price: number
  discount: number
  total: number
  sessions_estimated?: number
  notes?: string | null
  procedure?: Procedure
}

export interface BudgetInstallment {
  id: string
  budget_id: string
  installment_number: number
  concept: string
  due_date?: string | null
  amount: number
  status: InstallmentStatus
  invoice_id?: string | null
  created_at: string
  invoice?: Invoice
}

export interface Budget {
  id: string
  budget_number: string
  patient_id?: string | null
  patient_name?: string | null
  patient_phone?: string | null
  patient_email?: string | null
  patient_id_number?: string | null
  clinic_id?: string | null
  issue_date: string
  valid_until: string
  subtotal: number
  discount_percent: number
  discount_amount: number
  tax: number
  total: number
  payment_modality: PaymentModality
  down_payment_amount: number
  installments_count: number
  payment_frequency: PaymentFrequency
  status: BudgetStatus
  notes?: string | null
  terms_and_conditions?: string | null
  patient_signature_url?: string | null
  patient_signed_at?: string | null
  patient_signed_name?: string | null
  patient_signed_id_doc?: string | null
  patient_signed_role?: string | null
  doctor_signature_url?: string | null
  doctor_signed_at?: string | null
  doctor_signed_name?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  patient?: Patient
  clinic?: Clinic
  items?: BudgetItem[]
  installments?: BudgetInstallment[]
  invoices?: Invoice[]
}

export interface Invoice {
  id: string
  invoice_number: string
  patient_id: string
  clinic_id?: string | null
  appointment_id?: string | null
  budget_id?: string | null
  budget_installment_id?: string | null
  payment_modality?: PaymentModality | string
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
  budget?: Budget
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
  code?: string | null
  procedure_id?: string | null
  title: string
  category?: 'ingreso_general' | 'periodoncia_implantes' | 'estetica_ortodoncia' | 'endodoncia_prevencion' | string | null
  required_fields?: string[]
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
  doctor_exequatur?: string | null
  doctor_signature_url?: string | null
  appointment_id?: string | null
  template_id?: string | null
  content_rendered: string
  signature_data_url?: string | null
  signer_role?: 'patient' | 'guardian' | 'representative' | null
  signer_name?: string | null
  signer_id_doc?: string | null
  metadata?: Record<string, any> | null
  status: 'signed' | 'revoked'
  signed_at: string
  created_at: string
  procedure?: Procedure
  template?: ConsentTemplate
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
  billing_status?: ProcedureBillingStatus
  invoice_id?: string | null
  budget_id?: string | null
}

export interface CreateBudgetItemDTO {
  procedure_id?: string
  name: string
  category?: string
  quantity: number
  unit_price: number
  discount?: number
  total?: number
  sessions_estimated?: number
  notes?: string
}

export interface CreateBudgetInstallmentDTO {
  installment_number: number
  concept: string
  due_date?: string
  amount: number
}

export interface CreateBudgetDTO {
  budget_number?: string
  patient_id?: string
  patient_name?: string
  patient_phone?: string
  patient_email?: string
  patient_id_number?: string
  clinic_id?: string
  issue_date?: string
  valid_until?: string
  subtotal?: number
  discount_percent?: number
  discount_amount?: number
  tax?: number
  total?: number
  payment_modality?: PaymentModality
  down_payment_amount?: number
  installments_count?: number
  payment_frequency?: PaymentFrequency
  status?: BudgetStatus
  notes?: string
  terms_and_conditions?: string
  patient_signature_url?: string | null
  patient_signed_at?: string | null
  patient_signed_name?: string | null
  patient_signed_id_doc?: string | null
  patient_signed_role?: string | null
  doctor_signature_url?: string | null
  doctor_signed_at?: string | null
  doctor_signed_name?: string | null
  items: CreateBudgetItemDTO[]
  installments?: CreateBudgetInstallmentDTO[]
}

export interface UpdateBudgetDTO {
  patient_id?: string | null
  patient_name?: string
  patient_phone?: string
  patient_email?: string
  patient_id_number?: string
  clinic_id?: string
  valid_until?: string
  subtotal?: number
  discount_percent?: number
  discount_amount?: number
  tax?: number
  total?: number
  payment_modality?: PaymentModality
  down_payment_amount?: number
  installments_count?: number
  payment_frequency?: PaymentFrequency
  status?: BudgetStatus
  notes?: string
  terms_and_conditions?: string
  patient_signature_url?: string | null
  patient_signed_at?: string | null
  patient_signed_name?: string | null
  patient_signed_id_doc?: string | null
  patient_signed_role?: string | null
  doctor_signature_url?: string | null
  doctor_signed_at?: string | null
  doctor_signed_name?: string | null
  items?: CreateBudgetItemDTO[]
  installments?: CreateBudgetInstallmentDTO[]
}

export interface SignBudgetDTO {
  budgetId: string
  signatureDataUrl: string
  signerName: string
  signerIdDoc?: string
  signerRole?: string
  doctorSignatureUrl?: string
  doctorSignedName?: string
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
      budgets: {
        Row: Budget
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'patient' | 'clinic' | 'items' | 'installments' | 'invoices'>
        Update: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'patient' | 'clinic' | 'items' | 'installments' | 'invoices'>>
      }
      budget_items: {
        Row: BudgetItem
        Insert: Omit<BudgetItem, 'id' | 'procedure'>
        Update: Partial<Omit<BudgetItem, 'id' | 'procedure'>>
      }
      budget_installments: {
        Row: BudgetInstallment
        Insert: Omit<BudgetInstallment, 'id' | 'created_at' | 'invoice'>
        Update: Partial<Omit<BudgetInstallment, 'id' | 'created_at' | 'invoice'>>
      }
      patient_clinical_examinations: {
        Row: PatientClinicalExamination
        Insert: Omit<PatientClinicalExamination, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PatientClinicalExamination, 'id' | 'created_at' | 'updated_at'>>
      }
      patient_periodontograms: {
        Row: PatientPeriodontogram
        Insert: Omit<PatientPeriodontogram, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PatientPeriodontogram, 'id' | 'created_at' | 'updated_at'>>
      }
      patient_odontograms: {
        Row: PatientOdontogram
        Insert: Omit<PatientOdontogram, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PatientOdontogram, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

// ==========================================
// FICHA DE EXAMEN CLÍNICO ODONTOLÓGICO TYPES
// ==========================================

export interface ChiefComplaintData {
  reason: string
  discomfort: string
  duration: string
  previous_treatments: string
}

export interface MedicalHistoryData {
  current_illnesses: string
  medications: string
  allergies: string
  surgeries_hospitalizations: string
  bleeding_healing_problems: string
  anesthesia_reactions: string
  pregnancy_status: string
  additional_notes?: string
}

export interface DentalHistoryData {
  last_dental_visit: string
  gum_disease_history: string
  scaling_root_planing: string
  surgeries_implants_grafts: string
  pending_treatments: string
  pain_bleeding_mobility_sensitivity: string
  teeth_migration: string
}

export interface HygieneHabitsData {
  brushing_frequency: string
  floss_interdental: string
  mouthwash: string
  tobacco_use: string
  alcohol_consumption: string
  bruxism_parafunctions: string
}

export interface PeriodontalEvaluationData {
  gum_bleeding: string
  gum_changes: string
  persistent_halitosis: string
  pus_secretion: string
  tooth_mobility: string
  teeth_spacing: string
  family_history_periodontal: string
}

export interface PatientPerceptionData {
  treatment_expectations: string
  areas_of_concern: string
  smile_improvements: string
}

export interface ProfessionalExamData {
  oral_hygiene_plaque: string
  dental_calculus: string
  gum_status: string
  bleeding_on_probing: string
  probing_depth_summary: string
  clinical_attachment_level: string
  recessions: string
  tooth_mobility: string
  furcation_involvement: string
  suppuration: string
  dental_migration: string
  mucosa_lesions: string
  occlusion_evaluation: string
  missing_teeth: string
  caries_restorations: string
  radiographs_cbct: string
  periodontal_diagnosis: string
  prognosis: string
  treatment_plan: string
}

export interface PatientClinicalExamination {
  id: string
  patient_id: string
  doctor_id?: string | null
  doctor_name?: string | null
  exam_date: string
  chief_complaint: ChiefComplaintData
  medical_history: MedicalHistoryData
  dental_history: DentalHistoryData
  hygiene_habits: HygieneHabitsData
  periodontal_evaluation: PeriodontalEvaluationData
  patient_perception: PatientPerceptionData
  professional_exam: ProfessionalExamData
  created_at: string
  updated_at: string
}

export interface CreateClinicalExaminationDTO {
  patient_id: string
  doctor_id?: string
  doctor_name?: string
  exam_date?: string
  chief_complaint: ChiefComplaintData
  medical_history: MedicalHistoryData
  dental_history: DentalHistoryData
  hygiene_habits: HygieneHabitsData
  periodontal_evaluation: PeriodontalEvaluationData
  patient_perception: PatientPerceptionData
  professional_exam: ProfessionalExamData
}

// ==========================================
// PERIODONTOGRAMA (SEPA STYLE) TYPES
// ==========================================

export interface PeriodontogramSiteData {
  probing_depth: number
  gingival_margin: number
  clinical_attachment: number
  bleeding: boolean
  plaque: boolean
  suppuration: boolean
}

export interface PeriodontogramToothData {
  tooth_number: number
  status: 'present' | 'missing' | 'implant'
  mobility: 0 | 1 | 2 | 3
  furcation?: 0 | 1 | 2 | 3
  vestibular: {
    distal: PeriodontogramSiteData
    middle: PeriodontogramSiteData
    mesial: PeriodontogramSiteData
  }
  palatal_lingual: {
    distal: PeriodontogramSiteData
    middle: PeriodontogramSiteData
    mesial: PeriodontogramSiteData
  }
  anchura_encia?: number
  pronostico?: string
  palatal_furcation?: 0 | 1 | 2 | 3
  notes?: string
}

export interface PeriodontogramStats {
  total_teeth_present: number
  total_teeth_missing: number
  total_implants: number
  total_sites_evaluated: number
  bop_sites: number
  bop_percentage: number
  plaque_sites: number
  plaque_percentage: number
  shallow_pockets_count: number
  deep_pockets_count: number
  furcation_sites_count: number
  suppuration_sites_count: number
  media_profundidad?: number
  media_nivel_insercion?: number
}

export interface PatientPeriodontogram {
  id: string
  patient_id: string
  doctor_id?: string | null
  doctor_name?: string | null
  title: string
  exam_date: string
  teeth_data: Record<string, PeriodontogramToothData>
  summary_stats: PeriodontogramStats
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreatePeriodontogramDTO {
  patient_id: string
  doctor_id?: string
  doctor_name?: string
  title: string
  exam_date?: string
  teeth_data: Record<string, PeriodontogramToothData>
  summary_stats: PeriodontogramStats
  notes?: string
}

// ==========================================
// ODONTOGRAMA TYPES
// ==========================================

export type ToothSurface = 'vestibular' | 'lingual_palatal' | 'mesial' | 'distal' | 'occlusal_incisal'

export type ToothCondition =
  | 'healthy'
  | 'caries'
  | 'composite'
  | 'amalgam'
  | 'crown'
  | 'endodontics_done'
  | 'endodontics_needed'
  | 'missing'
  | 'extraction_needed'
  | 'implant'
  | 'sealant'
  | 'fracture'
  | 'bridge'

export interface ToothState {
  tooth_number: number
  general_condition: ToothCondition
  surfaces: {
    vestibular: ToothCondition
    lingual_palatal: ToothCondition
    mesial: ToothCondition
    distal: ToothCondition
    occlusal_incisal: ToothCondition
  }
  notes?: string
}

export interface PatientOdontogram {
  id: string
  patient_id: string
  doctor_id?: string | null
  doctor_name?: string | null
  title: string
  dentition_type: 'adult' | 'pediatric'
  exam_date: string
  teeth_data: Record<string, ToothState>
  findings_summary?: Record<string, number>
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface CreateOdontogramDTO {
  patient_id: string
  doctor_id?: string
  doctor_name?: string
  title: string
  dentition_type: 'adult' | 'pediatric'
  exam_date?: string
  teeth_data: Record<string, ToothState>
  findings_summary?: Record<string, number>
  notes?: string
}

