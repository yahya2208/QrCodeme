-- ============================================
-- FIX: ALLOW PUBLIC VIEWING OF ALL CODES
-- ============================================

CREATE OR REPLACE FUNCTION get_identity_codes(p_identity_id TEXT, p_viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id BIGINT,
    service_id TEXT,
    service_name TEXT,
    service_icon TEXT,
    service_color TEXT,
    name TEXT,
    display_value TEXT,
    is_owner BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    identity_owner UUID;
BEGIN
    -- Get the identity owner
    SELECT user_id INTO identity_owner FROM nexus_identities WHERE nexus_identities.id = p_identity_id;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        cs.name AS service_name,
        cs.icon_svg AS service_icon,
        cs.color AS service_color,
        s.name,
        s.value AS display_value, -- Everyone sees the real value for QR generation
        (p_viewer_id IS NOT NULL AND p_viewer_id = identity_owner) AS is_owner,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id AND s.is_public = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions (just in case)
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO anon;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
