-- ==============================================================================
-- Migración 024: Rentabilidad Neta Real por Procedimiento y Sillón (Unit Economics)
-- ==============================================================================

-- 1. Agregar columnas de costos fijos, honorarios y laboratorio a procedures
ALTER TABLE procedures
  ADD COLUMN IF NOT EXISTS chair_hourly_cost NUMERIC(10,2) NOT NULL DEFAULT 800.00,
  ADD COLUMN IF NOT EXISTS doctor_commission_percent NUMERIC(5,2) NOT NULL DEFAULT 40.00,
  ADD COLUMN IF NOT EXISTS lab_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00;

COMMENT ON COLUMN procedures.chair_hourly_cost IS 'Costo operativo asignado por hora de sillón dental (RD$/hr)';
COMMENT ON COLUMN procedures.doctor_commission_percent IS 'Porcentaje de honorarios médicos del odontólogo especialista (ej. 40%)';
COMMENT ON COLUMN procedures.lab_cost IS 'Costo directo de laboratorio dental, fresado o prótesis externa (RD$)';

-- 2. Asegurar precios vigentes en procedure_prices para todos los procedimientos del catálogo
INSERT INTO procedure_prices (procedure_id, price, currency, effective_from, change_reason)
SELECT 
  p.id,
  CASE 
    WHEN p.name ILIKE '%Implantes%' THEN 45000.00
    WHEN p.name ILIKE '%Estética Dental%' THEN 18000.00
    WHEN p.name ILIKE '%Ortodoncia%' THEN 35000.00
    WHEN p.name ILIKE '%Endodoncia%' THEN 8500.00
    WHEN p.name ILIKE '%Blanqueamiento%' THEN 4500.00
    WHEN p.name ILIKE '%Profilaxis%' THEN 2500.00
    ELSE 3000.00
  END AS price,
  'DOP',
  CURRENT_DATE,
  'Actualización de tarifa base para cálculo de rentabilidad unitaria'
FROM procedures p
WHERE NOT EXISTS (
  SELECT 1 FROM procedure_prices pp 
  WHERE pp.procedure_id = p.id AND pp.effective_to IS NULL
);

-- Actualizar lab_cost en procedimientos que requieren laboratorio externo
UPDATE procedures
SET lab_cost = 8000.00
WHERE name ILIKE '%Implantes%';

UPDATE procedures
SET lab_cost = 4500.00
WHERE name ILIKE '%Estética Dental%';

UPDATE procedures
SET lab_cost = 9000.00
WHERE name ILIKE '%Ortodoncia%';
