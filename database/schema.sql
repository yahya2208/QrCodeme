-- ============================================
-- QR NEXUS - Complete Supabase Database Schema
-- Version: 2.0 - Full Cloud Architecture
-- ============================================
-- IMPORTANT: Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CATEGORIES TABLE (المهن / التصنيفات)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (id, name_ar, name_en, icon, sort_order) VALUES
    ('pharmacy', 'صيدلية', 'Pharmacy', '💊', 1),
    ('phones', 'هواتف', 'Phones', '📱', 2),
    ('restaurant', 'مطعم', 'Restaurant', '🍽️', 3),
    ('cafe', 'مقهى', 'Cafe', '☕', 4),
    ('maintenance', 'صيانة', 'Maintenance', '🔧', 5),
    ('fashion', 'أزياء', 'Fashion', '👔', 6),
    ('services', 'خدمات', 'Services', '⚡', 7),
    ('other', 'أخرى', 'Other', '🏪', 8)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. SHOPS TABLE (المحلات)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
    id TEXT PRIMARY KEY DEFAULT ('shop_' || substr(md5(random()::text), 1, 12)),
    name TEXT NOT NULL,
    link TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster category queries
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_created ON shops(created_at DESC);

-- ============================================
-- 3. QR_CODES TABLE (الأكواد المُنشأة)
-- ============================================
CREATE TABLE IF NOT EXISTS qr_codes (
    id TEXT PRIMARY KEY DEFAULT ('qr_' || substr(md5(random()::text), 1, 12)),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    qr_content TEXT NOT NULL,          -- The encoded content
    qr_type TEXT DEFAULT 'internal',   -- 'internal' or 'external'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster shop lookup
CREATE INDEX IF NOT EXISTS idx_qrcodes_shop ON qr_codes(shop_id);

-- ============================================
-- 4. SCANS TABLE (كل مسحة QR)
-- ============================================
CREATE TABLE IF NOT EXISTS scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id TEXT NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'app',         -- 'app', 'web', 'external'
    ip_hash TEXT,                       -- Hashed for privacy
    user_agent TEXT,
    country TEXT,
    city TEXT
);

-- Indexes for analytics
CREATE INDEX IF NOT EXISTS idx_scans_qrcode ON scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scans_shop ON scans(shop_id);
CREATE INDEX IF NOT EXISTS idx_scans_time ON scans(scanned_at DESC);

-- ============================================
-- 5. VIEWS TABLE (مشاهدات صفحة المحل)
-- ============================================
CREATE TABLE IF NOT EXISTS views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id TEXT NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT DEFAULT 'app',
    ip_hash TEXT,
    user_agent TEXT
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_views_shop ON views(shop_id);
CREATE INDEX IF NOT EXISTS idx_views_time ON views(viewed_at DESC);

-- ============================================
-- 6. STATS TABLE (إحصائيات مجمعة - للأداء)
-- ============================================
CREATE TABLE IF NOT EXISTS shop_stats (
    shop_id TEXT PRIMARY KEY REFERENCES shops(id) ON DELETE CASCADE,
    total_scans INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    last_scan_at TIMESTAMP WITH TIME ZONE,
    last_view_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Record a scan and update stats
CREATE OR REPLACE FUNCTION record_scan(
    p_qr_code_id TEXT,
    p_shop_id TEXT,
    p_source TEXT DEFAULT 'app',
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_scan_id UUID;
BEGIN
    -- Insert scan record
    INSERT INTO scans (qr_code_id, shop_id, source, ip_hash, user_agent)
    VALUES (p_qr_code_id, p_shop_id, p_source, p_ip_hash, p_user_agent)
    RETURNING id INTO new_scan_id;
    
    -- Update or insert stats
    INSERT INTO shop_stats (shop_id, total_scans, last_scan_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_scans = shop_stats.total_scans + 1,
        last_scan_at = NOW(),
        updated_at = NOW();
    
    RETURN new_scan_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Record a view and update stats
CREATE OR REPLACE FUNCTION record_view(
    p_shop_id TEXT,
    p_source TEXT DEFAULT 'app',
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_view_id UUID;
BEGIN
    -- Insert view record
    INSERT INTO views (shop_id, source, ip_hash, user_agent)
    VALUES (p_shop_id, p_source, p_ip_hash, p_user_agent)
    RETURNING id INTO new_view_id;
    
    -- Update or insert stats
    INSERT INTO shop_stats (shop_id, total_views, last_view_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_views = shop_stats.total_views + 1,
        last_view_at = NOW(),
        updated_at = NOW();
    
    RETURN new_view_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Create shop with QR code
CREATE OR REPLACE FUNCTION create_shop_with_qr(
    p_name TEXT,
    p_link TEXT,
    p_category_id TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS TABLE(shop_id TEXT, qr_id TEXT) AS $$
DECLARE
    new_shop_id TEXT;
    new_qr_id TEXT;
BEGIN
    -- Generate IDs
    new_shop_id := 'shop_' || substr(md5(random()::text), 1, 12);
    new_qr_id := 'qr_' || substr(md5(random()::text), 1, 12);
    
    -- Insert shop
    INSERT INTO shops (id, name, link, category_id, description)
    VALUES (new_shop_id, p_name, p_link, p_category_id, p_description);
    
    -- Insert QR code
    INSERT INTO qr_codes (id, shop_id, qr_content, qr_type)
    VALUES (new_qr_id, new_shop_id, 'qrnexus://' || new_shop_id, 'internal');
    
    -- Initialize stats
    INSERT INTO shop_stats (shop_id, total_scans, total_views)
    VALUES (new_shop_id, 0, 0);
    
    RETURN QUERY SELECT new_shop_id, new_qr_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get global statistics
CREATE OR REPLACE FUNCTION get_global_stats()
RETURNS TABLE(
    total_shops BIGINT,
    total_qr_codes BIGINT,
    total_scans BIGINT,
    total_views BIGINT,
    total_categories BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT
        (SELECT COUNT(*) FROM shops WHERE is_active = true),
        (SELECT COUNT(*) FROM qr_codes WHERE is_active = true),
        (SELECT COALESCE(SUM(total_scans), 0) FROM shop_stats),
        (SELECT COALESCE(SUM(total_views), 0) FROM shop_stats),
        (SELECT COUNT(*) FROM categories WHERE is_active = true);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_stats ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read shops" ON shops FOR SELECT USING (is_active = true);
CREATE POLICY "Public read qr_codes" ON qr_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read shop_stats" ON shop_stats FOR SELECT USING (true);

-- Service role full access (for backend)
CREATE POLICY "Service full access categories" ON categories FOR ALL USING (true);
CREATE POLICY "Service full access shops" ON shops FOR ALL USING (true);
CREATE POLICY "Service full access qr_codes" ON qr_codes FOR ALL USING (true);
CREATE POLICY "Service full access scans" ON scans FOR ALL USING (true);
CREATE POLICY "Service full access views" ON views FOR ALL USING (true);
CREATE POLICY "Service full access shop_stats" ON shop_stats FOR ALL USING (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after setup to verify:

-- SELECT * FROM categories;
-- SELECT get_global_stats();
