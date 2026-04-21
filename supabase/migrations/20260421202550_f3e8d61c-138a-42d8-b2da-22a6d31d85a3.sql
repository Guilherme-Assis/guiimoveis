DROP POLICY IF EXISTS "Anyone can record a view" ON public.property_views;
CREATE POLICY "Anyone can record a view"
ON public.property_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);