-- Migration 003: Partial Skips
-- Purpose: Admin can skip specific products from a day's delivery for a specific customer

CREATE TABLE IF NOT EXISTS public.partial_skips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skip_date DATE NOT NULL,
  target_id UUID NOT NULL, -- The subscription_id or order_id
  product_id UUID NOT NULL, -- The product being skipped
  UNIQUE(skip_date, target_id, product_id)
);

ALTER TABLE public.partial_skips DISABLE ROW LEVEL SECURITY;
GRANT ALL PRIVILEGES ON TABLE public.partial_skips TO anon, authenticated;
