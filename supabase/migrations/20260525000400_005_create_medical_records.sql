-- Migration: Create medical_records and record_documents tables
-- Description: Stores patient medical history with document attachments
-- Requirements: 2.2, 9.4, 16.5

-- Create medical_records table
CREATE TABLE medical_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID NOT NULL REFERENCES patients(id),
  appointment_id  UUID REFERENCES appointments(id),
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  chief_complaint TEXT NOT NULL,
  diagnosis       TEXT,
  treatment_plan  TEXT,
  notes           TEXT,
  record_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE medical_records IS 'Patient medical history records with clinical documentation';
COMMENT ON COLUMN medical_records.patient_id IS 'Reference to patient - required for all medical records';
COMMENT ON COLUMN medical_records.appointment_id IS 'Optional reference to appointment that generated this record';
COMMENT ON COLUMN medical_records.created_by IS 'Reference to doctor/user who created the record for audit trail';
COMMENT ON COLUMN medical_records.chief_complaint IS 'Primary reason for visit - required field';
COMMENT ON COLUMN medical_records.diagnosis IS 'Clinical diagnosis after examination';
COMMENT ON COLUMN medical_records.treatment_plan IS 'Recommended treatment plan';
COMMENT ON COLUMN medical_records.notes IS 'Additional clinical notes';
COMMENT ON COLUMN medical_records.record_date IS 'Date of the medical record - defaults to creation time';

-- Create index for efficient patient history queries
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id, record_date DESC);
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);

COMMENT ON INDEX idx_medical_records_patient_id IS 'Optimizes patient medical history queries with chronological ordering';
COMMENT ON INDEX idx_medical_records_appointment_id IS 'Optimizes lookup of records associated with specific appointments';

-- Create record_documents table for attachments
CREATE TABLE record_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  file_name         TEXT NOT NULL,
  file_url          TEXT NOT NULL,
  file_type         TEXT NOT NULL,
  file_size_bytes   INTEGER,
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE record_documents IS 'Document attachments for medical records (images, PDFs, radiographs)';
COMMENT ON COLUMN record_documents.medical_record_id IS 'Reference to parent medical record - cascades on delete';
COMMENT ON COLUMN record_documents.file_name IS 'Original filename for display';
COMMENT ON COLUMN record_documents.file_url IS 'Storage URL or path to the document';
COMMENT ON COLUMN record_documents.file_type IS 'MIME type of the document';
COMMENT ON COLUMN record_documents.file_size_bytes IS 'File size in bytes for validation and display';

-- Create index for efficient document lookups by medical record
CREATE INDEX idx_record_documents_medical_record_id ON record_documents(medical_record_id);

COMMENT ON INDEX idx_record_documents_medical_record_id IS 'Optimizes retrieval of all documents for a medical record';

