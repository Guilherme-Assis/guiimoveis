-- Add slug columns
ALTER TABLE public.brokers ADD COLUMN slug text UNIQUE;
ALTER TABLE public.db_properties ADD COLUMN slug text UNIQUE;

-- Create slug generation function
CREATE OR REPLACE FUNCTION public.generate_slug(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
DECLARE
  result text;
BEGIN
  result := lower(input);
  result := translate(result, 'àáâãäåèéêëìíîïòóôõöùúûüýñç', 'aaaaaaeeeeiiiioooooouuuuync');
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');
  result := regexp_replace(result, '\s+', '-', 'g');
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);
  RETURN result;
END;
$$;