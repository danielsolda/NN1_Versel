
-- Allow patients to view meal plans assigned to them
CREATE POLICY "Patients can view own meal plans"
ON public.meal_plans
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = meal_plans.patient_id
    AND patients.auth_user_id = auth.uid()
  )
);

-- Allow patients to view their own appointments
CREATE POLICY "Patients can view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = appointments.patient_id
    AND patients.auth_user_id = auth.uid()
  )
);
