-- Migration: Create public booking function and policy adjustments
-- Description: Allows anonymous website visitors to book appointments safely creating or matching patients
-- Requirements: 6.1, 6.2

CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_clinic_id UUID DEFAULT NULL,
  p_procedure_id UUID DEFAULT NULL,
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_duration_minutes INTEGER DEFAULT 30,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
  v_appointment_id UUID;
  v_effective_clinic_id UUID := p_clinic_id;
  v_effective_procedure_id UUID := p_procedure_id;
BEGIN
  -- Validate required inputs
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'El nombre completo es requerido';
  END IF;

  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RAISE EXCEPTION 'El número de teléfono es requerido';
  END IF;

  IF p_scheduled_at IS NULL THEN
    RAISE EXCEPTION 'La fecha y hora de la cita son requeridas';
  END IF;

  -- Default to first active clinic if not provided
  IF v_effective_clinic_id IS NULL THEN
    SELECT id INTO v_effective_clinic_id
    FROM clinics
    WHERE is_active = true AND is_deleted = false
    ORDER BY name ASC
    LIMIT 1;
  END IF;

  -- Check if patient exists by phone or email
  SELECT id INTO v_patient_id
  FROM patients
  WHERE phone = trim(p_phone)
     OR (p_email IS NOT NULL AND email = trim(lower(p_email)))
  LIMIT 1;

  -- If not found, create new patient record
  IF v_patient_id IS NULL THEN
    INSERT INTO patients (full_name, phone, email)
    VALUES (
      trim(p_full_name),
      trim(p_phone),
      CASE WHEN p_email IS NOT NULL AND trim(p_email) <> '' THEN trim(lower(p_email)) ELSE NULL END
    )
    RETURNING id INTO v_patient_id;
  END IF;

  -- Create appointment in pending status
  INSERT INTO appointments (
    patient_id,
    clinic_id,
    procedure_id,
    scheduled_at,
    duration_minutes,
    status,
    notes
  ) VALUES (
    v_patient_id,
    v_effective_clinic_id,
    v_effective_procedure_id,
    p_scheduled_at,
    COALESCE(p_duration_minutes, 30),
    'pending',
    COALESCE(p_notes, 'Reserva desde la página web')
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'patient_id', v_patient_id,
    'scheduled_at', p_scheduled_at
  );
END;
$$;

-- Grant execution to public anon and authenticated users
GRANT EXECUTE ON FUNCTION public.create_public_appointment TO anon, authenticated;

COMMENT ON FUNCTION public.create_public_appointment IS 'Allows public web visitors to request appointments with automatic patient deduplication/creation';
