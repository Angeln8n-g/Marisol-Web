-- ==============================================================================
-- Migración 020: Unidades Individuales de Dispensación Clínica y Factores de Empaque
-- ==============================================================================

-- 1. Agregar columnas a inventory_items
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS units_per_package numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS dispense_unit text DEFAULT 'unidad';

-- 2. Agregar columna a procedure_supplies
ALTER TABLE procedure_supplies
  ADD COLUMN IF NOT EXISTS dispense_unit text;

-- 3. Actualizar artículos clínicos con sus factores de conversión reales por presentación
-- Baberos Dentales Desechables Plastificados (500 uds)
UPDATE inventory_items
SET units_per_package = 500, dispense_unit = 'unidad'
WHERE code = 'BIO-BAB-DES';

-- Anestésicos (Cajas de 50 cartuchos / carpules)
UPDATE inventory_items
SET units_per_package = 50, dispense_unit = 'carpule'
WHERE code IN ('ANES-MEPI-01', 'ANES-ARTI-02');

-- Agujas Dentales (Cajas de 100 uds)
UPDATE inventory_items
SET units_per_package = 100, dispense_unit = 'aguja'
WHERE code IN ('AGU-CORT-30G', 'AGU-LARG-27G');

-- Hojas de Bisturí (Cajas de 100 uds)
UPDATE inventory_items
SET units_per_package = 100, dispense_unit = 'hoja'
WHERE code = 'CIR-BIST-15';

-- Suturas (Cajas de 36 sobres)
UPDATE inventory_items
SET units_per_package = 36, dispense_unit = 'sobre'
WHERE code IN ('SUT-VIC-40', 'SUT-SED-30');

-- Esponjas Hemostáticas Gelfoam (24 unidades)
UPDATE inventory_items
SET units_per_package = 24, dispense_unit = 'esponja'
WHERE code = 'CIR-HEMO-01';

-- Gasas Estériles (200 paquetes/sobres)
UPDATE inventory_items
SET units_per_package = 200, dispense_unit = 'paquetito'
WHERE code = 'BIO-GAS-5X5';

-- Guantes de Nitrilo (Caja de 100 unidades / 50 pares)
UPDATE inventory_items
SET units_per_package = 100, dispense_unit = 'guante'
WHERE code = 'BIO-GUAN-NIT-M';

-- Mascarillas Quirúrgicas (Caja de 50 uds)
UPDATE inventory_items
SET units_per_package = 50, dispense_unit = 'mascarilla'
WHERE code = 'BIO-MASC-3P';

-- Eyectores de Saliva (Paquete de 100 uds)
UPDATE inventory_items
SET units_per_package = 100, dispense_unit = 'eyector'
WHERE code = 'BIO-EYEC-SAL';

-- Bolsas de Esterilización (Caja de 200 uds)
UPDATE inventory_items
SET units_per_package = 200, dispense_unit = 'bolsa'
WHERE code = 'BIO-BOLS-AUTOC';

-- Copas de Goma Profilaxis (Caja de 100 uds)
UPDATE inventory_items
SET units_per_package = 100, dispense_unit = 'copa'
WHERE code = 'PRO-COP-100';

-- Dique de Goma (Caja de 36 hojas)
UPDATE inventory_items
SET units_per_package = 36, dispense_unit = 'hoja'
WHERE code = 'AIS-DIQ-GOM';

-- Discos de Pulido Sof-Lex (Caja de 240 uds)
UPDATE inventory_items
SET units_per_package = 240, dispense_unit = 'disco'
WHERE code = 'PUL-SOF-LEX';

-- Limas NiTi ProTaper Gold (Blister de 6 limas)
UPDATE inventory_items
SET units_per_package = 6, dispense_unit = 'lima'
WHERE code = 'ENDO-PRO-GOLD';

-- Conos de Gutapercha (Caja de 60 conos)
UPDATE inventory_items
SET units_per_package = 60, dispense_unit = 'cono'
WHERE code = 'ENDO-GUTA-25';

-- Para artículos individuales o frascos/jeringas donde la unidad es directa
UPDATE inventory_items
SET units_per_package = 1, dispense_unit = unit
WHERE units_per_package IS NULL OR units_per_package <= 0;

-- 4. Actualizar procedure_supplies con la unidad de dispensación correspondiente
UPDATE procedure_supplies ps
SET dispense_unit = COALESCE(ii.dispense_unit, ii.unit, 'unidad')
FROM inventory_items ii
WHERE ps.item_id = ii.id AND ps.dispense_unit IS NULL;
