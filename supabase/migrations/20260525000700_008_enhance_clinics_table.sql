-- Migration: Enhance clinics table for location management
-- Description: Add operating hours, special hours, geographic indexes, and updated_at tracking
-- Requirements: 5.1, 5.2, 5.3, 5.5, 5.6

-- Ensure required extensions for spatial calculations are enabled
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Add new columns to clinics table
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS operating_hours JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS special_hours JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add constraints for coordinate validation if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinics_latitude_check') THEN
    ALTER TABLE clinics ADD CONSTRAINT clinics_latitude_check CHECK (latitude >= -90 AND latitude <= 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'clinics_longitude_check') THEN
    ALTER TABLE clinics ADD CONSTRAINT clinics_longitude_check CHECK (longitude >= -180 AND longitude <= 180);
  END IF;
END $$;

-- Change latitude and longitude to NUMERIC for better precision
ALTER TABLE clinics
  ALTER COLUMN latitude TYPE NUMERIC(10, 8),
  ALTER COLUMN longitude TYPE NUMERIC(11, 8);

-- Create GIST index for geographic queries using ll_to_earth
-- This enables efficient distance-based queries
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics USING GIST (
  ll_to_earth(latitude::float8, longitude::float8)
);

-- Create B-tree index on is_active for filtering active, non-deleted clinics
CREATE INDEX IF NOT EXISTS idx_clinics_active ON clinics (is_active)
  WHERE is_active = true AND is_deleted = false;

-- Create trigger function for updated_at timestamp with safe search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_clinics_updated_at ON clinics;
CREATE TRIGGER update_clinics_updated_at
  BEFORE UPDATE ON clinics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN clinics.operating_hours IS 'Weekly operating hours in JSONB format with days as keys';
COMMENT ON COLUMN clinics.special_hours IS 'Array of special hours for holidays and exceptions';
COMMENT ON COLUMN clinics.is_deleted IS 'Soft delete flag - deleted clinics are hidden but preserved';
COMMENT ON COLUMN clinics.updated_at IS 'Timestamp of last update, automatically maintained by trigger';
COMMENT ON INDEX idx_clinics_location IS 'GIST index for efficient geographic distance queries';
COMMENT ON INDEX idx_clinics_active IS 'Partial index for filtering active, non-deleted clinics';
