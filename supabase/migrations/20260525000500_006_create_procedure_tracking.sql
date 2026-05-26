-- Migration: Create procedure_tracking table
-- Description: Tracks multi-session procedures with follow-up scheduling and alerts
-- Requirements: 2.2, 9.4, 16.5

CREATE TABLE procedure_tracking (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID NOT NULL REFERENCES patients(id),
  procedure_id        UUID NOT NULL REFERENCES procedures(id),
  appointment_id      UUID REFERENCES appointments(id),
  status              TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled', 'in_progress', 'completed',
                                        'on_hold', 'cancelled')),
  start_date          DATE NOT NULL,
  expected_end_date   DATE,
  actual_end_date     DATE,
  progress_notes      TEXT,
  next_followup_date  DATE,
  alert_sent          BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE procedure_tracking IS 'Tracks multi-session procedures with follow-up scheduling and automated alerts';
COMMENT ON COLUMN procedure_tracking.patient_id IS 'Reference to patient receiving the procedure';
COMMENT ON COLUMN procedure_tracking.procedure_id IS 'Reference to the procedure being tracked';
COMMENT ON COLUMN procedure_tracking.appointment_id IS 'Optional reference to initial appointment that started the procedure';
COMMENT ON COLUMN procedure_tracking.status IS 'Current status of the procedure - constrained to valid workflow states';
COMMENT ON COLUMN procedure_tracking.start_date IS 'Date when the procedure started';
COMMENT ON COLUMN procedure_tracking.expected_end_date IS 'Estimated completion date';
COMMENT ON COLUMN procedure_tracking.actual_end_date IS 'Actual completion date - set when status becomes completed';
COMMENT ON COLUMN procedure_tracking.progress_notes IS 'Clinical notes about procedure progress';
COMMENT ON COLUMN procedure_tracking.next_followup_date IS 'Date of next scheduled follow-up - used for alert generation';
COMMENT ON COLUMN procedure_tracking.alert_sent IS 'Flag to prevent duplicate follow-up alerts';

-- Create index for efficient follow-up alert queries
CREATE INDEX idx_tracking_next_followup ON procedure_tracking(next_followup_date)
  WHERE status NOT IN ('completed', 'cancelled');

-- Create indexes for common queries
CREATE INDEX idx_tracking_patient_id ON procedure_tracking(patient_id);
CREATE INDEX idx_tracking_procedure_id ON procedure_tracking(procedure_id);
CREATE INDEX idx_tracking_status ON procedure_tracking(status);

-- Add comments for indexes
COMMENT ON INDEX idx_tracking_next_followup IS 'Optimizes follow-up alert generation - only indexes active procedures';
COMMENT ON INDEX idx_tracking_patient_id IS 'Optimizes patient procedure history queries';
COMMENT ON INDEX idx_tracking_procedure_id IS 'Optimizes queries by procedure type';
COMMENT ON INDEX idx_tracking_status IS 'Optimizes status-based filtering for active procedures';

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_procedure_tracking_updated_at
  BEFORE UPDATE ON procedure_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

