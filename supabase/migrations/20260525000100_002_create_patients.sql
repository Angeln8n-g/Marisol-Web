-- Migration: Create patients table
-- Description: Stores patient demographic and contact information
-- Requirements: 2.2, 9.4, 16.5

CREATE TABLE IF NOT EXISTS patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  email           TEXT UNIQUE,
  phone           TEXT NOT NULL,
  birth_date      DATE,
  gender          TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  medical_alerts  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE patients IS 'Patient demographic and contact information with medical alerts';
COMMENT ON COLUMN patients.email IS 'Unique email address - enforced at database level';
COMMENT ON COLUMN patients.medical_alerts IS 'Critical medical information (allergies, conditions, etc.)';
COMMENT ON COLUMN patients.gender IS 'Patient gender - constrained to specific values for data consistency';

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
