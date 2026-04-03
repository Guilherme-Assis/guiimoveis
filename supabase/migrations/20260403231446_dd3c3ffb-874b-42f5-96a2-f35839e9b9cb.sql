
-- Fix 1: broker_reviews - restrict SELECT to authenticated only (prevents user UUID leakage to anonymous users)
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.broker_reviews;
CREATE POLICY "Authenticated can view reviews"
  ON public.broker_reviews
  FOR SELECT
  TO authenticated
  USING (true);

-- Fix 2: Change brokers INSERT/DELETE/UPDATE policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Admins can create brokers" ON public.brokers;
CREATE POLICY "Admins can create brokers"
  ON public.brokers
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete brokers" ON public.brokers;
CREATE POLICY "Admins can delete brokers"
  ON public.brokers
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update any broker" ON public.brokers;
CREATE POLICY "Admins can update any broker"
  ON public.brokers
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Brokers can update own record" ON public.brokers;
CREATE POLICY "Brokers can update own record"
  ON public.brokers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
