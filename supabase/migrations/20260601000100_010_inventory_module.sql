-- Migration: General Inventory Module
-- Description: Tools/equipment, clinical consumables (with batch & expiration), admin consumables, and maintenance services
-- Requirements: 2.1, 2.2, 2.3, 2.4

-- 1. Inventory categories
CREATE TABLE IF NOT EXISTS inventory_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  item_type   TEXT NOT NULL CHECK (item_type IN ('tool', 'consumable_clinical', 'consumable_admin', 'other')),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE SET NULL,
  category_id   UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  code          TEXT,
  item_type     TEXT NOT NULL CHECK (item_type IN ('tool', 'consumable_clinical', 'consumable_admin', 'other')),
  unit          TEXT NOT NULL DEFAULT 'unidad',
  current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
  minimum_stock NUMERIC(10,2) NOT NULL DEFAULT 5,
  cost_price    NUMERIC(10,2) DEFAULT 0,
  brand         TEXT,
  serial_number TEXT,
  location_room TEXT,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_maintenance', 'damaged', 'retired')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_clinic ON inventory_items(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);

-- 3. Inventory batches table (for clinical expiration control)
CREATE TABLE IF NOT EXISTS inventory_batches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id         UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_number    TEXT NOT NULL,
  initial_quantity NUMERIC(10,2) NOT NULL,
  current_quantity NUMERIC(10,2) NOT NULL,
  expiration_date DATE NOT NULL,
  received_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_item ON inventory_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiration ON inventory_batches(expiration_date);

-- 4. Inventory movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id               UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  batch_id              UUID REFERENCES inventory_batches(id) ON DELETE SET NULL,
  clinic_id             UUID REFERENCES clinics(id) ON DELETE SET NULL,
  destination_clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  movement_type         TEXT NOT NULL CHECK (movement_type IN ('entry', 'exit_clinical', 'exit_admin', 'adjustment', 'transfer')),
  quantity              NUMERIC(10,2) NOT NULL,
  reason                TEXT,
  performed_by          UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created ON inventory_movements(created_at DESC);

-- 5. Equipment maintenance table
CREATE TABLE IF NOT EXISTS equipment_maintenance (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id               UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  clinic_id             UUID REFERENCES clinics(id) ON DELETE SET NULL,
  maintenance_type      TEXT NOT NULL CHECK (maintenance_type IN ('preventive', 'corrective', 'calibration')),
  title                 TEXT NOT NULL,
  description           TEXT,
  technician_name       TEXT NOT NULL,
  technician_contact    TEXT,
  status                TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date        DATE NOT NULL,
  completed_date        DATE,
  cost                  NUMERIC(10,2) DEFAULT 0,
  next_maintenance_date DATE,
  findings              TEXT,
  actions_taken         TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_item ON equipment_maintenance(item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON equipment_maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_status ON equipment_maintenance(status);

-- 6. Enable RLS and policies
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_cat_read" ON inventory_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "inventory_cat_admin" ON inventory_categories FOR ALL TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "inventory_items_all" ON inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inventory_batches_all" ON inventory_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inventory_movements_all" ON inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "equipment_maintenance_all" ON equipment_maintenance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Seed Initial Categories
INSERT INTO inventory_categories (name, item_type, description) VALUES
('Instrumental Rotatorio y Equipos', 'tool', 'Turbinas, micromotores, autoclaves, lámparas de fotocurado y sillones dentales'),
('Materiales Restauradores y Resinas', 'consumable_clinical', 'Composites, adhesivos, ionómeros y sellantes'),
('Anestésicos y Quirúrgicos', 'consumable_clinical', 'Cartuchos de anestesia, agujas, suturas y hemostáticos'),
('Bioseguridad y Protección', 'consumable_clinical', 'Guantes, mascarillas, campos quirúrgicos y baberos'),
('Papelería y Oficina', 'consumable_admin', 'Papel bond, recibos, tóner y carpetas de expedientes'),
('Artículos de Limpieza e Higiene General', 'consumable_admin', 'Desinfectantes de superficie, jabón antibacterial y detergentes');
