
-- Allow nutritionists to update diary entries (for feedback)
CREATE POLICY "Nutritionists can update their patients diary entries"
  ON public.food_diary_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = food_diary_entries.patient_id
      AND patients.nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = food_diary_entries.patient_id
      AND patients.nutritionist_id = auth.uid()
    )
  );
