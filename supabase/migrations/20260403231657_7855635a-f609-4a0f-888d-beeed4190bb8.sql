
-- Create property_views table for analytics
CREATE TABLE public.property_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.db_properties(id) ON DELETE CASCADE,
  user_id uuid,
  session_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can insert a view
CREATE POLICY "Anyone can record a view"
  ON public.property_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can view all analytics
CREATE POLICY "Admins can view all property views"
  ON public.property_views
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can view analytics for their own properties
CREATE POLICY "Brokers can view own property analytics"
  ON public.property_views
  FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT dp.id FROM db_properties dp
      WHERE dp.broker_id IN (
        SELECT b.id FROM brokers b WHERE b.user_id = auth.uid()
      )
    )
  );

-- Index for fast queries
CREATE INDEX idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX idx_property_views_created_at ON public.property_views(created_at);

-- Create a function to get view counts per property
CREATE OR REPLACE FUNCTION public.get_property_view_counts(days_back integer DEFAULT 30)
RETURNS TABLE(property_id uuid, view_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT property_id, count(*) as view_count
  FROM property_views
  WHERE created_at >= now() - (days_back || ' days')::interval
  GROUP BY property_id
  ORDER BY view_count DESC;
$$;
