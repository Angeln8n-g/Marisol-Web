-- Migration: Patient Records Expansion, Informed Consents & Reminders
-- Description: Extends patients table with complete anamnesis and creates consent template/signing tables
-- Requirements: 4.1, 4.2, 4.3, 4.4

-- 1. Extend patients table
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS identification_type TEXT DEFAULT 'cedula' CHECK (identification_type IN ('cedula', 'passport', 'rnc', 'other')),
  ADD COLUMN IF NOT EXISTS identification_number TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Santo Domingo',
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
  ADD COLUMN IF NOT EXISTS insurance_provider TEXT,
  ADD COLUMN IF NOT EXISTS insurance_card_number TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS civil_status TEXT CHECK (civil_status IN ('single', 'married', 'divorced', 'widowed', 'other')),
  ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_patients_identification ON patients(identification_number);

-- 2. Create consent_templates table
CREATE TABLE IF NOT EXISTS consent_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id        UUID REFERENCES procedures(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  template_content    TEXT NOT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create signed_consents table
CREATE TABLE IF NOT EXISTS signed_consents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_id        UUID REFERENCES procedures(id) ON DELETE SET NULL,
  doctor_id           UUID REFERENCES auth.users(id),
  doctor_name         TEXT NOT NULL,
  appointment_id      UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template_id         UUID REFERENCES consent_templates(id) ON DELETE SET NULL,
  content_rendered    TEXT NOT NULL,
  signature_data_url  TEXT,
  status              TEXT NOT NULL DEFAULT 'signed' CHECK (status IN ('signed', 'revoked')),
  signed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signed_consents_patient ON signed_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_signed_consents_procedure ON signed_consents(procedure_id);

-- 4. Create appointment_reminders table
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id      UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  reminder_type       TEXT NOT NULL DEFAULT 'whatsapp' CHECK (reminder_type IN ('whatsapp', 'email', 'sms')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'confirmed')),
  scheduled_time      TIMESTAMPTZ NOT NULL,
  sent_at             TIMESTAMPTZ,
  message_content     TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON appointment_reminders(status);

-- 5. Enable RLS
ALTER TABLE consent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE signed_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_templates_read" ON consent_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "consent_templates_admin_write" ON consent_templates
  FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "signed_consents_read" ON signed_consents
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "signed_consents_insert" ON signed_consents
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "signed_consents_admin_delete" ON signed_consents
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

CREATE POLICY "reminders_all" ON appointment_reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Insert Default Dental Consent Templates
INSERT INTO consent_templates (title, template_content, description) VALUES
(
  'Consentimiento Informado para Cirugía Oral y Extracciones',
  'Yo, {{patient_name}}, portador del documento de identidad No. {{patient_id}}, por el presente documento certifico que he sido plenamente informado(a) por el(la) Dr.(a) {{doctor_name}} en la sede {{clinic_name}}, acerca de la necesidad del procedimiento de {{procedure_name}}.\n\nSe me han explicado claramente los posibles riesgos inherentes, tales como inflamación, dolor postoperatorio, hemorragia temporal, infección o hematoma. Comprendo las indicaciones previas y posteriores que debo seguir fielmente.\n\nEn fecha {{date}}, firmo este consentimiento libre y voluntariamente.',
  'Plantilla estándar para extracciones de cordales y procedimientos de cirugía oral'
),
(
  'Consentimiento Informado para Tratamiento de Endodoncia',
  'Yo, {{patient_name}}, con documento de identidad No. {{patient_id}}, autorizo expresamente al(a la) Dr.(a) {{doctor_name}} a realizar el tratamiento de conductos (endodoncia) en la clínica {{clinic_name}} para el procedimiento de {{procedure_name}}.\n\nHe sido informado(a) de que el objetivo del tratamiento es preservar la pieza dental, y que en ocasiones se puede requerir medicación intraconducto, sesiones adicionales y la posterior rehabilitación con poste o corona.\n\nFecha: {{date}}.',
  'Plantilla para tratamiento de conductos radiculares'
),
(
  'Consentimiento Informado para Implantes Dentales',
  'Yo, {{patient_name}}, identificado(a) con {{patient_id}}, manifiesto que el(la) Dr.(a) {{doctor_name}} me ha explicado detalladamente las fases quirúrgica y protésica de la colocación de {{procedure_name}} en la clínica {{clinic_name}}.\n\nComprendo los requerimientos de oseointegración, higiene estricta y visitas periódicas de control. Acepto el procedimiento hoy {{date}}.',
  'Plantilla para cirugía y rehabilitación de implantes dentales'
),
(
  'Consentimiento Informado para Blanqueamiento y Estética Dental',
  'Yo, {{patient_name}}, con documento {{patient_id}}, acepto el tratamiento de estética dental / blanqueamiento ({{procedure_name}}) realizado por el(la) Dr.(a) {{doctor_name}} en {{clinic_name}}.\n\nSe me ha explicado la posibilidad de sensibilidad dental transitoria y las restricciones de alimentos pigmentantes durante el tratamiento.\n\nFecha: {{date}}.',
  'Plantilla para aclaramiento dental y estética'
);
