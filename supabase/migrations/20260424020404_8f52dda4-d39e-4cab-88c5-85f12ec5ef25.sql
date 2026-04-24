-- Function to get properties for a broker including those with accepted proposals
CREATE OR REPLACE FUNCTION public.get_broker_properties_with_proposals(_broker_id uuid)
RETURNS SETOF public.db_properties
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.*
  FROM db_properties p
  LEFT JOIN broker_proposals bp ON p.id = bp.property_id
  WHERE (p.broker_id = _broker_id OR (bp.broker_id = _broker_id AND bp.status = 'aceita'))
  AND p.availability = 'available'
  ORDER BY p.is_highlight DESC, p.created_at DESC;
$$;

-- Grant access to authenticated and anon users (since it's used in public profiles)
GRANT EXECUTE ON FUNCTION public.get_broker_properties_with_proposals(uuid) TO authenticated, anon;
