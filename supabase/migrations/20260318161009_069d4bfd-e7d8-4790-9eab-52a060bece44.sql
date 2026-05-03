
-- Create goal categories enum
CREATE TYPE public.goal_category AS ENUM ('peso', 'medida', 'habito', 'nutricional', 'outro');

-- Create goal status enum  
CREATE TYPE public.goal_status AS ENUM ('ativa', 'concluida', 'cancelada');

-- Create patient_goals table
CREATE TABLE public.patient_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nutritionist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category goal_category NOT NULL DEFAULT 'outro',
  status goal_status NOT NULL DEFAULT 'ativa',
  target_value TEXT,
  current_value TEXT,
  unit TEXT,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.patient_goals ENABLE ROW LEVEL SECURITY;

-- Nutritionists can manage goals for their patients
CREATE POLICY "Nutritionists can manage own patient goals"
  ON public.patient_goals FOR ALL
  TO authenticated
  USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

-- Patients can view their own goals
CREATE POLICY "Patients can view own goals"
  ON public.patient_goals FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_goals.patient_id
    AND patients.auth_user_id = auth.uid()
  ));

-- Updated_at trigger
CREATE TRIGGER update_patient_goals_updated_at
  BEFORE UPDATE ON public.patient_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
