-- View for properties assigned to brokers (owned or accepted proposal)
CREATE OR REPLACE VIEW public.broker_assigned_properties AS
SELECT DISTINCT
  p.*,
  bp.broker_id AS proposing_broker_id,
  bp.status AS proposal_status
FROM db_properties p
LEFT JOIN broker_proposals bp ON p.id = bp.property_id;

-- Grant access
GRANT SELECT ON public.broker_assigned_properties TO authenticated, anon;
