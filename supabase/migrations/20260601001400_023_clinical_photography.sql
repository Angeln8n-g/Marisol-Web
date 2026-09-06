-- ==============================================================================
-- Migración 023: Fotografía Clínica y Casos de Estética Dental (Antes / Después)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS patient_clinical_photos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  procedure_id          UUID REFERENCES procedures(id) ON DELETE SET NULL,
  case_title            TEXT NOT NULL DEFAULT 'Caso Clínico Estético',
  stage                 TEXT NOT NULL CHECK (stage IN ('before', 'in_progress', 'after')),
  photo_type            TEXT NOT NULL CHECK (photo_type IN (
                          'frontal_smile', 'intraoral_frontal', 'intraoral_upper',
                          'intraoral_lower', 'lateral_right', 'lateral_left', 'profile', 'other'
                        )),
  image_url             TEXT NOT NULL,
  taken_at              DATE NOT NULL DEFAULT CURRENT_DATE,
  doctor_notes          TEXT,
  consent_for_marketing BOOLEAN NOT NULL DEFAULT false,
  created_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE patient_clinical_photos IS 'Fotografías clínicas odontológicas categorizadas por etapa (antes/durante/después) y vista anatómica';

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_clinical_photos_patient ON patient_clinical_photos(patient_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_photos_stage ON patient_clinical_photos(stage);
CREATE INDEX IF NOT EXISTS idx_clinical_photos_type ON patient_clinical_photos(photo_type);

-- Habilitar RLS
ALTER TABLE patient_clinical_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_photos_all_auth" ON patient_clinical_photos
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
