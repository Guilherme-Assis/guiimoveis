
-- Fix db_properties write policies: change from public to authenticated role

-- Drop and recreate admin policies
DROP POLICY IF EXISTS "Admins can create any property" ON db_properties;
CREATE POLICY "Admins can create any property" ON db_properties FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete any property" ON db_properties;
CREATE POLICY "Admins can delete any property" ON db_properties FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update any property" ON db_properties;
CREATE POLICY "Admins can update any property" ON db_properties FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop and recreate broker policies
DROP POLICY IF EXISTS "Brokers can create properties" ON db_properties;
CREATE POLICY "Brokers can create properties" ON db_properties FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'broker'::app_role) AND broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Brokers can delete own properties" ON db_properties;
CREATE POLICY "Brokers can delete own properties" ON db_properties FOR DELETE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Brokers can update own properties" ON db_properties;
CREATE POLICY "Brokers can update own properties" ON db_properties FOR UPDATE TO authenticated USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));
