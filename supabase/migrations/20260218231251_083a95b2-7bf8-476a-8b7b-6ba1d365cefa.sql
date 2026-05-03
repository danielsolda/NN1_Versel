
-- Helper function
CREATE OR REPLACE FUNCTION public.is_nutritionist_owner(nutritionist_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() = nutritionist_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birthdate DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists can view own patients" ON public.patients FOR SELECT USING (is_nutritionist_owner(nutritionist_id));
CREATE POLICY "Nutritionists can insert own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "Nutritionists can update own patients" ON public.patients FOR UPDATE USING (is_nutritionist_owner(nutritionist_id));
CREATE POLICY "Nutritionists can delete own patients" ON public.patients FOR DELETE USING (is_nutritionist_owner(nutritionist_id));

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendada',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists can view own appointments" ON public.appointments FOR SELECT USING (is_nutritionist_owner(nutritionist_id));
CREATE POLICY "Nutritionists can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "Nutritionists can update own appointments" ON public.appointments FOR UPDATE USING (is_nutritionist_owner(nutritionist_id));
CREATE POLICY "Nutritionists can delete own appointments" ON public.appointments FOR DELETE USING (is_nutritionist_owner(nutritionist_id));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
