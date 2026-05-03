
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS height numeric,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS medical_conditions text;
