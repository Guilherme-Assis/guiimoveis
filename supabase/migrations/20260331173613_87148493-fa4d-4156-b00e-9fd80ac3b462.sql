
-- Fix profiles: restrict SELECT to own profile only
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service can view profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'admin')
);

-- Create public view for broker profile pages (excludes phone)
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT user_id, display_name, avatar_url, bio
  FROM public.profiles;

-- Allow anyone to read the public view by allowing select on the base with restricted columns
-- Actually, views with security_invoker need base table access. Let's use a function instead.
DROP VIEW IF EXISTS public.profiles_public;

-- Create a security definer function to get public profile info
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id UUID)
RETURNS TABLE(display_name TEXT, avatar_url TEXT, bio TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.avatar_url, p.bio
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;

-- Fix user_roles: restrict to own roles only
DROP POLICY IF EXISTS "Anyone can view roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix brokers: restrict to authenticated + only active, and create function for public access
DROP POLICY IF EXISTS "Anyone can view active brokers" ON public.brokers;
CREATE POLICY "Authenticated can view active brokers" ON public.brokers FOR SELECT TO authenticated USING (is_active = true);

-- Public function to get active broker info (excludes commission_rate)
CREATE OR REPLACE FUNCTION public.get_active_broker(_broker_id UUID)
RETURNS TABLE(id UUID, user_id UUID, creci TEXT, company_name TEXT, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.id, b.user_id, b.creci, b.company_name, b.is_active
  FROM public.brokers b
  WHERE b.id = _broker_id AND b.is_active = true
$$;

-- Admin can view all brokers including inactive
CREATE POLICY "Admins can view all brokers" ON public.brokers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
