-- Migration: Row-Level Security (RLS) Policies
-- Description: Implements comprehensive RLS policies for multi-clinic access control
-- Requirements: 3.7, 3.8, 6.7, 17.1, 17.2, 17.3

-- ============================================================================
-- STEP 1: Enable RLS on all clinical and user tables
-- ============================================================================

ALTER TABLE clinics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_documents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_prices   ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create helper functions for role-based access control
-- ============================================================================

-- Function to get the role of the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION get_user_role() IS 'Returns the role of the currently authenticated user (admin, doctor, receptionist)';

-- Function to get the clinic_id of the currently authenticated user
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

COMMENT ON FUNCTION get_user_clinic_id() IS 'Returns the clinic_id assigned to the currently authenticated user';

-- Restrict execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic_id() TO authenticated;

-- ============================================================================
-- STEP 3: RLS Policies for CLINICS table
-- ============================================================================

DROP POLICY IF EXISTS "clinics_public_read" ON clinics;
CREATE POLICY "clinics_public_read" ON clinics
  FOR SELECT
  USING (true);

COMMENT ON POLICY "clinics_public_read" ON clinics IS 'Allows public read access to clinic information for appointment booking';

DROP POLICY IF EXISTS "clinics_admin_write" ON clinics;
CREATE POLICY "clinics_admin_write" ON clinics
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

COMMENT ON POLICY "clinics_admin_write" ON clinics IS 'Only admins can create, update, or delete clinic records';

-- ============================================================================
-- STEP 4: RLS Policies for PATIENTS table
-- ============================================================================

DROP POLICY IF EXISTS "patients_auth_read" ON patients;
CREATE POLICY "patients_auth_read" ON patients
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "patients_auth_read" ON patients IS 'All authenticated users can read patient records';

DROP POLICY IF EXISTS "patients_auth_write" ON patients;
CREATE POLICY "patients_auth_write" ON patients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "patients_auth_write" ON patients IS 'All authenticated users can manage patient records';

-- ============================================================================
-- STEP 5: RLS Policies for APPOINTMENTS table
-- ============================================================================

DROP POLICY IF EXISTS "appointments_public_insert" ON appointments;
CREATE POLICY "appointments_public_insert" ON appointments
  FOR INSERT
  WITH CHECK (status = 'pending');

COMMENT ON POLICY "appointments_public_insert" ON appointments IS 'Allows public appointment requests with pending status only';

DROP POLICY IF EXISTS "appointments_admin_all" ON appointments;
CREATE POLICY "appointments_admin_all" ON appointments
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

COMMENT ON POLICY "appointments_admin_all" ON appointments IS 'Admins have full access to all appointments across all clinics';

DROP POLICY IF EXISTS "appointments_clinic_read" ON appointments;
CREATE POLICY "appointments_clinic_read" ON appointments
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_read" ON appointments IS 'Doctors and receptionists can read appointments from their assigned clinic';

DROP POLICY IF EXISTS "appointments_clinic_write" ON appointments;
CREATE POLICY "appointments_clinic_write" ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  )
  WITH CHECK (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_write" ON appointments IS 'Doctors and receptionists can update appointments in their assigned clinic';

DROP POLICY IF EXISTS "appointments_clinic_insert" ON appointments;
CREATE POLICY "appointments_clinic_insert" ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_user_role() IN ('doctor', 'receptionist')
    AND clinic_id = get_user_clinic_id()
  );

COMMENT ON POLICY "appointments_clinic_insert" ON appointments IS 'Doctors and receptionists can create appointments for their assigned clinic';

-- ============================================================================
-- STEP 6: RLS Policies for MEDICAL_RECORDS table
-- ============================================================================

DROP POLICY IF EXISTS "medical_records_auth_read" ON medical_records;
CREATE POLICY "medical_records_auth_read" ON medical_records
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "medical_records_auth_read" ON medical_records IS 'All authenticated users can read medical records';

DROP POLICY IF EXISTS "medical_records_auth_insert" ON medical_records;
CREATE POLICY "medical_records_auth_insert" ON medical_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "medical_records_auth_insert" ON medical_records IS 'All authenticated users can create medical records';

DROP POLICY IF EXISTS "medical_records_creator_update" ON medical_records;
CREATE POLICY "medical_records_creator_update" ON medical_records
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR get_user_role() = 'admin')
  WITH CHECK (created_by = auth.uid() OR get_user_role() = 'admin');

COMMENT ON POLICY "medical_records_creator_update" ON medical_records IS 'Users can update their own medical records, admins can update any';

