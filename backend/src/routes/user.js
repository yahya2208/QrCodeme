const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

/**
 * GET /api/user/points
 * Private: Get current user points. Requires Auth Token.
 */
router.get('/points', protect, async (req, res, next) => {
    try {
        // We use req.user.id which was verified by our middleware
        const { data, error } = await supabase
            .from('user_points')
            .select('total_points, total_shares, last_share_at')
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (error) throw error;

        res.json({
            success: true,
            data: data || { total_points: 0, total_shares: 0 }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/user/share
 * Private: Record a share and award points. Requires Auth Token.
 */
router.post('/share', protect, async (req, res, next) => {
    try {
        const { channel } = req.body;

        // Call the admin RPC because the backend uses service_role
        // but we pass the verified req.user.id from the JWT
        const { data, error } = await supabase.rpc('record_share_and_award_points_admin', {
            p_user_id: req.user.id,
            p_share_channel: channel || 'web_app'
        });

        if (error) throw error;

        if (!data.success && data.error === 'Cooldown active') {
            return res.status(429).json({ success: false, error: 'Cooldown active', remaining_seconds: data.remaining_seconds });
        }

        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/user/identity
 * Private: Create a new Nexus Identity for the user
 */
router.post('/identity', protect, async (req, res, next) => {
    try {
        const { full_name, bio } = req.body;

        if (!full_name) {
            return res.status(400).json({ success: false, error: 'Full name is required' });
        }

        // Generate a random Nexus ID (nx-XXXXXX)
        const nexusId = `nx-${Math.random().toString(36).substring(2, 8)}`;

        const { data, error } = await supabase
            .from('nexus_identities')
            .insert({
                id: nexusId,
                user_id: req.user.id,
                full_name,
                bio: bio || null
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
