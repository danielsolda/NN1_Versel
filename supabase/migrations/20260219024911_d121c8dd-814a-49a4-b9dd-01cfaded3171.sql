
-- Create messages table for chat between nutritionist and patient
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_nutritionist_id UUID NOT NULL,
  conversation_patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Nutritionists can see messages from their own conversations
CREATE POLICY "Nutritionists can view own conversation messages"
ON public.messages FOR SELECT
USING (conversation_nutritionist_id = auth.uid());

-- Nutritionists can insert messages in their own conversations
CREATE POLICY "Nutritionists can send messages"
ON public.messages FOR INSERT
WITH CHECK (conversation_nutritionist_id = auth.uid() AND sender_user_id = auth.uid());

-- Patients can view messages from their conversation
CREATE POLICY "Patients can view own conversation messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = messages.conversation_patient_id
    AND patients.auth_user_id = auth.uid()
  )
);

-- Patients can send messages in their conversation
CREATE POLICY "Patients can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = messages.conversation_patient_id
    AND patients.auth_user_id = auth.uid()
  )
);

-- Nutritionists can update messages (mark as read)
CREATE POLICY "Nutritionists can update own messages"
ON public.messages FOR UPDATE
USING (conversation_nutritionist_id = auth.uid());

-- Patients can update messages (mark as read)
CREATE POLICY "Patients can update own messages"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = messages.conversation_patient_id
    AND patients.auth_user_id = auth.uid()
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Also add RLS policy so patients can view their nutritionist's posts
CREATE POLICY "Patients can view their nutritionist posts"
ON public.posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.auth_user_id = auth.uid()
    AND patients.nutritionist_id = posts.nutritionist_id
  )
);

-- Patients need to see their own patient record
CREATE POLICY "Patients can view own patient record"
ON public.patients FOR SELECT
USING (auth_user_id = auth.uid());
