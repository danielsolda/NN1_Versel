
-- Add cover_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create posts table for nutritionist "instagram-like" posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nutritionist_id uuid NOT NULL,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = nutritionist_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = nutritionist_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = nutritionist_id);

-- Create covers bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true) ON CONFLICT DO NOTHING;

-- Storage policies for covers
CREATE POLICY "Cover images are public" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload covers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update covers" ON storage.objects FOR UPDATE USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for posts
CREATE POLICY "Post images are public" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "Users can upload posts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update posts" ON storage.objects FOR UPDATE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete posts" ON storage.objects FOR DELETE USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);
