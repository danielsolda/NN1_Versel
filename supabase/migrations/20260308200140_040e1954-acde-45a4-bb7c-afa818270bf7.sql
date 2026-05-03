CREATE POLICY "Patients can view their nutritionist profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.auth_user_id = auth.uid()
      AND patients.nutritionist_id = profiles.user_id
  )
);