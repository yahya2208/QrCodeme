-- ============================================
-- QR NEXUS - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- to create the required tables and functions
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY DEFAULT ('qr_' || substr(md5(random()::text), 1, 16)),
    name TEXT NOT NULL,
    link TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'pharmacy', 'phones', 'restaurant', 'cafe',
        'maintenance', 'fashion', 'services', 'other'
    )),
    scans INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster category queries
CREATE INDEX IF NOT EXISTS idx_stores_category ON stores(category);

-- Index for faster search
CREATE INDEX IF NOT EXISTS idx_stores_name ON stores(name);

-- ============================================
-- ANALYTICS TABLE (Optional - for detailed tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id TEXT REFERENCES stores(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('scan', 'view')),
    ip_hash TEXT,  -- Hashed IP for privacy
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster store analytics
CREATE INDEX IF NOT EXISTS idx_analytics_store ON analytics_events(store_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan(store_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE stores
    SET scans = scans + 1,
        updated_at = NOW()
    WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view(store_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE stores
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = store_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp on changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS stores_updated_at ON stores;
CREATE TRIGGER stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Enable RLS on stores table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all reads (public discovery)
CREATE POLICY "Allow public read access"
    ON stores FOR SELECT
    USING (true);

-- Policy: Allow insert from authenticated service
CREATE POLICY "Allow service insert"
    ON stores FOR INSERT
    WITH CHECK (true);

-- Policy: Allow update from authenticated service
CREATE POLICY "Allow service update"
    ON stores FOR UPDATE
    USING (true);

-- ============================================
-- SAMPLE DATA (Optional)
-- ============================================
-- Uncomment to add sample stores for testing

-- INSERT INTO stores (name, link, category) VALUES
--     ('صيدلية النور', 'https://example.com/pharmacy', 'pharmacy'),
--     ('متجر الهواتف الذكية', 'https://example.com/phones', 'phones'),
--     ('مطعم البيت العربي', 'https://example.com/restaurant', 'restaurant'),
--     ('مقهى السعادة', 'https://example.com/cafe', 'cafe');

-- ============================================
-- VERIFY SETUP
-- ============================================
-- Run these to verify everything is set up correctly:

-- SELECT * FROM stores LIMIT 5;
-- SELECT * FROM pg_policies WHERE tablename = 'stores';
