-- Índices para acelerar queries da listagem principal e do CRM

-- db_properties: filtros mais comuns
CREATE INDEX IF NOT EXISTS idx_db_properties_availability ON public.db_properties (availability);
CREATE INDEX IF NOT EXISTS idx_db_properties_broker_id ON public.db_properties (broker_id);
CREATE INDEX IF NOT EXISTS idx_db_properties_city ON public.db_properties (city);
CREATE INDEX IF NOT EXISTS idx_db_properties_state ON public.db_properties (state);
CREATE INDEX IF NOT EXISTS idx_db_properties_type ON public.db_properties (type);
CREATE INDEX IF NOT EXISTS idx_db_properties_status ON public.db_properties (status);
CREATE INDEX IF NOT EXISTS idx_db_properties_open_for_partnership ON public.db_properties (open_for_partnership) WHERE open_for_partnership = true;
CREATE INDEX IF NOT EXISTS idx_db_properties_slug ON public.db_properties (slug);

-- Composto para a query principal do Index (availability + ordenação)
CREATE INDEX IF NOT EXISTS idx_db_properties_avail_highlight_created
  ON public.db_properties (availability, is_highlight DESC, created_at DESC);

-- Range filters
CREATE INDEX IF NOT EXISTS idx_db_properties_price ON public.db_properties (price);
CREATE INDEX IF NOT EXISTS idx_db_properties_rental_price ON public.db_properties (rental_price);

-- brokers
CREATE INDEX IF NOT EXISTS idx_brokers_user_id ON public.brokers (user_id);
CREATE INDEX IF NOT EXISTS idx_brokers_slug ON public.brokers (slug);
CREATE INDEX IF NOT EXISTS idx_brokers_is_active ON public.brokers (is_active) WHERE is_active = true;

-- favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites (property_id);

-- property_views (analytics)
CREATE INDEX IF NOT EXISTS idx_property_views_property_id_created_at
  ON public.property_views (property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_views_created_at ON public.property_views (created_at DESC);

-- CRM tables (tudo segmentado por broker_id)
CREATE INDEX IF NOT EXISTS idx_broker_leads_broker_id ON public.broker_leads (broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_leads_status ON public.broker_leads (broker_id, status);
CREATE INDEX IF NOT EXISTS idx_broker_tasks_broker_id ON public.broker_tasks (broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_tasks_due_date ON public.broker_tasks (broker_id, due_date);
CREATE INDEX IF NOT EXISTS idx_broker_proposals_broker_id ON public.broker_proposals (broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_lead_interactions_lead_id ON public.broker_lead_interactions (lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_property_visits_broker_id ON public.lead_property_visits (broker_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_message_templates_broker_id ON public.message_templates (broker_id);

-- partnerships
CREATE INDEX IF NOT EXISTS idx_partnerships_property_id ON public.partnerships (property_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_owner ON public.partnerships (owner_broker_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_partner ON public.partnerships (partner_broker_id);

-- profiles / user_roles / subscriptions
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions (user_id, status);

-- broker_reviews
CREATE INDEX IF NOT EXISTS idx_broker_reviews_broker_id ON public.broker_reviews (broker_id);

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (is_published, published_at DESC) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);