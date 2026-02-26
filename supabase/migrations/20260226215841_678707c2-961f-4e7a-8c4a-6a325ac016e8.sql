
-- Add tomo column to catalog_products
ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS tomo TEXT NOT NULL DEFAULT '';
