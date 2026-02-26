
-- Create catalog_products table
CREATE TABLE public.catalog_products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  isbn TEXT NOT NULL DEFAULT '',
  editorial TEXT NOT NULL DEFAULT '',
  precio_costo_ars NUMERIC DEFAULT NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible',
  identificador_unico TEXT NOT NULL DEFAULT '',
  user_id UUID NOT NULL,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on identifier per user
CREATE UNIQUE INDEX idx_catalog_products_unique ON public.catalog_products (user_id, identificador_unico);

-- Create index for search
CREATE INDEX idx_catalog_products_search ON public.catalog_products USING gin (to_tsvector('spanish', titulo));
CREATE INDEX idx_catalog_products_isbn ON public.catalog_products (isbn);

-- Enable RLS
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read own catalog"
ON public.catalog_products FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own catalog"
ON public.catalog_products FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own catalog"
ON public.catalog_products FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete own catalog"
ON public.catalog_products FOR DELETE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
