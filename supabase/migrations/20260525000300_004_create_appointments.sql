-- Migration: Create appointments table
-- Description: Stores appointment scheduling with status tracking and clinic assignment
-- Requirements: 2.2, 9.4, 16.5

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id),
  clinic_id         UUID NOT NULL REFERENCES clinics(id),
  procedure_id      UUID REFERENCES procedures(id),
  assigned_doctor   UUID REFERENCES auth.users(id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'in_progress',
                                      'completed', 'cancelled', 'rescheduled')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE appointments IS 'Appointment scheduling with multi-clinic support and status workflow';
COMMENT ON COLUMN appointments.patient_id IS 'Reference to patient - required for all appointments';
COMMENT ON COLUMN appointments.clinic_id IS 'Reference to clinic location - required for multi-clinic management';
COMMENT ON COLUMN appointments.procedure_id IS 'Reference to procedure - optional for initial booking requests';
COMMENT ON COLUMN appointments.assigned_doctor IS 'Reference to doctor user - assigned after confirmation';
COMMENT ON COLUMN appointments.scheduled_at IS 'Appointment date and time in UTC';
COMMENT ON COLUMN appointments.duration_minutes IS 'Appointment duration for calendar blocking';
COMMENT ON COLUMN appointments.status IS 'Appointment workflow status - constrained to valid values';
COMMENT ON COLUMN appointments.notes IS 'Additional notes or special instructions';

-- Create indexes for efficient queries
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Add comments for indexes
COMMENT ON INDEX idx_appointments_scheduled_at IS 'Optimizes calendar view queries and date range filters';
COMMENT ON INDEX idx_appointments_patient_id IS 'Optimizes patient appointment history lookups';
COMMENT ON INDEX idx_appointments_clinic_id IS 'Optimizes clinic-specific appointment queries for multi-clinic filtering';
COMMENT ON INDEX idx_appointments_status IS 'Optimizes status-based filtering (pending, confirmed, etc.)';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

