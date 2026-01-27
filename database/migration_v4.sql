-- ============================================
-- QR NEXUS - ARCHITECTURE V4: Multi-User & Ownership
-- ============================================

-- 1. Add owner_id to Identities and Shops
ALTER TABLE nexus_identities ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS owner_id TEXT;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_nexus_owner ON nexus_identities(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);

-- 2. Update RLS (Row Level Security)
-- Allow anyone to READ active identities
-- Only OWNERS can UPDATE/DELETE

ALTER TABLE nexus_identities ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view public identities
DROP POLICY IF EXISTS "Public Identities are viewable by everyone" ON nexus_identities;
CREATE POLICY "Public Identities are viewable by everyone" 
ON nexus_identities FOR SELECT 
USING (true);

-- Policy: Only owners can update their identities
DROP POLICY IF EXISTS "Owners can update their own identities" ON nexus_identities;
CREATE POLICY "Owners can update their own identities" 
ON nexus_identities FOR UPDATE 
USING (owner_id = auth.uid()::text OR owner_id IS NULL); -- IS NULL for transition period

-- 3. Function to fetch public exploration corridor
CREATE OR REPLACE FUNCTION get_public_hub(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id TEXT,
    display_name TEXT,
    profession_id TEXT,
    bio TEXT,
    owner_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT ni.id, ni.display_name, ni.profession_id, ni.bio, ni.owner_id, ni.created_at
    FROM nexus_identities ni
    ORDER BY ni.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 4. Unified Creation Function with Ownership
CREATE OR REPLACE FUNCTION create_protected_identity(
    p_name TEXT,
    p_bio TEXT,
    p_profession TEXT,
    p_owner_id TEXT
)
RETURNS TEXT AS $$
DECLARE
    new_id TEXT;
BEGIN
    new_id := 'nx_' || substr(md5(random()::text), 1, 16);
    
    INSERT INTO nexus_identities (id, display_name, bio, profession_id, owner_id)
    VALUES (new_id, p_name, p_bio, p_profession, p_owner_id);
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;
