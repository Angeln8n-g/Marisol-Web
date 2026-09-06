-- Migration: Budget Digital Signatures
-- Description: Adds columns to support touchscreen and digital signatures for budgets

ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS patient_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS patient_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS patient_signed_name TEXT,
  ADD COLUMN IF NOT EXISTS patient_signed_id_doc TEXT,
  ADD COLUMN IF NOT EXISTS patient_signed_role TEXT DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS doctor_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS doctor_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS doctor_signed_name TEXT;

-- Create index for signed budgets lookup
CREATE INDEX IF NOT EXISTS idx_budgets_signed_at ON budgets(patient_signed_at);
