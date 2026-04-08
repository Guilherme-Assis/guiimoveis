CREATE OR REPLACE FUNCTION public.get_property_partner_avatars(_property_id uuid)
RETURNS TABLE(display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.avatar_url
  FROM partnerships ps
  JOIN brokers b ON b.id = ps.partner_broker_id
  JOIN profiles p ON p.user_id = b.user_id
  WHERE ps.property_id = _property_id
    AND ps.status IN ('pendente', 'aceita', 'ativa')
  LIMIT 10
$$;