DROP POLICY IF EXISTS "Service can view profiles" ON public.profiles;
CREATE POLICY "Service can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));