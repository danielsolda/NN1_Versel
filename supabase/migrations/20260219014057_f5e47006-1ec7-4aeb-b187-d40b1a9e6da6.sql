
-- Meal Plans
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id UUID NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Novo Plano Alimentar',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists manage own meal plans" ON public.meal_plans
  FOR ALL USING (auth.uid() = nutritionist_id)
  WITH CHECK (auth.uid() = nutritionist_id);

-- Meals (refeições: café da manhã, almoço, etc.)
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Nova Refeição',
  type TEXT NOT NULL DEFAULT 'qualitativa',
  time TEXT,
  location TEXT,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists manage meals via plan" ON public.meals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.meal_plans WHERE id = meal_plan_id AND nutritionist_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.meal_plans WHERE id = meal_plan_id AND nutritionist_id = auth.uid())
  );

-- Meal Options (opções dentro de cada refeição)
CREATE TABLE public.meal_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Nova Opção',
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.meal_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists manage meal options" ON public.meal_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_id AND mp.nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_id AND mp.nutritionist_id = auth.uid()
    )
  );

-- Food Items (alimentos dentro de cada opção)
CREATE TABLE public.meal_food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_option_id UUID NOT NULL REFERENCES public.meal_options(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  is_substitute BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0
);

ALTER TABLE public.meal_food_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists manage food items" ON public.meal_food_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meal_options mo
      JOIN public.meals m ON m.id = mo.meal_id
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE mo.id = meal_option_id AND mp.nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meal_options mo
      JOIN public.meals m ON m.id = mo.meal_id
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE mo.id = meal_option_id AND mp.nutritionist_id = auth.uid()
    )
  );

-- Meal Images
CREATE TABLE public.meal_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID NOT NULL REFERENCES public.meals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.meal_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutritionists manage meal images" ON public.meal_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_id AND mp.nutritionist_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meals m
      JOIN public.meal_plans mp ON mp.id = m.meal_plan_id
      WHERE m.id = meal_id AND mp.nutritionist_id = auth.uid()
    )
  );

-- Storage bucket for meal images
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-images', 'meal-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Nutritionists upload meal images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meal-images' AND auth.role() = 'authenticated');

CREATE POLICY "Meal images are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-images');

CREATE POLICY "Nutritionists delete own meal images" ON storage.objects
  FOR DELETE USING (bucket_id = 'meal-images' AND auth.role() = 'authenticated');

-- Timestamp trigger
CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON public.meal_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
