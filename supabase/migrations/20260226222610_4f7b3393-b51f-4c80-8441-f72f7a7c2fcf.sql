
-- Add estado_publicacion column for publication status (En curso / Completo / Tomo Único)
ALTER TABLE public.catalog_products 
ADD COLUMN IF NOT EXISTS estado_publicacion text NOT NULL DEFAULT 'En curso';
