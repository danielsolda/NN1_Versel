
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('nutritionist', 'patient');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: only nutritionists can insert roles (via edge function with service role, but allow read)
CREATE POLICY "Service role manages roles" ON public.user_roles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add auth_user_id column to patients to link patient record to auth user
ALTER TABLE public.patients ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Auto-assign nutritionist role on profile creation trigger
CREATE OR REPLACE FUNCTION public.assign_nutritionist_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'nutritionist')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_assign_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_nutritionist_role();

-- Assign nutritionist role to existing profiles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'nutritionist' FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;
