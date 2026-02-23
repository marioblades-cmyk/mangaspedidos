
-- Create orders table
CREATE TABLE public.orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT '',
  precio_vendido NUMERIC,
  precio_regular NUMERIC,
  pago NUMERIC,
  saldo NUMERIC,
  numero TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT '',
  nota TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public access (personal app)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.orders FOR DELETE USING (true);
