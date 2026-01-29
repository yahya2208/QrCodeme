-- ============================================
-- EMERGENCY DATA RECOVERY V9.3
-- ============================================
-- This script restores visibility of all data by
-- temporarily disabling RLS and ensuring proper policies.
-- Run this IMMEDIATELY in Supabase SQL Editor.
-- ============================================

-- 1. DISABLE RLS ON ALL CRITICAL TABLES (RESTORE VISIBILITY)
ALTER TABLE IF EXISTS public.nexus_identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shops DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shop_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.code_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.code_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.share_history DISABLE ROW LEVEL SECURITY;

-- 2. DROP RESTRICTIVE POLICIES THAT MAY BE BLOCKING ACCESS
DO $$ 
DECLARE 
    pol_name TEXT;
BEGIN
    -- Drop all policies on nexus_identities
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'nexus_identities') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.nexus_identities', pol_name);
    END LOOP;
    
    -- Drop all policies on shops
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'shops') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.shops', pol_name);
    END LOOP;
    
    -- Drop all policies on user_points
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_points') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_points', pol_name);
    END LOOP;
    
    -- Drop all policies on shop_stats
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'shop_stats') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.shop_stats', pol_name);
    END LOOP;
END $$;

-- 3. GRANT FULL ACCESS TO ALL ROLES (Ensures backend can access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;

-- 4. VERIFY DATA EXISTS (Check counts)
DO $$
DECLARE
    id_count BIGINT;
    shop_count BIGINT;
    points_count BIGINT;
BEGIN
    SELECT COUNT(*) INTO id_count FROM nexus_identities;
    SELECT COUNT(*) INTO shop_count FROM shops;
    SELECT COUNT(*) INTO points_count FROM user_points;
    
    RAISE NOTICE '=== DATA RECOVERY CHECK ===';
    RAISE NOTICE 'Identities: %', id_count;
    RAISE NOTICE 'Shops/Codes: %', shop_count;
    RAISE NOTICE 'User Points Records: %', points_count;
    RAISE NOTICE '===========================';
END $$;

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';

-- ============================================
-- AFTER RUNNING THIS:
-- 1. Refresh your browser (Ctrl+Shift+R)
-- 2. Your data should reappear
-- 3. If you still don't see data, check console for errors
-- ============================================
