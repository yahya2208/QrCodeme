-- ============================================
-- FIX SCAN & VIEW FUNCTIONS (V9.2)
-- ============================================
-- This script synchronizes function signatures with the BIGINT schema
-- and ensures search_path is secure.

-- 1. DROP EXISTING TO AVOID CONFLICTS
DROP FUNCTION IF EXISTS public.record_scan(text, text, text, text, text);
DROP FUNCTION IF EXISTS public.record_scan(text, bigint, text, text, text);
DROP FUNCTION IF EXISTS public.record_view(text, text, text, text);
DROP FUNCTION IF EXISTS public.record_view(bigint, text, text, text);

-- 2. CREATE RE-DEFINED record_scan
CREATE OR REPLACE FUNCTION public.record_scan(
    p_qr_code_id TEXT,
    p_shop_id BIGINT,
    p_source TEXT DEFAULT 'app',
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_scan_id UUID;
BEGIN
    -- Insert scan record (Assume scans table exists with bigint shop_id)
    INSERT INTO public.scans (qr_code_id, shop_id, source, ip_hash, user_agent)
    VALUES (p_qr_code_id, p_shop_id, p_source, p_ip_hash, p_user_agent)
    RETURNING id INTO new_scan_id;
    
    -- Update or insert stats
    INSERT INTO public.shop_stats (shop_id, total_scans, last_scan_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_scans = shop_stats.total_scans + 1,
        last_scan_at = NOW(),
        updated_at = NOW();
    
    RETURN new_scan_id;
EXCEPTION WHEN OTHERS THEN
    -- Fallback if scans table doesn't exist yet but shop_stats does
    INSERT INTO public.shop_stats (shop_id, total_scans, last_scan_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_scans = shop_stats.total_scans + 1,
        last_scan_at = NOW(),
        updated_at = NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CREATE RE-DEFINED record_view
CREATE OR REPLACE FUNCTION public.record_view(
    p_shop_id BIGINT,
    p_source TEXT DEFAULT 'app',
    p_ip_hash TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_view_id UUID;
BEGIN
    -- Insert view record
    BEGIN
        INSERT INTO public.views (shop_id, source, ip_hash, user_agent)
        VALUES (p_shop_id, p_source, p_ip_hash, p_user_agent)
        RETURNING id INTO new_view_id;
    EXCEPTION WHEN OTHERS THEN
        new_view_id := NULL;
    END;
    
    -- Update or insert stats
    INSERT INTO public.shop_stats (shop_id, total_views, last_view_at, updated_at)
    VALUES (p_shop_id, 1, NOW(), NOW())
    ON CONFLICT (shop_id) DO UPDATE SET
        total_views = shop_stats.total_views + 1,
        last_view_at = NOW(),
        updated_at = NOW();
    
    RETURN new_view_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. PERMISSIONS
GRANT EXECUTE ON FUNCTION public.record_scan(text, bigint, text, text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.record_view(bigint, text, text, text) TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';
