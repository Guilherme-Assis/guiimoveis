
-- Fix broker_leads policies: drop public, recreate as authenticated
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND roles::text = '{public}'
      AND tablename IN ('broker_leads','broker_tasks','broker_proposals','broker_lead_interactions','lead_property_visits')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Also fix profiles insert policy
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;

-- Re-create all broker_leads policies for authenticated
CREATE POLICY "Admins can view all leads" ON public.broker_leads FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create leads" ON public.broker_leads FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any lead" ON public.broker_leads FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any lead" ON public.broker_leads FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can view own leads" ON public.broker_leads FOR SELECT TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can create own leads" ON public.broker_leads FOR INSERT TO authenticated WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can update own leads" ON public.broker_leads FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can delete own leads" ON public.broker_leads FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Re-create all broker_tasks policies for authenticated
CREATE POLICY "Admins can view all tasks" ON public.broker_tasks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create tasks" ON public.broker_tasks FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any task" ON public.broker_tasks FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any task" ON public.broker_tasks FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can view own tasks" ON public.broker_tasks FOR SELECT TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can create own tasks" ON public.broker_tasks FOR INSERT TO authenticated WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can update own tasks" ON public.broker_tasks FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can delete own tasks" ON public.broker_tasks FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Re-create all broker_proposals policies for authenticated
CREATE POLICY "Admins can view all proposals" ON public.broker_proposals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create proposals" ON public.broker_proposals FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any proposal" ON public.broker_proposals FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any proposal" ON public.broker_proposals FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can view own proposals" ON public.broker_proposals FOR SELECT TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can create own proposals" ON public.broker_proposals FOR INSERT TO authenticated WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can update own proposals" ON public.broker_proposals FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can delete own proposals" ON public.broker_proposals FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Re-create all broker_lead_interactions policies for authenticated
CREATE POLICY "Admins can view all interactions" ON public.broker_lead_interactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create interactions" ON public.broker_lead_interactions FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any interaction" ON public.broker_lead_interactions FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any interaction" ON public.broker_lead_interactions FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can view own interactions" ON public.broker_lead_interactions FOR SELECT TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can create own interactions" ON public.broker_lead_interactions FOR INSERT TO authenticated WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can update own interactions" ON public.broker_lead_interactions FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can delete own interactions" ON public.broker_lead_interactions FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Re-create all lead_property_visits policies for authenticated
CREATE POLICY "Admins can view all visits" ON public.lead_property_visits FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create visits" ON public.lead_property_visits FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update any visit" ON public.lead_property_visits FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any visit" ON public.lead_property_visits FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Brokers can view own visits" ON public.lead_property_visits FOR SELECT TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can create own visits" ON public.lead_property_visits FOR INSERT TO authenticated WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can update own visits" ON public.lead_property_visits FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
CREATE POLICY "Brokers can delete own visits" ON public.lead_property_visits FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Re-create profiles insert policy for authenticated
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
