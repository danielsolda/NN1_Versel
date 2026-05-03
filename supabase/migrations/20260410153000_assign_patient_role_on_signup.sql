-- Assign the default patient role when a user signs up through the public site.
CREATE OR REPLACE FUNCTION public.assign_patient_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_patient_role ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_patient_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_patient_role_on_signup();

-- If a profile is created, the user should be treated as a nutritionist instead.
CREATE OR REPLACE FUNCTION public.assign_nutritionist_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles
  WHERE user_id = NEW.user_id
    AND role = 'patient';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'nutritionist')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill users without a role as patients so older signups behave correctly.
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'patient'
FROM auth.users au
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;