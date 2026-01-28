-- ============================================
-- ENHANCED STATS SYSTEM: PER-CODE & IDENTITY TOTALS
-- ============================================

-- 1. Ensure shop_stats is ready
CREATE TABLE IF NOT EXISTS shop_stats (
    shop_id BIGINT PRIMARY KEY,
    total_scans BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    last_view_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update get_identity_codes to include per-code stats
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID);
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
    created_at TIMESTAMP WITH TIME ZONE,
    total_scans BIGINT,
    total_views BIGINT
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
        s.value AS display_value,
        (p_viewer_id IS NOT NULL AND p_viewer_id = v_identity_owner) AS is_owner,
        v_owner_name AS owner_name,
        s.created_at,
        COALESCE(st.total_scans, 0) AS total_scans,
        COALESCE(st.total_views, 0) AS total_views
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    LEFT JOIN shop_stats st ON s.id = st.shop_id
    WHERE s.identity_id = p_identity_id AND s.is_public = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get Total Engagement for an Identity
CREATE OR REPLACE FUNCTION get_identity_total_stats(p_identity_id TEXT)
RETURNS TABLE (
    total_reach BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(st.total_scans + st.total_views), 0)
    FROM shops s
    JOIN shop_stats st ON s.id = st.shop_id
    WHERE s.identity_id = p_identity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Robust record_view for BIGINT (Fixes the tracking issue)
CREATE OR REPLACE FUNCTION record_view(
    p_shop_id BIGINT,
    p_source TEXT DEFAULT 'app'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO shop_stats (shop_id, total_views, last_view_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_views = shop_stats.total_views + 1,
        last_view_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Permissions
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_identity_total_stats(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION record_view(BIGINT, TEXT) TO authenticated, anon;

-- Sync initial data again to be sure
INSERT INTO shop_stats (shop_id, total_scans, total_views)
SELECT id, 0, 0 FROM shops
ON CONFLICT (shop_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
