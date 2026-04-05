
-- Partnership status enum
CREATE TYPE public.partnership_status AS ENUM ('pendente', 'aceita', 'ativa', 'concluida', 'recusada', 'cancelada');

-- Add open_for_partnership to db_properties
ALTER TABLE public.db_properties ADD COLUMN open_for_partnership boolean NOT NULL DEFAULT false;

-- Partnerships table
CREATE TABLE public.partnerships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.db_properties(id) ON DELETE CASCADE,
  owner_broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  partner_broker_id uuid NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  commission_split_owner numeric NOT NULL DEFAULT 50,
  commission_split_partner numeric NOT NULL DEFAULT 50,
  status partnership_status NOT NULL DEFAULT 'pendente',
  terms text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT different_brokers CHECK (owner_broker_id != partner_broker_id),
  CONSTRAINT valid_split CHECK (commission_split_owner + commission_split_partner = 100)
);

ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- Partnership transactions table
CREATE TABLE public.partnership_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id uuid NOT NULL REFERENCES public.partnerships(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.broker_leads(id) ON DELETE SET NULL,
  total_commission_value numeric NOT NULL,
  owner_amount numeric NOT NULL,
  partner_amount numeric NOT NULL,
  closed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partnership_transactions ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at on partnerships
CREATE TRIGGER update_partnerships_updated_at
  BEFORE UPDATE ON public.partnerships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: partnerships
-- SELECT: brokers see own partnerships, admins see all
CREATE POLICY "Brokers can view own partnerships" ON public.partnerships
  FOR SELECT TO authenticated
  USING (
    owner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
    OR partner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all partnerships" ON public.partnerships
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- INSERT: any broker can propose a partnership (as partner)
CREATE POLICY "Brokers can propose partnerships" ON public.partnerships
  FOR INSERT TO authenticated
  WITH CHECK (
    partner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create partnerships" ON public.partnerships
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- UPDATE: owner can accept/reject, partner can cancel own pending, admins can update any
CREATE POLICY "Owner broker can update partnership" ON public.partnerships
  FOR UPDATE TO authenticated
  USING (
    owner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
  );

CREATE POLICY "Partner broker can update own pending" ON public.partnerships
  FOR UPDATE TO authenticated
  USING (
    partner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
    AND status = 'pendente'
  );

CREATE POLICY "Admins can update any partnership" ON public.partnerships
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- DELETE: only admins
CREATE POLICY "Admins can delete partnerships" ON public.partnerships
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: partnership_transactions
CREATE POLICY "Brokers can view own transactions" ON public.partnership_transactions
  FOR SELECT TO authenticated
  USING (
    partnership_id IN (
      SELECT p.id FROM public.partnerships p
      WHERE p.owner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
         OR p.partner_broker_id IN (SELECT id FROM public.brokers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all transactions" ON public.partnership_transactions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create transactions" ON public.partnership_transactions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transactions" ON public.partnership_transactions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete transactions" ON public.partnership_transactions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
