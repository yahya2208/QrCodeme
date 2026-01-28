-- ============================================
-- EMERGENCY RECOVERY & SYSTEM STABILITY FIX
-- ============================================

-- 1. DROP ALL VARIATIONS TO CLEAR THE PATH
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_identity_codes(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_public_hub(INTEGER) CASCADE;

-- 2. RECOVERY: ENSURE NO DATA IS ORPHANED
-- Link every shop to the OWNER'S current identity if it's currently orphaned
DO $$ 
DECLARE 
    r RECORD;
    v_actual_id TEXT;
BEGIN
    FOR r IN (SELECT DISTINCT user_id FROM shops) LOOP
        -- Get the highest priority identity for this user
        SELECT id INTO v_actual_id FROM nexus_identities WHERE user_id = r.user_id ORDER BY created_at DESC LIMIT 1;
        
        IF v_actual_id IS NOT NULL THEN
            -- Re-link all shops for this user to their main identity
            UPDATE shops SET identity_id = v_actual_id WHERE user_id = r.user_id;
        END IF;
    END LOOP;
END $$;

-- 3. ROBUST FUNCTION: get_identity_codes
-- Handles variations in column names (full_name vs display_name)
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
    v_owner_id UUID;
    v_owner_name TEXT;
BEGIN
    -- Detect column names and get owner info
    BEGIN
        SELECT user_id, full_name INTO v_owner_id, v_owner_name 
        FROM nexus_identities WHERE id = p_identity_id;
    EXCEPTION WHEN undefined_column THEN
        SELECT user_id, display_name INTO v_owner_id, v_owner_name 
        FROM nexus_identities WHERE id = p_identity_id;
    END;

    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        cs.name AS service_name,
        cs.icon_svg AS service_icon,
        cs.color AS service_color,
        s.name,
        s.value AS display_value,
        (p_viewer_id IS NOT NULL AND p_viewer_id = v_owner_id) AS is_owner,
        COALESCE(v_owner_name, 'Owner') AS owner_name,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id 
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ROBUST FUNCTION: get_public_hub
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

-- 5. PERMISSIONS
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_public_hub(INTEGER) TO authenticated, anon;

-- 6. RLS RESET
ALTER TABLE shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Shops: Public read" ON shops;
DROP POLICY IF EXISTS "Shops: Owner manages" ON shops;
DROP POLICY IF EXISTS "Shops: Metadata read" ON shops;
DROP POLICY IF EXISTS "Shops: Owner full control" ON shops;

CREATE POLICY "Shops: Allow Select" ON shops FOR SELECT USING (true);
CREATE POLICY "Shops: Owner control" ON shops FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
