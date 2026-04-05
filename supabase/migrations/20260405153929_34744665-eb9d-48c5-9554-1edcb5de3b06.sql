DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

CREATE FUNCTION public.get_public_profile(_user_id uuid)
 RETURNS TABLE(display_name text, avatar_url text, bio text, phone text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT p.display_name, p.avatar_url, p.bio, p.phone
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;