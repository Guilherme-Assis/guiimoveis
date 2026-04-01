
-- Lead status enum
CREATE TYPE public.lead_status AS ENUM ('novo', 'em_contato', 'qualificado', 'proposta', 'fechado', 'perdido');

-- Lead priority enum  
CREATE TYPE public.lead_priority AS ENUM ('baixa', 'media', 'alta');

-- Lead source enum
CREATE TYPE public.lead_source AS ENUM ('site', 'indicacao', 'portais', 'redes_sociais', 'telefone', 'outro');

-- Interaction type enum
CREATE TYPE public.interaction_type AS ENUM ('ligacao', 'whatsapp', 'email', 'visita', 'reuniao', 'outro');

-- Broker leads table
CREATE TABLE public.broker_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  interest_value NUMERIC,
  installment_value NUMERIC,
  preferred_neighborhoods TEXT[],
  property_type_interest TEXT,
  source lead_source NOT NULL DEFAULT 'outro',
  status lead_status NOT NULL DEFAULT 'novo',
  priority lead_priority NOT NULL DEFAULT 'media',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_leads ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own leads
CREATE POLICY "Brokers can view own leads" ON public.broker_leads
FOR SELECT USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Admins can view all leads
CREATE POLICY "Admins can view all leads" ON public.broker_leads
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can create leads for themselves
CREATE POLICY "Brokers can create own leads" ON public.broker_leads
FOR INSERT WITH CHECK (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Brokers can update their own leads
CREATE POLICY "Brokers can update own leads" ON public.broker_leads
FOR UPDATE USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Brokers can delete their own leads
CREATE POLICY "Brokers can delete own leads" ON public.broker_leads
FOR DELETE USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Trigger for updated_at
CREATE TRIGGER update_broker_leads_updated_at
BEFORE UPDATE ON public.broker_leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Broker lead interactions table
CREATE TABLE public.broker_lead_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.broker_leads(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  type interaction_type NOT NULL DEFAULT 'outro',
  description TEXT NOT NULL,
  next_contact_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_lead_interactions ENABLE ROW LEVEL SECURITY;

-- Brokers can view their own interactions
CREATE POLICY "Brokers can view own interactions" ON public.broker_lead_interactions
FOR SELECT USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Admins can view all interactions
CREATE POLICY "Admins can view all interactions" ON public.broker_lead_interactions
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Brokers can create interactions
CREATE POLICY "Brokers can create own interactions" ON public.broker_lead_interactions
FOR INSERT WITH CHECK (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Brokers can update own interactions
CREATE POLICY "Brokers can update own interactions" ON public.broker_lead_interactions
FOR UPDATE USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Brokers can delete own interactions
CREATE POLICY "Brokers can delete own interactions" ON public.broker_lead_interactions
FOR DELETE USING (
  broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid())
);

-- Index for performance
CREATE INDEX idx_broker_leads_broker_id ON public.broker_leads(broker_id);
CREATE INDEX idx_broker_leads_status ON public.broker_leads(status);
CREATE INDEX idx_broker_lead_interactions_lead_id ON public.broker_lead_interactions(lead_id);
