-- Rename the nutritionist profile table to match the domain language used by the app.
ALTER TABLE public.profiles RENAME TO nutritionists;

ALTER TRIGGER update_profiles_updated_at ON public.nutritionists
RENAME TO update_nutritionists_updated_at;

CREATE OR REPLACE FUNCTION public.get_primary_nutritionist_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id
  FROM public.nutritionists
  ORDER BY created_at ASC
  LIMIT 1
$$;

DROP POLICY IF EXISTS "Patients can view their nutritionist profile" ON public.nutritionists;

CREATE POLICY "Patients can view their nutritionist profile"
ON public.nutritionists
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.auth_user_id = auth.uid()
      AND patients.nutritionist_id = nutritionists.user_id
  )
);