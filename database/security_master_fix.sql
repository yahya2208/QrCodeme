-- ============================================
-- QRme SECURITY & SCHEMA MASTER FIX (V9.1)
-- ============================================

-- 1. FIX MISSING COLUMNS & TABLES
-- Ensure status column exists in relevant places
ALTER TABLE IF EXISTS public.nexus_identities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE IF EXISTS public.nexus_identities ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 2. ENABLE RLS ON ALL PUBLIC TABLES (CRITICAL SECURITY)
DO $$ 
BEGIN
    EXECUTE 'ALTER TABLE IF EXISTS public.user_points ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.nexus_identities ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.code_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.code_services ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.shop_stats ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.shops ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.admin_audit_logs ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Some tables might not exist yet, skipping RLS enablement for those.';
END $$;

-- 3. FIX FUNCTION SEARCH PATHS (SECURITY BEST PRACTICE)
-- We use a robust approach to alter only existing functions
DO $$ 
BEGIN
    -- get_admin_dashboard_stats
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_admin_dashboard_stats' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_admin_dashboard_stats() SET search_path = public;
    END IF;

    -- get_identity_codes (Multiple variants)
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_identity_codes' AND nspname = 'public') THEN
        BEGIN
            ALTER FUNCTION public.get_identity_codes(text, uuid) SET search_path = public;
        EXCEPTION WHEN OTHERS THEN 
            RAISE NOTICE 'get_identity_codes(text, uuid) variation not found or failed.';
        END;
    END IF;

    -- get_public_hub
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_public_hub' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_public_hub(integer) SET search_path = public;
    END IF;

    -- get_user_points
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'get_user_points' AND nspname = 'public') THEN
        ALTER FUNCTION public.get_user_points() SET search_path = public;
    END IF;

    -- record_share_and_award_points
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'record_share_and_award_points' AND nspname = 'public') THEN
        ALTER FUNCTION public.record_share_and_award_points(text) SET search_path = public;
    END IF;

    -- create_user_identity
    IF EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid WHERE proname = 'create_user_identity' AND nspname = 'public') THEN
        ALTER FUNCTION public.create_user_identity(text, text) SET search_path = public;
    END IF;

    -- record_scan (Handling the likely missing/signature-mismatched function)
    BEGIN
        ALTER FUNCTION public.record_scan(text, text, text, text, text) SET search_path = public;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'record_scan function not found with provided signature, skipping.';
    END;

    -- record_view
    BEGIN
        ALTER FUNCTION public.record_view(text, text, text, text) SET search_path = public;
    EXCEPTION WHEN OTHERS THEN 
        RAISE NOTICE 'record_view function not found with provided signature, skipping.';
    END;

END $$;

-- 4. RE-GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

NOTIFY pgrst, 'reload schema';

