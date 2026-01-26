-- ============================================
-- QR NEXUS - Fix: Update get_global_stats function
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop and recreate the function with proper column references
DROP FUNCTION IF EXISTS get_global_stats();

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
        (SELECT COUNT(*)::BIGINT FROM shops WHERE is_active = true) as total_shops,
        (SELECT COUNT(*)::BIGINT FROM qr_codes WHERE is_active = true) as total_qr_codes,
        (SELECT COALESCE(SUM(ss.total_scans), 0)::BIGINT FROM shop_stats ss) as total_scans,
        (SELECT COALESCE(SUM(ss.total_views), 0)::BIGINT FROM shop_stats ss) as total_views,
        (SELECT COUNT(*)::BIGINT FROM categories WHERE is_active = true) as total_categories;
END;
$$ LANGUAGE plpgsql;

-- Test it
SELECT * FROM get_global_stats();
