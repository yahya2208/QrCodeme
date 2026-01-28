-- ============================================
-- COMPLETE STATS & CODES VISIBILITY FIX
-- ============================================
-- This script MUST be run in Supabase SQL Editor

-- 1. DROP ALL FUNCTION VERSIONS TO RESET
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_identity_codes(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_identity_total_stats(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_global_stats() CASCADE;
DROP FUNCTION IF EXISTS record_view(BIGINT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_view(BIGINT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS record_view(TEXT, TEXT) CASCADE;

-- 2. ENSURE TABLES EXIST
CREATE TABLE IF NOT EXISTS shop_stats (
    shop_id BIGINT PRIMARY KEY,
    total_scans BIGINT DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    last_view_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DISABLE ALL RLS (Critical for backend with anon key)
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_stats DISABLE ROW LEVEL SECURITY;

-- 4. FIX IDENTITY LINKING
DO $$ 
DECLARE 
    r RECORD;
    v_target_id TEXT;
BEGIN
    FOR r IN (SELECT DISTINCT user_id FROM shops WHERE user_id IS NOT NULL) LOOP
        SELECT id INTO v_target_id FROM nexus_identities WHERE user_id = r.user_id ORDER BY created_at DESC LIMIT 1;
        IF v_target_id IS NOT NULL THEN
            UPDATE shops SET identity_id = v_target_id WHERE user_id = r.user_id;
        END IF;
    END LOOP;
END $$;

-- 5. SYNC SHOP_STATS FOR ALL SHOPS
INSERT INTO shop_stats (shop_id, total_scans, total_views)
SELECT id, 0, 0 FROM shops
ON CONFLICT (shop_id) DO NOTHING;

-- 6. GET_IDENTITY_CODES: Returns codes WITH per-code stats
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
    v_owner_id UUID;
    v_owner_name TEXT;
BEGIN
    SELECT user_id, full_name INTO v_owner_id, v_owner_name 
    FROM nexus_identities WHERE nexus_identities.id = p_identity_id;

    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        COALESCE(cs.name, 'Service') AS service_name,
        COALESCE(cs.icon_svg, '') AS service_icon,
        COALESCE(cs.color, '#fff') AS service_color,
        s.name,
        s.value AS display_value,
        (p_viewer_id IS NOT NULL AND p_viewer_id = v_owner_id) AS is_owner,
        COALESCE(v_owner_name, 'Owner') AS owner_name,
        s.created_at,
        COALESCE(st.total_scans, 0)::BIGINT AS total_scans,
        COALESCE(st.total_views, 0)::BIGINT AS total_views
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    LEFT JOIN shop_stats st ON s.id = st.shop_id
    WHERE s.identity_id = p_identity_id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. GET_IDENTITY_TOTAL_STATS: Sum of all scans/views for a user
CREATE OR REPLACE FUNCTION get_identity_total_stats(p_identity_id TEXT)
RETURNS TABLE (total_reach BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COALESCE(SUM(st.total_scans + st.total_views), 0)::BIGINT
    FROM shops s
    LEFT JOIN shop_stats st ON s.id = st.shop_id
    WHERE s.identity_id = p_identity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. GET_GLOBAL_STATS: Platform-wide counters
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE(
    total_shops BIGINT,
    total_scans BIGINT,
    total_views BIGINT,
    total_identities BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT
        (SELECT COUNT(*) FROM shops)::BIGINT,
        (SELECT COALESCE(SUM(total_scans), 0) FROM shop_stats)::BIGINT,
        (SELECT COALESCE(SUM(total_views), 0) FROM shop_stats)::BIGINT,
        (SELECT COUNT(*) FROM nexus_identities)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RECORD_VIEW: Tracks each QR view
CREATE OR REPLACE FUNCTION record_view(p_shop_id BIGINT, p_source TEXT DEFAULT 'app')
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

-- 10. PERMISSIONS
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_identity_total_stats(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_global_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION record_view(BIGINT, TEXT) TO authenticated, anon;

NOTIFY pgrst, 'reload schema';

-- Verification: Run these manually to check data
-- SELECT * FROM shops LIMIT 5;
-- SELECT * FROM shop_stats LIMIT 5;
-- SELECT * FROM get_global_stats();
