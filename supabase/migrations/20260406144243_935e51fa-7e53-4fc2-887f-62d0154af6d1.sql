-- Create taco_foods table for API-backed Brazilian Food Composition data
CREATE TABLE public.taco_foods (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  calories NUMERIC,
  protein NUMERIC,
  carbs NUMERIC,
  fat NUMERIC,
  fiber NUMERIC,
  sodium NUMERIC
);

-- Create indexes for lookup and filtering
CREATE INDEX idx_taco_foods_description ON public.taco_foods USING gin(to_tsvector('portuguese', description));
CREATE INDEX idx_taco_foods_category ON public.taco_foods (category);

-- Allow authenticated users to read taco_foods
ALTER TABLE public.taco_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read taco_foods"
ON public.taco_foods
FOR SELECT
TO authenticated
USING (true);