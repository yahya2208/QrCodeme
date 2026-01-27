-- ============================================
-- QR NEXUS - ARCHITECTURE V3: Identity-First (Final Fix)
-- ============================================

-- 1. Create Identities table if not exists
CREATE TABLE IF NOT EXISTS nexus_identities (
    id TEXT PRIMARY KEY DEFAULT ('nx_' || substr(md5(random()::text), 1, 16)),
    display_name TEXT NOT NULL,
    profession_id TEXT DEFAULT 'other',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure Shops (Codes) are linked
ALTER TABLE shops ADD COLUMN IF NOT EXISTS identity_id TEXT REFERENCES nexus_identities(id) ON DELETE CASCADE;

-- 3. ARCHITECTURAL SYNC: Link all orphaned shops to a "Legacy Container" identity if needed
-- Or better: provide a function to claim orphan shops.
CREATE OR REPLACE FUNCTION claim_orphan_shops(p_identity_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE shops 
    SET identity_id = p_identity_id 
    WHERE identity_id IS NULL;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- 4. Mandatory Identity requirement function
CREATE OR REPLACE FUNCTION create_linked_shop(
    p_name TEXT,
    p_link TEXT,
    p_category_id TEXT,
    p_identity_id TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE(shop_id TEXT, qr_id TEXT) AS $$
DECLARE
    new_shop_id TEXT;
    new_qr_id TEXT;
BEGIN
    -- Verify identity exists
    IF NOT EXISTS (SELECT 1 FROM nexus_identities WHERE id = p_identity_id) THEN
        RAISE EXCEPTION 'Identity % does not exist. Every code MUST have a container.', p_identity_id;
    END IF;

    new_shop_id := 'shop_' || substr(md5(random()::text), 1, 12);
    new_qr_id := 'qr_' || substr(md5(random()::text), 1, 12);
    
    INSERT INTO shops (id, name, link, category_id, identity_id, description)
    VALUES (new_shop_id, p_name, p_link, p_category_id, p_identity_id, p_description);
    
    INSERT INTO qr_codes (id, shop_id, qr_content, qr_type)
    VALUES (new_qr_id, new_shop_id, 'qrnexus://' || new_shop_id, 'internal');
    
    INSERT INTO shop_stats (shop_id, total_scans, total_views)
    VALUES (new_shop_id, 0, 0);
    
    RETURN QUERY SELECT new_shop_id, new_qr_id;
END;
$$ LANGUAGE plpgsql;
