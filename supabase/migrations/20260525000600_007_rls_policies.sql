-- Migration: Row-Level Security (RLS) Policies
-- Description: Implements comprehensive RLS policies for multi-clinic access control
-- Requirements: 3.7, 3.8, 6.7, 17.1, 17.2, 17.3

-- ============================================================================
-- STEP 1: Enable RLS on all clinical tables
-- ============================================================================

ALTER TABLE clinics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_prices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create helper functions for role-based access control
-- ============================================================================

-- Function to get the role of the currently authenticated user
-- SECURITY DEFINER allows this function to access the users table regardless of RLS
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the currently authenticated user (admin, doctor, receptionist)';

-- Function to get the clinic_id of the currently authenticated user
-- Used to restrict doctor/receptionist access to their assigned clinic
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_clinic_id() IS 'Returns the clinic_id assigned to the currently authenticated user';

-- ============================================================================
-- STEP 3: RLS Policies for CLINICS table
-- ============================================================================

-- Public read access for clinics (needed for public appointment form)
CREATE POLICY "clinics_public_read" ON clinics
  FOR SELECT
  USING (true);

COMMENT ON POLICY "clinics_public_read" ON clinics IS 'Allows public read access to clinic information for appointment booking';

-- Admin-only write access for clinics
CREATE POLICY "clinics_admin_write" ON clinics
  FOR ALL
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "clinics_admin_write" ON clinics IS 'Only admins can create, update, or delete clinic records';

-- ============================================================================
-- STEP 4: RLS Policies for PATIENTS table
-- ============================================================================

-- Authenticated users can read all patients
CREATE POLICY "patients_auth_read" ON patients
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "patients_auth_read" ON patients IS 'All authenticated users can read patient records';

-- Authenticated users can create/update/delete patients
CREATE POLICY "patients_auth_write" ON patients
  FOR ALL
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "patients_auth_write" ON patients IS 'All authenticated users can manage patient records';

-- ============================================================================
-- STEP 5: RLS Policies for APPOINTMENTS table
-- ============================================================================

-- Public insert for appointment requests (from public website form)
CREATE POLICY "appointments_public_insert" ON appointments
  FOR INSERT
  WITH CHECK (status = 'pending');

COMMENT ON POLICY "appointments_public_insert" ON appointments IS 'Allows public appointment requests with pending status only';

-- Admin has full access to all appointments
CREATE POLICY "appointments_admin_all" ON appointments
  FOR ALL
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "appointments_admin_all" ON appointments IS 'Admins have full access to all appointments across all clinics';

-- Doctor/Receptionist can read appointments from their clinic
CREATE POLICY "appointments_clinic_read" ON appointments
  FOR SELECT
  USING (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_read" ON appointments IS 'Doctors and receptionists can read appointments from their assigned clinic';

-- Doctor/Receptionist can update/delete appointments from their clinic
CREATE POLICY "appointments_clinic_write" ON appointments
  FOR UPDATE
  USING (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_write" ON appointments IS 'Doctors and receptionists can update appointments in their assigned clinic';

-- Doctor/Receptionist can insert appointments for their clinic
CREATE POLICY "appointments_clinic_insert" ON appointments
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_insert" ON appointments IS 'Doctors and receptionists can create appointments for their assigned clinic';

-- ============================================================================
-- STEP 6: RLS Policies for MEDICAL_RECORDS table
-- ============================================================================

-- Authenticated users can read all medical records
CREATE POLICY "medical_records_auth_read" ON medical_records
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "medical_records_auth_read" ON medical_records IS 'All authenticated users can read medical records';

-- Authenticated users can create medical records
CREATE POLICY "medical_records_auth_insert" ON medical_records
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "medical_records_auth_insert" ON medical_records IS 'All authenticated users can create medical records';

-- Users can update medical records they created
CREATE POLICY "medical_records_creator_update" ON medical_records
  FOR UPDATE
  USING (created_by = auth.uid() OR get_user_role() = 'admin');

COMMENT ON POLICY "medical_records_creator_update" ON medical_records IS 'Users can update their own medical records, admins can update any';

-- Only admins can delete medical records
CREATE POLICY "medical_records_admin_delete" ON medical_records
  FOR DELETE
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "medical_records_admin_delete" ON medical_records IS 'Only admins can delete medical records';

-- ============================================================================
-- STEP 7: RLS Policies for RECORD_DOCUMENTS table
-- ============================================================================

-- Authenticated users can read all record documents
CREATE POLICY "record_documents_auth_read" ON record_documents
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "record_documents_auth_read" ON record_documents IS 'All authenticated users can read record documents';

-- Authenticated users can insert record documents
CREATE POLICY "record_documents_auth_insert" ON record_documents
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "record_documents_auth_insert" ON record_documents IS 'All authenticated users can upload record documents';

-- Authenticated users can delete record documents (cascades from medical_records)
CREATE POLICY "record_documents_auth_delete" ON record_documents
  FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "record_documents_auth_delete" ON record_documents IS 'All authenticated users can delete record documents';

-- ============================================================================
-- STEP 8: RLS Policies for PROCEDURES table
-- ============================================================================

-- Public read access for procedures (needed for public appointment form)
CREATE POLICY "procedures_public_read" ON procedures
  FOR SELECT
  USING (true);

COMMENT ON POLICY "procedures_public_read" ON procedures IS 'Allows public read access to procedure catalog for appointment booking';

-- Admin-only write access for procedures
CREATE POLICY "procedures_admin_write" ON procedures
  FOR ALL
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "procedures_admin_write" ON procedures IS 'Only admins can create, update, or delete procedures';

-- ============================================================================
-- STEP 9: RLS Policies for PROCEDURE_PRICES table
-- ============================================================================

-- Authenticated users can read procedure prices
CREATE POLICY "procedure_prices_auth_read" ON procedure_prices
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "procedure_prices_auth_read" ON procedure_prices IS 'All authenticated users can read procedure prices';

-- Admin-only write access for procedure prices
CREATE POLICY "procedure_prices_admin_write" ON procedure_prices
  FOR ALL
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "procedure_prices_admin_write" ON procedure_prices IS 'Only admins can create, update, or delete procedure prices';

-- ============================================================================
-- STEP 10: RLS Policies for PROCEDURE_TRACKING table
-- ============================================================================

-- Authenticated users can read all procedure tracking records
CREATE POLICY "procedure_tracking_auth_read" ON procedure_tracking
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "procedure_tracking_auth_read" ON procedure_tracking IS 'All authenticated users can read procedure tracking records';

-- Authenticated users can create procedure tracking records
CREATE POLICY "procedure_tracking_auth_insert" ON procedure_tracking
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON POLICY "procedure_tracking_auth_insert" ON procedure_tracking IS 'All authenticated users can create procedure tracking records';

-- Authenticated users can update procedure tracking records
CREATE POLICY "procedure_tracking_auth_update" ON procedure_tracking
  FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "procedure_tracking_auth_update" ON procedure_tracking IS 'All authenticated users can update procedure tracking records';

-- Only admins can delete procedure tracking records
CREATE POLICY "procedure_tracking_admin_delete" ON procedure_tracking
  FOR DELETE
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "procedure_tracking_admin_delete" ON procedure_tracking IS 'Only admins can delete procedure tracking records';

-- ============================================================================
-- VERIFICATION QUERIES (for testing - comment out in production)
-- ============================================================================

-- To verify RLS is enabled on all tables:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- To verify all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- To test as different roles:
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claims = '{"sub": "user-uuid", "role": "authenticated"}';
