
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-diary-photos', 'food-diary-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Patients can upload diary photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'food-diary-photos');

CREATE POLICY "Anyone can view diary photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'food-diary-photos');
