-- ============================================
-- QRme V8.5 - VERIFIED REFERRAL SYSTEM
-- ============================================

-- Table to track referral clicks/hits
CREATE TABLE IF NOT EXISTS referral_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    visitor_ip_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for unique hit prevention per referrer/visitor
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_referral_hit 
ON referral_conversions(referrer_id, visitor_ip_hash);

-- Admin RPC to award points from backend
-- This avoids RLS issues by running as SECURITY DEFINER
CREATE OR REPLACE FUNCTION award_referral_points_admin(
    p_referrer_id UUID,
    p_points INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_points (user_id, total_points, total_shares)
    VALUES (p_referrer_id, p_points, 1)
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + p_points,
        total_shares = user_points.total_shares + 1,
        last_share_at = NOW(),
        updated_at = NOW();
        
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
