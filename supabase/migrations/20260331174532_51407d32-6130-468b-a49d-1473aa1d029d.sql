-- Lookup broker by slug (public)
CREATE OR REPLACE FUNCTION public.get_broker_by_slug(_slug text)
RETURNS TABLE(id uuid, user_id uuid, creci text, company_name text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT b.id, b.user_id, b.creci, b.company_name, b.is_active
  FROM public.brokers b
  WHERE b.slug = _slug AND b.is_active = true
$$;

-- Lookup property by slug (public)
CREATE OR REPLACE FUNCTION public.get_property_by_slug(_slug text)
RETURNS TABLE(
  id uuid, title text, type property_type, status property_status,
  availability property_availability, price numeric, location text, city text,
  state text, bedrooms int, bathrooms int, parking_spaces int, area numeric,
  land_area numeric, description text, features text[], image_url text,
  images text[], is_highlight boolean, broker_id uuid, slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.title, p.type, p.status, p.availability, p.price,
         p.location, p.city, p.state, p.bedrooms, p.bathrooms,
         p.parking_spaces, p.area, p.land_area, p.description,
         p.features, p.image_url, p.images, p.is_highlight, p.broker_id, p.slug
  FROM public.db_properties p
  WHERE p.slug = _slug AND p.availability = 'available'
$$;