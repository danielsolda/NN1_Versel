-- Adicionar políticas RLS para pacientes verem as refeições dos seus planos

-- Política para pacientes verem meals dos seus planos
CREATE POLICY "Patients can view meals from their assigned plans" 
ON public.meals 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM meal_plans mp
  JOIN patients p ON p.id = mp.patient_id
  WHERE mp.id = meals.meal_plan_id 
  AND p.auth_user_id = auth.uid()
));

-- Política para pacientes verem meal_options das suas meals
CREATE POLICY "Patients can view meal options from their assigned plans" 
ON public.meal_options 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM meals m
  JOIN meal_plans mp ON mp.id = m.meal_plan_id
  JOIN patients p ON p.id = mp.patient_id
  WHERE m.id = meal_options.meal_id 
  AND p.auth_user_id = auth.uid()
));

-- Política para pacientes verem meal_food_items das suas meal_options
CREATE POLICY "Patients can view food items from their assigned plans" 
ON public.meal_food_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM meal_options mo
  JOIN meals m ON m.id = mo.meal_id
  JOIN meal_plans mp ON mp.id = m.meal_plan_id
  JOIN patients p ON p.id = mp.patient_id
  WHERE mo.id = meal_food_items.meal_option_id 
  AND p.auth_user_id = auth.uid()
));

-- Política para pacientes verem meal_images das suas meals
CREATE POLICY "Patients can view meal images from their assigned plans" 
ON public.meal_images 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM meals m
  JOIN meal_plans mp ON mp.id = m.meal_plan_id
  JOIN patients p ON p.id = mp.patient_id
  WHERE m.id = meal_images.meal_id 
  AND p.auth_user_id = auth.uid()
));