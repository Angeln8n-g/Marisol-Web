-- Migration: Enhance procedures table with clinical timing and buffers
-- Description: Adds detailed duration breakdown, setup/cleanup buffers, and session management
-- Requirements: 5.1

ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS clinical_duration_minutes INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS setup_buffer_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS cleanup_buffer_minutes INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS estimated_sessions INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_days_between_sessions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requires_previous_cleaning BOOLEAN NOT NULL DEFAULT false;

-- Update existing procedures to have consistent duration_minutes
UPDATE procedures
SET duration_minutes = clinical_duration_minutes + setup_buffer_minutes + cleanup_buffer_minutes
WHERE duration_minutes IS NULL OR duration_minutes = 60;

COMMENT ON COLUMN procedures.clinical_duration_minutes IS 'Effective time doctor spends performing procedure on patient';
COMMENT ON COLUMN procedures.setup_buffer_minutes IS 'Buffer time to prep room, instruments, and anesthesia before patient arrives';
COMMENT ON COLUMN procedures.cleanup_buffer_minutes IS 'Buffer time for sterilization, cleaning, and room disinfection after procedure';
COMMENT ON COLUMN procedures.estimated_sessions IS 'Typical number of clinical sessions required for full treatment';
COMMENT ON COLUMN procedures.min_days_between_sessions IS 'Minimum recommended recovery or laboratory waiting days between sessions';
