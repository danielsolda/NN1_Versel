
CREATE TABLE public.patient_anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL,
  
  -- Histórico clínico e familiar
  previous_diseases TEXT,
  surgeries TEXT,
  family_history TEXT,
  current_medications TEXT,
  
  -- Hábitos de vida
  sleep_quality TEXT,
  exercise_routine TEXT,
  smoking TEXT,
  alcohol TEXT,
  daily_routine TEXT,
  
  -- Avaliação gastrointestinal
  bowel_function TEXT,
  digestive_symptoms TEXT,
  food_intolerances TEXT,
  
  -- Histórico alimentar
  food_preferences TEXT,
  food_aversions TEXT,
  previous_diets TEXT,
  dietary_recall TEXT,
  
  -- Observações gerais
  general_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(patient_id)
);

ALTER TABLE public.patient_anamnesis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists can manage anamnesis of own patients"
ON public.patient_anamnesis
FOR ALL
TO authenticated
USING (nutritionist_id = auth.uid())
WITH CHECK (nutritionist_id = auth.uid());

CREATE POLICY "Patients can view own anamnesis"
ON public.patient_anamnesis
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM patients
  WHERE patients.id = patient_anamnesis.patient_id
  AND patients.auth_user_id = auth.uid()
));

CREATE TRIGGER update_patient_anamnesis_updated_at
BEFORE UPDATE ON public.patient_anamnesis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
