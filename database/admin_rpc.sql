-- ============================================
-- ADMIN CONTROLS: OVERVIEW STATS
-- ============================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_users', (SELECT COUNT(*) FROM users),
        'total_identities', (SELECT COUNT(*) FROM nexus_identities),
        'total_codes', (SELECT COUNT(*) FROM shops),
        'total_scans', (SELECT COALESCE(SUM(total_scans), 0) FROM shop_stats),
        'total_points', (SELECT COALESCE(SUM(total_points), 0) FROM user_points),
        'growth_data', (
            SELECT json_agg(growth) FROM (
                SELECT 
                    TO_CHAR(created_at, 'YYYY-MM-DD') as date,
                    COUNT(*) as count
                FROM nexus_identities
                GROUP BY date
                ORDER BY date DESC
                LIMIT 7
            ) growth
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
