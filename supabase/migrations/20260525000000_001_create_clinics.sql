-- Migration: Create clinics table
-- Description: Stores information about dental clinic locations with geographic coordinates
-- Requirements: 2.2, 9.4, 16.5

CREATE TABLE clinics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  address     TEXT NOT NULL,
  latitude    DOUBLE PRECISION NOT NULL,
  longitude   DOUBLE PRECISION NOT NULL,
  phone       TEXT,
  whatsapp    TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comment for documentation
COMMENT ON TABLE clinics IS 'Dental clinic locations with geographic coordinates for multi-clinic management';
COMMENT ON COLUMN clinics.latitude IS 'Geographic latitude for map positioning';
COMMENT ON COLUMN clinics.longitude IS 'Geographic longitude for map positioning';
COMMENT ON COLUMN clinics.is_active IS 'Soft delete flag - inactive clinics are hidden from UI';
