-- Delivery confirmation photos
CREATE TABLE IF NOT EXISTS public.delivery_photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    delivery_type text NOT NULL CHECK (delivery_type IN ('order', 'subscription')),
    target_id uuid NOT NULL,
    delivery_date date NOT NULL,
    photo_url text NOT NULL,
    uploaded_at timestamptz DEFAULT now()
);

-- Explicitly grant access to the Supabase API roles
GRANT ALL ON TABLE public.delivery_photos TO anon, authenticated, service_role;

-- Disable RLS on this table to ensure the delivery driver client can insert records without being blocked
ALTER TABLE public.delivery_photos DISABLE ROW LEVEL SECURITY;

-- Storage bucket (run after creating the bucket in Supabase dashboard)
-- Bucket name: delivery-photos  (public)
-- The policies below assume the bucket already exists.
INSERT INTO storage.buckets (id, name, public)
VALUES ('delivery-photos', 'delivery-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "delivery_photos_storage_upload" ON storage.objects;
DROP POLICY IF EXISTS "delivery_photos_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "delivery_photos_storage_all" ON storage.objects;

-- Allow all storage operations for this bucket (handles upsert, delete, insert)
CREATE POLICY "delivery_photos_storage_all"
ON storage.objects FOR ALL
TO public
USING (bucket_id = 'delivery-photos')
WITH CHECK (bucket_id = 'delivery-photos');
