
-- Task status enum
CREATE TYPE public.task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'cancelada');

-- Task type enum
CREATE TYPE public.task_type AS ENUM ('ligacao', 'visita', 'documento', 'reuniao', 'follow_up', 'outro');

-- Visit status enum
CREATE TYPE public.visit_status AS ENUM ('agendada', 'realizada', 'cancelada', 'no_show');

-- Proposal status enum
CREATE TYPE public.proposal_status AS ENUM ('rascunho', 'enviada', 'em_analise', 'aceita', 'recusada', 'expirada');

-- ═══════════════════════════════════════
-- BROKER TASKS
-- ═══════════════════════════════════════
CREATE TABLE public.broker_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.broker_leads(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL DEFAULT 'outro',
  status task_status NOT NULL DEFAULT 'pendente',
  priority lead_priority NOT NULL DEFAULT 'media',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own tasks" ON public.broker_tasks
FOR SELECT USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can view all tasks" ON public.broker_tasks
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can create own tasks" ON public.broker_tasks
FOR INSERT WITH CHECK (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can create tasks" ON public.broker_tasks
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can update own tasks" ON public.broker_tasks
FOR UPDATE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can update any task" ON public.broker_tasks
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can delete own tasks" ON public.broker_tasks
FOR DELETE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can delete any task" ON public.broker_tasks
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_broker_tasks_updated_at
BEFORE UPDATE ON public.broker_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_broker_tasks_broker_id ON public.broker_tasks(broker_id);
CREATE INDEX idx_broker_tasks_due_date ON public.broker_tasks(due_date);
CREATE INDEX idx_broker_tasks_status ON public.broker_tasks(status);

-- ═══════════════════════════════════════
-- LEAD PROPERTY VISITS
-- ═══════════════════════════════════════
CREATE TABLE public.lead_property_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.broker_leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.db_properties(id) ON DELETE CASCADE,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status visit_status NOT NULL DEFAULT 'agendada',
  feedback TEXT,
  interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_property_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own visits" ON public.lead_property_visits
FOR SELECT USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can view all visits" ON public.lead_property_visits
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can create own visits" ON public.lead_property_visits
FOR INSERT WITH CHECK (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can create visits" ON public.lead_property_visits
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can update own visits" ON public.lead_property_visits
FOR UPDATE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can update any visit" ON public.lead_property_visits
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can delete own visits" ON public.lead_property_visits
FOR DELETE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can delete any visit" ON public.lead_property_visits
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_lead_property_visits_updated_at
BEFORE UPDATE ON public.lead_property_visits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_lead_property_visits_broker_id ON public.lead_property_visits(broker_id);
CREATE INDEX idx_lead_property_visits_lead_id ON public.lead_property_visits(lead_id);
CREATE INDEX idx_lead_property_visits_visit_date ON public.lead_property_visits(visit_date);

-- ═══════════════════════════════════════
-- BROKER PROPOSALS
-- ═══════════════════════════════════════
CREATE TABLE public.broker_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES public.brokers(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.broker_leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.db_properties(id) ON DELETE CASCADE,
  proposed_value NUMERIC NOT NULL,
  counter_value NUMERIC,
  status proposal_status NOT NULL DEFAULT 'rascunho',
  conditions TEXT,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.broker_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brokers can view own proposals" ON public.broker_proposals
FOR SELECT USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can view all proposals" ON public.broker_proposals
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can create own proposals" ON public.broker_proposals
FOR INSERT WITH CHECK (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can create proposals" ON public.broker_proposals
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can update own proposals" ON public.broker_proposals
FOR UPDATE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can update any proposal" ON public.broker_proposals
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Brokers can delete own proposals" ON public.broker_proposals
FOR DELETE USING (broker_id IN (SELECT b.id FROM public.brokers b WHERE b.user_id = auth.uid()));

CREATE POLICY "Admins can delete any proposal" ON public.broker_proposals
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_broker_proposals_updated_at
BEFORE UPDATE ON public.broker_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_broker_proposals_broker_id ON public.broker_proposals(broker_id);
CREATE INDEX idx_broker_proposals_lead_id ON public.broker_proposals(lead_id);
CREATE INDEX idx_broker_proposals_status ON public.broker_proposals(status);
