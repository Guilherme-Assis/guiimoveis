
CREATE OR REPLACE FUNCTION public.get_active_brokers_list()
RETURNS TABLE(
  broker_id uuid,
  user_id uuid,
  creci text,
  company_name text,
  slug text,
  display_name text,
  avatar_url text,
  bio text,
  phone text,
  partnership_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    b.id as broker_id,
    b.user_id,
    b.creci,
    b.company_name,
    b.slug,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.phone,
    (SELECT count(*) FROM db_properties dp WHERE dp.broker_id = b.id AND dp.open_for_partnership = true AND dp.availability = 'available') as partnership_count
  FROM brokers b
  LEFT JOIN profiles p ON p.user_id = b.user_id
  WHERE b.is_active = true
  ORDER BY partnership_count DESC, p.display_name ASC
$$;
