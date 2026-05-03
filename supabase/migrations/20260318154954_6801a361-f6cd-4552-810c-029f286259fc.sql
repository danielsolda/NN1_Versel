ALTER TABLE public.food_diary_entries 
  ADD COLUMN nutritionist_feedback text DEFAULT NULL,
  ADD COLUMN feedback_at timestamp with time zone DEFAULT NULL;