-- ==============================================================================
-- Migración 022: Trazabilidad de Esterilización y Bioseguridad (Ciclos de Autoclave)
-- ==============================================================================

-- 1. Tabla de Ciclos de Esterilización en Autoclave
CREATE TABLE IF NOT EXISTS sterilization_cycles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                   UUID REFERENCES clinics(id) ON DELETE SET NULL,
  autoclave_item_id           UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  autoclave_name              TEXT NOT NULL DEFAULT 'Autoclave Principal',
  cycle_number                INTEGER NOT NULL,
  cycle_date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time                  TIME,
  end_time                    TIME,
  temperature_c               NUMERIC(5,1) NOT NULL DEFAULT 134.0,
  pressure_bar                NUMERIC(4,2) NOT NULL DEFAULT 2.10,
  exposure_time_minutes       INTEGER NOT NULL DEFAULT 18,
  drying_time_minutes         INTEGER NOT NULL DEFAULT 15,
  cycle_program               TEXT NOT NULL DEFAULT 'instrumental_empaquetado'
                              CHECK (cycle_program IN ('instrumental_empaquetado', 'instrumental_libre', 'textiles_gomas', 'prion', 'otro')),
  operator_name               TEXT NOT NULL,
  chemical_indicator_passed   BOOLEAN NOT NULL DEFAULT true,
  biological_indicator_status TEXT NOT NULL DEFAULT 'not_applied'
                              CHECK (biological_indicator_status IN ('not_applied', 'pending', 'passed', 'failed')),
  biological_indicator_lot    TEXT,
  biological_indicator_read_date DATE,
  status                      TEXT NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  notes                       TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sterilization_cycles IS 'Registro oficial de ciclos de esterilización en autoclave para bioseguridad clínica';

-- 2. Tabla de Paquetes / Bandejas / Casetes Esterilizados
CREATE TABLE IF NOT EXISTS sterilization_packages (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id                UUID NOT NULL REFERENCES sterilization_cycles(id) ON DELETE CASCADE,
  clinic_id               UUID REFERENCES clinics(id) ON DELETE SET NULL,
  package_code            TEXT NOT NULL UNIQUE,
  description             TEXT NOT NULL,
  item_id                 UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  package_type            TEXT NOT NULL DEFAULT 'pouch'
                          CHECK (package_type IN ('pouch', 'cassette', 'container', 'wrap')),
  sterilization_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date         DATE NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'sterile'
                          CHECK (status IN ('sterile', 'used', 'expired', 'discarded')),
  used_in_appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  used_at                 TIMESTAMPTZ,
  used_by_patient_name    TEXT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE sterilization_packages IS 'Bolsas y casetes esterilizados con trazabilidad de fecha de vencimiento y paciente receptor';

-- 3. Índices de Búsqueda Rápida
CREATE INDEX IF NOT EXISTS idx_sterilization_cycles_clinic ON sterilization_cycles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sterilization_cycles_date ON sterilization_cycles(cycle_date DESC);
CREATE INDEX IF NOT EXISTS idx_sterilization_packages_cycle ON sterilization_packages(cycle_id);
CREATE INDEX IF NOT EXISTS idx_sterilization_packages_status ON sterilization_packages(status);
CREATE INDEX IF NOT EXISTS idx_sterilization_packages_expiration ON sterilization_packages(expiration_date);
CREATE INDEX IF NOT EXISTS idx_sterilization_packages_code ON sterilization_packages(package_code);

-- 4. Habilitar RLS
ALTER TABLE sterilization_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sterilization_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sterilization_cycles_all_auth" ON sterilization_cycles
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "sterilization_packages_all_auth" ON sterilization_packages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
