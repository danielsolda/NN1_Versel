DO $$
DECLARE
  source_uuid uuid := '0de45791-e60f-492f-bc0c-e803865bd5c5';
  auth_instance_id uuid;
BEGIN
  SELECT id INTO auth_instance_id
  FROM auth.instances
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = source_uuid
       OR lower(email) = 'contatodanielsolda@gmail.com'
  ) THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      auth_instance_id,
      source_uuid,
      'authenticated',
      'authenticated',
      'contatodanielsolda@gmail.com',
      extensions.crypt('123456', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Daniel Soldá","signup_role":"nutritionist"}'::jsonb,
      false,
      now(),
      now()
    );
  END IF;
END $$;