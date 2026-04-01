
-- Admin INSERT policy for broker_leads
CREATE POLICY "Admins can create leads" ON public.broker_leads
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin UPDATE policy for broker_leads
CREATE POLICY "Admins can update any lead" ON public.broker_leads
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin DELETE policy for broker_leads
CREATE POLICY "Admins can delete any lead" ON public.broker_leads
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin INSERT policy for broker_lead_interactions
CREATE POLICY "Admins can create interactions" ON public.broker_lead_interactions
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin UPDATE policy for broker_lead_interactions
CREATE POLICY "Admins can update any interaction" ON public.broker_lead_interactions
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin DELETE policy for broker_lead_interactions
CREATE POLICY "Admins can delete any interaction" ON public.broker_lead_interactions
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
