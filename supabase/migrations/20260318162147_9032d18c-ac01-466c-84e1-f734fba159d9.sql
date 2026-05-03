
-- Allow patients to insert appointment requests for themselves
CREATE POLICY "Patients can request appointments"
  ON public.appointments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = appointments.patient_id
      AND patients.auth_user_id = auth.uid()
      AND patients.nutritionist_id = appointments.nutritionist_id
    )
  );
