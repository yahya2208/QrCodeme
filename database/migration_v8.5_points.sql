-- ============================================
-- QRme V8.5 - REFERRAL POINTS SYSTEM
-- ============================================
-- Features:
-- 1. User points tracking
-- 2. Share history with cooldown
-- 3. Anti-fraud measures
-- ============================================

-- Create points table
CREATE TABLE IF NOT EXISTS user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    last_share_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create share history table for audit
CREATE TABLE IF NOT EXISTS share_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    share_channel TEXT, -- 'whatsapp', 'telegram', 'copy', etc.
    points_awarded INTEGER DEFAULT 0,
    ip_hash TEXT, -- Hashed IP for fraud detection
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_share_history_user ON share_history(user_id);
CREATE INDEX IF NOT EXISTS idx_share_history_created ON share_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_points_user ON user_points(user_id);

-- Enable RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
DROP POLICY IF EXISTS "Users can view own points" ON user_points;
CREATE POLICY "Users can view own points" ON user_points
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System manages points" ON user_points;
CREATE POLICY "System manages points" ON user_points
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for share_history
DROP POLICY IF EXISTS "Users can view own history" ON share_history;
CREATE POLICY "Users can view own history" ON share_history
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- SECURE RPC: Record Share and Award Points
-- ============================================
CREATE OR REPLACE FUNCTION record_share_and_award_points(
    p_share_channel TEXT DEFAULT 'unknown'
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_last_share TIMESTAMP WITH TIME ZONE;
    v_cooldown_minutes INTEGER := 5; -- 5 minute cooldown
    v_points_per_share INTEGER := 5;
    v_current_points INTEGER;
    v_result JSON;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Authentication required');
    END IF;
    
    -- Check last share time for cooldown
    SELECT last_share_at INTO v_last_share
    FROM user_points
    WHERE user_id = v_user_id;
    
    -- Check cooldown (prevent spam)
    IF v_last_share IS NOT NULL AND 
       v_last_share > NOW() - INTERVAL '1 minute' * v_cooldown_minutes THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Cooldown active',
            'cooldown_remaining', EXTRACT(EPOCH FROM (v_last_share + INTERVAL '1 minute' * v_cooldown_minutes - NOW()))::INTEGER
        );
    END IF;
    
    -- Create or update user points
    INSERT INTO user_points (user_id, total_points, total_shares, last_share_at)
    VALUES (v_user_id, v_points_per_share, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + v_points_per_share,
        total_shares = user_points.total_shares + 1,
        last_share_at = NOW(),
        updated_at = NOW();
    
    -- Record share in history
    INSERT INTO share_history (user_id, share_channel, points_awarded)
    VALUES (v_user_id, p_share_channel, v_points_per_share);
    
    -- Get updated points
    SELECT total_points INTO v_current_points
    FROM user_points
    WHERE user_id = v_user_id;
    
    RETURN json_build_object(
        'success', true,
        'points_awarded', v_points_per_share,
        'total_points', v_current_points,
        'message', 'شكراً لمشاركتك!'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RPC: Get User Points
-- ============================================
CREATE OR REPLACE FUNCTION get_user_points()
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_points RECORD;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN json_build_object('total_points', 0, 'total_shares', 0);
    END IF;
    
    SELECT total_points, total_shares, last_share_at
    INTO v_points
    FROM user_points
    WHERE user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object('total_points', 0, 'total_shares', 0);
    END IF;
    
    RETURN json_build_object(
        'total_points', COALESCE(v_points.total_points, 0),
        'total_shares', COALESCE(v_points.total_shares, 0),
        'last_share_at', v_points.last_share_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_share_and_award_points(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_points() TO authenticated;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
