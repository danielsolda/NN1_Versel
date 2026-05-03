
-- 1. Create recipes table
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nutritionist_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prep_time TEXT,
  servings TEXT,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- 2. Create recipe_ingredients table
CREATE TABLE public.recipe_ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- 3. Add recipe_id to meal_options
ALTER TABLE public.meal_options ADD COLUMN recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL;

-- 4. Policies for recipes
CREATE POLICY "Nutritionists manage own recipes"
  ON public.recipes FOR ALL
  TO authenticated
  USING (nutritionist_id = auth.uid())
  WITH CHECK (nutritionist_id = auth.uid());

CREATE POLICY "Patients can view recipes linked to their plans"
  ON public.recipes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM meal_options mo
    JOIN meals m ON m.id = mo.meal_id
    JOIN meal_plans mp ON mp.id = m.meal_plan_id
    JOIN patients p ON p.id = mp.patient_id
    WHERE mo.recipe_id = recipes.id AND p.auth_user_id = auth.uid()
  ));

-- 5. Policies for recipe_ingredients
CREATE POLICY "Nutritionists manage recipe ingredients"
  ON public.recipe_ingredients FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id AND r.nutritionist_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id AND r.nutritionist_id = auth.uid()
  ));

CREATE POLICY "Patients can view recipe ingredients from their plans"
  ON public.recipe_ingredients FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM recipes r
    JOIN meal_options mo ON mo.recipe_id = r.id
    JOIN meals m ON m.id = mo.meal_id
    JOIN meal_plans mp ON mp.id = m.meal_plan_id
    JOIN patients p ON p.id = mp.patient_id
    WHERE r.id = recipe_ingredients.recipe_id AND p.auth_user_id = auth.uid()
  ));

-- 6. Trigger for updated_at
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
