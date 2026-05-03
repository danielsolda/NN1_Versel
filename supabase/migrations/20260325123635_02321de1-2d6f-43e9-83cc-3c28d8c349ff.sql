
CREATE TABLE public.goal_daily_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES public.patient_goals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  check_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (goal_id, check_date)
);

ALTER TABLE public.goal_daily_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can manage own goal checks"
  ON public.goal_daily_checks
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = goal_daily_checks.patient_id AND patients.auth_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = goal_daily_checks.patient_id AND patients.auth_user_id = auth.uid()
  ));

CREATE POLICY "Nutritionists can view patient goal checks"
  ON public.goal_daily_checks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM patients WHERE patients.id = goal_daily_checks.patient_id AND patients.nutritionist_id = auth.uid()
  ));
