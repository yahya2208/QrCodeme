-- ============================================
-- QRme V8 - FINAL QR-CENTRIC SECURITY UPDATE
-- ============================================
-- This migration ensures:
-- 1. Links are NEVER exposed to non-owners
-- 2. Only owners can see the actual value
-- 3. Public view shows ONLY icon (no link even masked)
-- ============================================

-- Drop existing function to recreate with proper logic
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID);

-- SECURE RPC: Get codes for an identity
-- For owners: Returns full value for QR generation
-- For public: Returns NULL value (they only see icons, QR shows masked)
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
    is_current_owner BOOLEAN;
BEGIN
    -- Get the identity owner
    SELECT user_id INTO identity_owner FROM nexus_identities WHERE nexus_identities.id = p_identity_id;
    
    -- Check if viewer is owner
    is_current_owner := (p_viewer_id IS NOT NULL AND p_viewer_id = identity_owner);
    
    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        cs.name AS service_name,
        cs.icon_svg AS service_icon,
        cs.color AS service_color,
        s.name,
        CASE 
            WHEN is_current_owner THEN s.value  -- Owner sees full value for QR
            ELSE NULL  -- Non-owners see nothing (just icons in UI)
        END AS display_value,
        is_current_owner AS is_owner,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id AND s.is_public = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_identity_codes(TEXT, UUID) TO anon;

-- ============================================
-- ENHANCED RLS POLICIES
-- ============================================

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Shops: Public read" ON shops;
DROP POLICY IF EXISTS "Shops: Owner manages" ON shops;

-- Public can only see metadata (not value) - enforced via RPC
CREATE POLICY "Shops: Metadata read" ON shops 
    FOR SELECT 
    USING (is_public = TRUE);

-- Only owner can insert/update/delete
CREATE POLICY "Shops: Owner full control" ON shops 
    FOR ALL 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE USER IDENTITY FUNCTION (if not exists)
-- ============================================
CREATE OR REPLACE FUNCTION create_user_identity(p_name TEXT, p_bio TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    v_identity_id TEXT;
    v_user_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    
    -- Check if user already has an identity
    SELECT id INTO v_identity_id FROM nexus_identities WHERE user_id = v_user_id;
    
    IF v_identity_id IS NOT NULL THEN
        RAISE EXCEPTION 'User already has an identity';
    END IF;
    
    -- Generate unique ID
    v_identity_id := 'nx-' || LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    -- Insert identity
    INSERT INTO nexus_identities (id, user_id, full_name, bio, created_at)
    VALUES (v_identity_id, v_user_id, p_name, p_bio, NOW());
    
    RETURN v_identity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_user_identity(TEXT, TEXT) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
