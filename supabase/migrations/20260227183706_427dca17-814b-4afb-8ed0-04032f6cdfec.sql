
-- Drop existing restrictive policies on catalog_products
DROP POLICY IF EXISTS "Users can read own catalog " ON public.catalog_products;
DROP POLICY IF EXISTS "Users can insert own catalog " ON public.catalog_products;
DROP POLICY IF EXISTS "Users can update own catalog " ON public.catalog_products;
DROP POLICY IF EXISTS "Users can delete own catalog " ON public.catalog_products;

-- All authenticated users can read the catalog
CREATE POLICY "All users can read catalog"
ON public.catalog_products
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert catalog"
ON public.catalog_products
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update catalog"
ON public.catalog_products
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete
CREATE POLICY "Admins can delete catalog"
ON public.catalog_products
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
