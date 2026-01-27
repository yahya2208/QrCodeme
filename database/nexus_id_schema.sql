-- ============================================
-- QR NEXUS - NEXUS ID: Living Digital Identity
-- Schema Update 3.0
-- ============================================

-- 1. NEXUS Identities Table (الحاوية الرئيسية)
CREATE TABLE IF NOT EXISTS nexus_identities (
    id TEXT PRIMARY KEY DEFAULT ('nx_' || substr(md5(random()::text), 1, 16)),
    display_name TEXT NOT NULL,
    profession_id TEXT REFERENCES categories(id),
    bio TEXT,
    theme_config JSONB DEFAULT '{
        "base_glow_intensity": 1.0,
        "pulse_speed": "normal",
        "spatial_depth": "deep"
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. NEXUS Identity Links (Nested QR / Elements)
CREATE TABLE IF NOT EXISTS nexus_identity_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id TEXT REFERENCES nexus_identities(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    target_url TEXT NOT NULL,
    link_type TEXT DEFAULT 'external', -- 'external', 'internal_qr'
    icon_type TEXT DEFAULT 'bolt',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. NEXUS Identity Scans (تتبع الدخول)
CREATE TABLE IF NOT EXISTS nexus_identity_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id TEXT REFERENCES nexus_identities(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_hash TEXT,
    user_agent TEXT,
    source TEXT DEFAULT 'qr_physical'
);

-- 4. NEXUS Activity Log (تتبع التفاعل النبضي)
CREATE TABLE IF NOT EXISTS nexus_identity_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identity_id TEXT REFERENCES nexus_identities(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'view', 'link_click', 'sub_qr_reveal'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & ANALYTICS
-- ============================================

-- Function: Get Pulse Intensity (Calculated Identity "Life" based on recent activity)
CREATE OR REPLACE FUNCTION get_identity_pulse(p_identity_id TEXT)
RETURNS FLOAT AS $$
DECLARE
    activity_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO activity_count 
    FROM nexus_identity_activity_log 
    WHERE identity_id = p_identity_id 
    AND created_at > (NOW() - INTERVAL '24 hours');
    
    -- Returns a value between 0.5 (dormant) and 2.0 (highly active/glowing)
    RETURN LEAST(2.0, 0.5 + (activity_count * 0.1));
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS POLICIES (Access via Backend Only)
-- ============================================
ALTER TABLE nexus_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_identity_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_identity_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_identity_activity_log ENABLE ROW LEVEL SECURITY;

-- Allow service role (Backend) full access
CREATE POLICY "Backend full access identities" ON nexus_identities FOR ALL USING (true);
CREATE POLICY "Backend full access identity_links" ON nexus_identity_links FOR ALL USING (true);
CREATE POLICY "Backend full access identity_scans" ON nexus_identity_scans FOR ALL USING (true);
CREATE POLICY "Backend full access activity_log" ON nexus_identity_activity_log FOR ALL USING (true);

-- Allow public read access (Required for the renderer)
CREATE POLICY "Public read identities" ON nexus_identities FOR SELECT USING (is_active = true);
CREATE POLICY "Public read links" ON nexus_identity_links FOR SELECT USING (true);
