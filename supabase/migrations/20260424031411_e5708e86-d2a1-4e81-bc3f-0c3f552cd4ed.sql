CREATE OR REPLACE FUNCTION public.get_property_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total', (SELECT count(*) FROM db_properties WHERE availability = 'available'),
        'by_city', (
            SELECT jsonb_agg(city_stat)
            FROM (
                SELECT city, count(*) as count
                FROM db_properties
                WHERE availability = 'available'
                GROUP BY city
                ORDER BY count DESC
            ) city_stat
        ),
        'by_type', (
            SELECT jsonb_agg(type_stat)
            FROM (
                SELECT type, count(*) as count
                FROM db_properties
                WHERE availability = 'available'
                GROUP BY type
                ORDER BY count DESC
            ) type_stat
        )
    ) INTO result;
    
    RETURN result;
END;
$$;