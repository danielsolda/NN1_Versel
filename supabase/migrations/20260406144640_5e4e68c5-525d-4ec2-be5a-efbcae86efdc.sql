-- Add nutritionist_id to track custom foods
ALTER TABLE public.taco_foods ADD COLUMN nutritionist_id uuid DEFAULT NULL;

-- Allow nutritionists to insert custom foods
CREATE POLICY "Nutritionists can insert custom foods"
ON public.taco_foods
FOR INSERT
TO authenticated
WITH CHECK (nutritionist_id = auth.uid());

-- Allow nutritionists to update their own custom foods
CREATE POLICY "Nutritionists can update own custom foods"
ON public.taco_foods
FOR UPDATE
TO authenticated
USING (nutritionist_id = auth.uid())
WITH CHECK (nutritionist_id = auth.uid());

-- Allow nutritionists to delete their own custom foods
CREATE POLICY "Nutritionists can delete own custom foods"
ON public.taco_foods
FOR DELETE
TO authenticated
USING (nutritionist_id = auth.uid());