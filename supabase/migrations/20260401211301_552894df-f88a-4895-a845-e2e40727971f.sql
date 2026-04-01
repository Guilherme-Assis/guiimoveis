
CREATE TYPE public.template_category AS ENUM ('whatsapp', 'email');

CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category template_category NOT NULL DEFAULT 'whatsapp',
  stage TEXT NOT NULL DEFAULT '',
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Broker policies
CREATE POLICY "Brokers can view own templates" ON public.message_templates
  FOR SELECT TO authenticated
  USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

CREATE POLICY "Brokers can create own templates" ON public.message_templates
  FOR INSERT TO authenticated
  WITH CHECK (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

CREATE POLICY "Brokers can update own templates" ON public.message_templates
  FOR UPDATE TO authenticated
  USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

CREATE POLICY "Brokers can delete own templates" ON public.message_templates
  FOR DELETE TO authenticated
  USING (broker_id IN (SELECT id FROM brokers WHERE user_id = auth.uid()));

-- Admin policies
CREATE POLICY "Admins can view all templates" ON public.message_templates
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create templates" ON public.message_templates
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update any template" ON public.message_templates
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any template" ON public.message_templates
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
