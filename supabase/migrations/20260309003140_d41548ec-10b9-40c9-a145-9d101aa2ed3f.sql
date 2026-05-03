-- Criar tabela de entradas do diário alimentar
CREATE TABLE public.food_diary_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL,
  description text NOT NULL,
  photo_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Adicionar foreign key para patients
ALTER TABLE public.food_diary_entries 
ADD CONSTRAINT food_diary_entries_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.food_diary_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pacientes verem suas próprias entradas
CREATE POLICY "Patients can view own diary entries" 
ON public.food_diary_entries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = food_diary_entries.patient_id 
  AND patients.auth_user_id = auth.uid()
));

CREATE POLICY "Patients can create own diary entries" 
ON public.food_diary_entries 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = food_diary_entries.patient_id 
  AND patients.auth_user_id = auth.uid()
));

CREATE POLICY "Patients can update own diary entries" 
ON public.food_diary_entries 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = food_diary_entries.patient_id 
  AND patients.auth_user_id = auth.uid()
));

CREATE POLICY "Patients can delete own diary entries" 
ON public.food_diary_entries 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = food_diary_entries.patient_id 
  AND patients.auth_user_id = auth.uid()
));

-- Políticas para nutricionistas verem entradas dos seus pacientes
CREATE POLICY "Nutritionists can view their patients diary entries" 
ON public.food_diary_entries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM patients 
  WHERE patients.id = food_diary_entries.patient_id 
  AND patients.nutritionist_id = auth.uid()
));

-- Trigger para updated_at
CREATE TRIGGER update_food_diary_entries_updated_at
BEFORE UPDATE ON public.food_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();