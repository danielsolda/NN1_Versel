-- Return the nutritionist that should receive public patient signups.
CREATE OR REPLACE FUNCTION public.get_primary_nutritionist_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.profiles
  ORDER BY created_at ASC
  LIMIT 1
$$;

-- Public signups create a patient role and a patient record linked to the main nutritionist.
CREATE OR REPLACE FUNCTION public.assign_patient_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  primary_nutritionist_id UUID;
  patient_name TEXT;
  signup_role TEXT := coalesce(NEW.raw_user_meta_data->>'signup_role', '');
BEGIN
  IF signup_role IN ('', 'patient') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'patient')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  IF signup_role = 'patient'
     AND coalesce(NEW.raw_user_meta_data->>'is_patient', '') <> 'true' THEN
    primary_nutritionist_id := public.get_primary_nutritionist_id();

    IF primary_nutritionist_id IS NOT NULL THEN
      patient_name := coalesce(
        nullif(NEW.raw_user_meta_data->>'full_name', ''),
        nullif(NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        'Paciente'
      );

      INSERT INTO public.patients (nutritionist_id, name, email, auth_user_id)
      VALUES (primary_nutritionist_id, patient_name, NEW.email, NEW.id)
      ON CONFLICT (auth_user_id) DO UPDATE
        SET nutritionist_id = EXCLUDED.nutritionist_id,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Existing public signups without a patient record should be linked now.
INSERT INTO public.patients (nutritionist_id, name, email, auth_user_id)
SELECT
  primary_nutritionist_id,
  coalesce(
    nullif(au.raw_user_meta_data->>'full_name', ''),
    nullif(au.raw_user_meta_data->>'name', ''),
    au.email,
    'Paciente'
  ),
  au.email,
  au.id
FROM auth.users au
JOIN public.user_roles ur
  ON ur.user_id = au.id
 AND ur.role = 'patient'
CROSS JOIN LATERAL (SELECT public.get_primary_nutritionist_id() AS primary_nutritionist_id) default_nutritionist
LEFT JOIN public.patients p ON p.auth_user_id = au.id
WHERE p.id IS NULL
  AND default_nutritionist.primary_nutritionist_id IS NOT NULL
ON CONFLICT (auth_user_id) DO NOTHING;