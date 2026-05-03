DO $$
DECLARE
  source_uuid uuid := '0de45791-e60f-492f-bc0c-e803865bd5c5';
  target_uuid uuid;
BEGIN
  SELECT id
  INTO target_uuid
  FROM auth.users
  WHERE lower(email) = 'contatodanielsolda@gmail.com'
  LIMIT 1;

  IF target_uuid IS NULL OR target_uuid = source_uuid THEN
    RAISE NOTICE 'Daniel Soldá auth user not found or already aligned.';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  SELECT target_uuid, role
  FROM public.user_roles
  WHERE user_id = source_uuid
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.nutritionists (
    user_id,
    full_name,
    phone,
    crn,
    specialty,
    avatar_url,
    cover_url,
    bio,
    created_at,
    updated_at
  )
  SELECT
    target_uuid,
    full_name,
    phone,
    crn,
    specialty,
    avatar_url,
    cover_url,
    bio,
    created_at,
    updated_at
  FROM public.nutritionists
  WHERE user_id = source_uuid
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    crn = EXCLUDED.crn,
    specialty = EXCLUDED.specialty,
    avatar_url = EXCLUDED.avatar_url,
    cover_url = EXCLUDED.cover_url,
    bio = EXCLUDED.bio,
    updated_at = now();

  UPDATE public.patients
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.meal_plans
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.appointments
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.patient_goals
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.posts
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.recipes
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  UPDATE public.taco_foods
  SET nutritionist_id = target_uuid
  WHERE nutritionist_id = source_uuid;

  DELETE FROM public.user_roles
  WHERE user_id = source_uuid;

  DELETE FROM public.nutritionists
  WHERE user_id = source_uuid;
END $$;