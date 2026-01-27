-- ============================================
-- QRme V8.5 - ADMIN RPC FOR BACKEND CALLS
-- ============================================

-- This function allows the backend (Service Role) to award points for a specific user ID
-- since the backend doesn't have the user's auth context (auth.uid())

CREATE OR REPLACE FUNCTION record_share_and_award_points_admin(
    p_user_id UUID,
    p_share_channel TEXT DEFAULT 'unknown'
)
RETURNS JSONB AS $$
DECLARE
    v_last_share_at TIMESTAMP WITH TIME ZONE;
    v_new_points INTEGER;
    v_total_points INTEGER;
    v_cooldown_minutes INTEGER := 5; -- 5 minutes cooldown
BEGIN
    -- 1. Check for cooldown (prevent spam)
    SELECT last_share_at INTO v_last_share_at
    FROM user_points
    WHERE user_id = p_user_id;

    IF v_last_share_at IS NOT NULL AND (v_last_share_at + (v_cooldown_minutes || ' minutes')::interval) > NOW() THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cooldown active',
            'remaining_seconds', EXTRACT(EPOCH FROM (v_last_share_at + (v_cooldown_minutes || ' minutes')::interval) - NOW())::INTEGER
        );
    END IF;

    -- 2. record in history
    INSERT INTO share_history (user_id, share_channel, points_awarded, ip_hash)
    VALUES (p_user_id, p_share_channel, 5, 'admin_backend');

    -- 3. Upsert points
    INSERT INTO user_points (user_id, total_points, total_shares, last_share_at)
    VALUES (p_user_id, 5, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        total_points = user_points.total_points + 5,
        total_shares = user_points.total_shares + 1,
        last_share_at = NOW()
    RETURNING total_points INTO v_total_points;

    RETURN jsonb_build_object(
        'success', true,
        'points_added', 5,
        'total_points', v_total_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ONLY allow service_role or authenticated users to call this if needed
-- But primarily intended for backend use via service_role
GRANT EXECUTE ON FUNCTION record_share_and_award_points_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_share_and_award_points_admin(UUID, TEXT) TO service_role;
