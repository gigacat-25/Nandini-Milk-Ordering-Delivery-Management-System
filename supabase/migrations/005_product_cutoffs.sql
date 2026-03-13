-- Add cutoff columns to products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS cutoff_morning NUMERIC(4, 1) DEFAULT 15.5, -- 3:30 PM (15.5)
ADD COLUMN IF NOT EXISTS cutoff_evening NUMERIC(4, 1) DEFAULT 19.5; -- 7:30 PM (19.5)

-- Update existing data to defaults just in case
UPDATE public.products SET cutoff_morning = 15.5, cutoff_evening = 19.5 WHERE cutoff_morning IS NULL;
