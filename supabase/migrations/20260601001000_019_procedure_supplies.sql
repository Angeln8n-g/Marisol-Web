-- Migration: Procedure supplies and clinical tray configuration
-- Description: Connects dental procedures to inventory items (materials and equipment) for 1-click clinical tray dispatch and cost tracking
-- Requirements: Phase A: Clinical Trays & Inventory Integration

CREATE TABLE IF NOT EXISTS procedure_supplies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id  UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  item_id       UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 1,
  is_optional   BOOLEAN NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_procedure_item UNIQUE (procedure_id, item_id)
);

-- Comments for documentation
COMMENT ON TABLE procedure_supplies IS 'Bill of Materials (BOM) for dental procedures linking clinical procedures with inventory items';
COMMENT ON COLUMN procedure_supplies.procedure_id IS 'Dental procedure that requires the supply or tool';
COMMENT ON COLUMN procedure_supplies.item_id IS 'Reference to the inventory item (consumable or tool)';
COMMENT ON COLUMN procedure_supplies.quantity IS 'Default quantity needed per clinical session';
COMMENT ON COLUMN procedure_supplies.is_optional IS 'Whether this item is conditional/optional based on clinical criteria';
COMMENT ON COLUMN procedure_supplies.notes IS 'Clinical guidance or instructions for the assistant (e.g. shade, size)';

-- Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_procedure_supplies_procedure ON procedure_supplies(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_supplies_item ON procedure_supplies(item_id);

-- Enable Row Level Security (RLS)
ALTER TABLE procedure_supplies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view procedure supplies
CREATE POLICY "Allow authenticated users to read procedure supplies"
  ON procedure_supplies FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to manage procedure supplies
CREATE POLICY "Allow authenticated users to insert procedure supplies"
  ON procedure_supplies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update procedure supplies"
  ON procedure_supplies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete procedure supplies"
  ON procedure_supplies FOR DELETE
  TO authenticated
  USING (true);