DROP POLICY IF EXISTS "medical_records_admin_delete" ON medical_records;
CREATE POLICY "medical_records_admin_delete" ON medical_records
  FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "medical_records_admin_delete" ON medical_records IS 'Only admins can delete medical records';

-- ============================================================================
-- STEP 7: RLS Policies for RECORD_DOCUMENTS table
-- ============================================================================

DROP POLICY IF EXISTS "record_documents_auth_read" ON record_documents;
CREATE POLICY "record_documents_auth_read" ON record_documents
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "record_documents_auth_read" ON record_documents IS 'All authenticated users can read record documents';

DROP POLICY IF EXISTS "record_documents_auth_insert" ON record_documents;
CREATE POLICY "record_documents_auth_insert" ON record_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "record_documents_auth_insert" ON record_documents IS 'All authenticated users can upload record documents';

DROP POLICY IF EXISTS "record_documents_auth_delete" ON record_documents;
CREATE POLICY "record_documents_auth_delete" ON record_documents
  FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON POLICY "record_documents_auth_delete" ON record_documents IS 'All authenticated users can delete record documents';

-- ============================================================================
-- STEP 8: RLS Policies for PROCEDURES table
-- ============================================================================

DROP POLICY IF EXISTS "procedures_public_read" ON procedures;
CREATE POLICY "procedures_public_read" ON procedures
  FOR SELECT
  USING (true);

COMMENT ON POLICY "procedures_public_read" ON procedures IS 'Allows public read access to procedure catalog for appointment booking';

DROP POLICY IF EXISTS "procedures_admin_write" ON procedures;
CREATE POLICY "procedures_admin_write" ON procedures
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

COMMENT ON POLICY "procedures_admin_write" ON procedures IS 'Only admins can create, update, or delete procedures';

-- ============================================================================
-- STEP 9: RLS Policies for PROCEDURE_PRICES table
-- ============================================================================

DROP POLICY IF EXISTS "procedure_prices_auth_read" ON procedure_prices;
CREATE POLICY "procedure_prices_auth_read" ON procedure_prices
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "procedure_prices_auth_read" ON procedure_prices IS 'All authenticated users can read procedure prices';

DROP POLICY IF EXISTS "procedure_prices_admin_write" ON procedure_prices;
CREATE POLICY "procedure_prices_admin_write" ON procedure_prices
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

COMMENT ON POLICY "procedure_prices_admin_write" ON procedure_prices IS 'Only admins can create, update, or delete procedure prices';

-- ============================================================================
-- STEP 10: RLS Policies for PROCEDURE_TRACKING table
-- ============================================================================

DROP POLICY IF EXISTS "procedure_tracking_auth_read" ON procedure_tracking;
CREATE POLICY "procedure_tracking_auth_read" ON procedure_tracking
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "procedure_tracking_auth_read" ON procedure_tracking IS 'All authenticated users can read procedure tracking records';

DROP POLICY IF EXISTS "procedure_tracking_auth_insert" ON procedure_tracking;
CREATE POLICY "procedure_tracking_auth_insert" ON procedure_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "procedure_tracking_auth_insert" ON procedure_tracking IS 'All authenticated users can create procedure tracking records';

DROP POLICY IF EXISTS "procedure_tracking_auth_update" ON procedure_tracking;
CREATE POLICY "procedure_tracking_auth_update" ON procedure_tracking
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMENT ON POLICY "procedure_tracking_auth_update" ON procedure_tracking IS 'All authenticated users can update procedure tracking records';

DROP POLICY IF EXISTS "procedure_tracking_admin_delete" ON procedure_tracking;
CREATE POLICY "procedure_tracking_admin_delete" ON procedure_tracking
  FOR DELETE
  TO authenticated
  USING (get_user_role() = 'admin');

COMMENT ON POLICY "procedure_tracking_admin_delete" ON procedure_tracking IS 'Only admins can delete procedure tracking records';

-- ============================================================================
-- STEP 11: RLS Policies for USERS table
-- ============================================================================

DROP POLICY IF EXISTS "users_read_own_or_admin" ON public.users;
CREATE POLICY "users_read_own_or_admin" ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin');

COMMENT ON POLICY "users_read_own_or_admin" ON public.users IS 'Users can read their own profile, admins can read all profiles';

DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR get_user_role() = 'admin')
  WITH CHECK (id = auth.uid() OR get_user_role() = 'admin');

COMMENT ON POLICY "users_update_own" ON public.users IS 'Users can update their own profile, admins can update any';

DROP POLICY IF EXISTS "users_admin_all" ON public.users;
CREATE POLICY "users_admin_all" ON public.users
  FOR ALL
  TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

COMMENT ON POLICY "users_admin_all" ON public.users IS 'Admins have full management privileges over user profiles';
