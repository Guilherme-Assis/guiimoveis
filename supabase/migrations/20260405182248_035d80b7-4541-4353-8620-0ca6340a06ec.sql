
DROP FUNCTION IF EXISTS public.get_property_by_slug(text);

CREATE FUNCTION public.get_property_by_slug(_slug text)
 RETURNS TABLE(id uuid, title text, type property_type, status property_status, availability property_availability, price numeric, location text, city text, state text, bedrooms integer, bathrooms integer, parking_spaces integer, area numeric, land_area numeric, description text, features text[], image_url text, images text[], is_highlight boolean, broker_id uuid, slug text, latitude numeric, longitude numeric, virtual_tour_url text, rental_price numeric, condominium_fee numeric, iptu numeric, min_contract_months integer, accepts_pets boolean, furnished boolean, available_from date, neighborhood_data jsonb, open_for_partnership boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT p.id, p.title, p.type, p.status, p.availability, p.price,
         p.location, p.city, p.state, p.bedrooms, p.bathrooms,
         p.parking_spaces, p.area, p.land_area, p.description,
         p.features, p.image_url, p.images, p.is_highlight, p.broker_id, p.slug,
         p.latitude, p.longitude, p.virtual_tour_url,
         p.rental_price, p.condominium_fee, p.iptu,
         p.min_contract_months, p.accepts_pets, p.furnished, p.available_from,
         p.neighborhood_data, p.open_for_partnership
  FROM public.db_properties p
  WHERE (p.slug = _slug OR p.id::text = _slug) AND p.availability = 'available'
  LIMIT 1
$function$;
