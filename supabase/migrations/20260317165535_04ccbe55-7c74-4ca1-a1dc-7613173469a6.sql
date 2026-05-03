
-- Add address column to patients table
ALTER TABLE public.patients ADD COLUMN address text DEFAULT NULL;

-- Allow patients to update their own record (address, phone, etc.)
CREATE POLICY "Patients can update own patient record"
ON public.patients
FOR UPDATE
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());
