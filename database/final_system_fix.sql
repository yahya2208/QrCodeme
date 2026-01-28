-- ============================================
-- FINAL SYSTEM FIX: OWNERSHIP, VISIBILITY, AND IDENTITY
-- ============================================

-- 0. DROP OLD SIGNATURES FIRST (Required to change return types)
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID);
DROP FUNCTION IF EXISTS get_public_hub(INTEGER);

-- 1. FIX: get_identity_codes (Allow everyone to see real values + include owner name)
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
    owner_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_identity_owner UUID;
    v_owner_name TEXT;
BEGIN
    -- Get the identity owner and name
    SELECT user_id, full_name INTO v_identity_owner, v_owner_name 
    FROM nexus_identities 
    WHERE nexus_identities.id = p_identity_id;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        cs.name AS service_name,
        cs.icon_svg AS service_icon,
        cs.color AS service_color,
        s.name,
        s.value AS display_value, -- Everyone sees the real value
        (p_viewer_id IS NOT NULL AND p_viewer_id = v_identity_owner) AS is_owner,
        v_owner_name AS owner_name,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id AND s.is_public = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FIX: get_public_hub (Ensure it returns data for the corridor)
CREATE OR REPLACE FUNCTION get_public_hub(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id TEXT,
    full_name TEXT,
    bio TEXT,
    codes_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        ni.id, 
        ni.full_name, 
        ni.bio, 
        (SELECT COUNT(*) FROM shops WHERE identity_id = ni.id) AS codes_count,
        ni.created_at
    FROM nexus_identities ni 
    WHERE ni.full_name IS NOT NULL
    ORDER BY ni.created_at DESC 
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE PERMISSIONS
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_public_hub(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_hub(INTEGER) TO anon;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
