-- Migration: Periodontal and Dental Charts (Clinical Examination, SEPA Periodontogram, Odontogram)
-- Description: Creates tables for structured clinical examinations, SEPA-style periodontograms, and interactive odontograms

-- 1. Table: patient_clinical_examinations
CREATE TABLE IF NOT EXISTS patient_clinical_examinations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id               UUID REFERENCES auth.users(id),
  doctor_name             TEXT,
  exam_date               TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 6 Secciones de Anamnesis / Cuestionario del Paciente
  chief_complaint         JSONB NOT NULL DEFAULT '{}',
  medical_history         JSONB NOT NULL DEFAULT '{}',
  dental_history          JSONB NOT NULL DEFAULT '{}',
  hygiene_habits          JSONB NOT NULL DEFAULT '{}',
  periodontal_evaluation  JSONB NOT NULL DEFAULT '{}',
  patient_perception      JSONB NOT NULL DEFAULT '{}',
  
  -- Examen Clínico del Profesional (18 Parámetros)
  professional_exam       JSONB NOT NULL DEFAULT '{}',
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE patient_clinical_examinations IS 'Ficha clínica odontológica y periodontal con cuestionario anamnésico y examen del profesional';
CREATE INDEX IF NOT EXISTS idx_clinical_exams_patient_id ON patient_clinical_examinations(patient_id, exam_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_exams_doctor_id ON patient_clinical_examinations(doctor_id);

-- 2. Table: patient_periodontograms (Estilo SEPA)
CREATE TABLE IF NOT EXISTS patient_periodontograms (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id               UUID REFERENCES auth.users(id),
  doctor_name             TEXT,
  title                   TEXT NOT NULL DEFAULT 'Periodontograma Inicial',
  exam_date               TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Datos de los 32 dientes (FDI 18-48): 6 sitios por diente (MG, PS, NIC, BOP, placa, supuración, movilidad, furca, estado)
  teeth_data              JSONB NOT NULL DEFAULT '{}',
  
  -- Estadísticas computadas en tiempo real (% BOP, % Placa O'Leary, conteo de bolsas leves y profundas)
  summary_stats           JSONB NOT NULL DEFAULT '{}',
  
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE patient_periodontograms IS 'Periodontogramas evolutivos del paciente al estilo SEPA';
CREATE INDEX IF NOT EXISTS idx_periodontograms_patient_id ON patient_periodontograms(patient_id, exam_date DESC);

-- 3. Table: patient_odontograms
CREATE TABLE IF NOT EXISTS patient_odontograms (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id              UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id               UUID REFERENCES auth.users(id),
  doctor_name             TEXT,
  title                   TEXT NOT NULL DEFAULT 'Odontograma Inicial',
  dentition_type          TEXT NOT NULL DEFAULT 'adult' CHECK (dentition_type IN ('adult', 'pediatric')),
  exam_date               TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Datos de piezas dentales (18-48 / 55-85) con condiciones por superficie anatómica (V, L/P, M, D, O) y estado general
  teeth_data              JSONB NOT NULL DEFAULT '{}',
  findings_summary        JSONB NOT NULL DEFAULT '{}',
  notes                   TEXT,
  
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE patient_odontograms IS 'Odontogramas interactivos del paciente con mapeo de superficies y tratamientos';
CREATE INDEX IF NOT EXISTS idx_odontograms_patient_id ON patient_odontograms(patient_id, exam_date DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE patient_clinical_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_periodontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_odontograms ENABLE ROW LEVEL SECURITY;

-- Policies for patient_clinical_examinations
CREATE POLICY "clinical_exams_select" ON patient_clinical_examinations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "clinical_exams_insert" ON patient_clinical_examinations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "clinical_exams_update" ON patient_clinical_examinations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "clinical_exams_delete" ON patient_clinical_examinations
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Policies for patient_periodontograms
CREATE POLICY "periodontograms_select" ON patient_periodontograms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "periodontograms_insert" ON patient_periodontograms
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "periodontograms_update" ON patient_periodontograms
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "periodontograms_delete" ON patient_periodontograms
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');

-- Policies for patient_odontograms
CREATE POLICY "odontograms_select" ON patient_odontograms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "odontograms_insert" ON patient_odontograms
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "odontograms_update" ON patient_odontograms
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "odontograms_delete" ON patient_odontograms
  FOR DELETE TO authenticated USING (get_user_role() = 'admin');
