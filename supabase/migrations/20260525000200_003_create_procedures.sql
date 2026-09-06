-- Migration: Create procedures and procedure_prices tables
-- Description: Catalog of dental procedures with price history tracking
-- Requirements: 2.2, 9.4, 16.5

-- Enable btree_gist extension for exclusion constraint on date ranges
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create procedures table
CREATE TABLE IF NOT EXISTS procedures (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 60,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE procedures IS 'Catalog of dental procedures offered by the practice';
COMMENT ON COLUMN procedures.duration_minutes IS 'Default duration for scheduling appointments';
COMMENT ON COLUMN procedures.is_active IS 'Soft delete flag - inactive procedures are hidden from UI';

-- Create procedure_prices table with price history
CREATE TABLE IF NOT EXISTS procedure_prices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id    UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  price           NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'DOP',
  effective_from  DATE NOT NULL,
  effective_to    DATE,
  changed_by      UUID REFERENCES auth.users(id),
  change_reason   TEXT,
  CONSTRAINT no_overlapping_prices EXCLUDE USING gist (
    procedure_id WITH =,
    daterange(effective_from, effective_to, '[)') WITH &&
  )
);

-- Add comments for documentation
COMMENT ON TABLE procedure_prices IS 'Price history for procedures with non-overlapping date ranges';
COMMENT ON COLUMN procedure_prices.effective_from IS 'Start date of price validity (inclusive)';
COMMENT ON COLUMN procedure_prices.effective_to IS 'End date of price validity (exclusive) - NULL means current price';
COMMENT ON COLUMN procedure_prices.changed_by IS 'User who made the price change for audit trail';
COMMENT ON COLUMN procedure_prices.change_reason IS 'Reason for price change - required for transparency';
COMMENT ON CONSTRAINT no_overlapping_prices ON procedure_prices IS 'Ensures no overlapping price periods for the same procedure using btree_gist';

-- Create index for efficient current price lookups
CREATE INDEX IF NOT EXISTS idx_procedure_prices_current ON procedure_prices(procedure_id, effective_from DESC)
  WHERE effective_to IS NULL;

-- Create index for price history queries
CREATE INDEX IF NOT EXISTS idx_procedure_prices_procedure_id ON procedure_prices(procedure_id);
