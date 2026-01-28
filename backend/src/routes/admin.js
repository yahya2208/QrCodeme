const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

/**
 * ADMIN ONLY MIDDLEWARE
 */
const adminOnly = (req, res, next) => {
    const ADMIN_EMAIL = 'y220890@gmail.com';
    if (req.user && req.user.email === ADMIN_EMAIL) {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Unauthorized. Admin eyes only.' });
    }
};

/**
 * GET /api/admin/overview
 * Total stats for the platform
 */
router.get('/overview', protect, adminOnly, async (req, res, next) => {
    try {
        const { data: stats, error } = await supabase.rpc('get_admin_stats');
        if (error) throw error;
        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/users
 */
router.get('/users', protect, adminOnly, async (req, res, next) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id, email, full_name, created_at,
                nexus_identities (id, full_name),
                user_points (total_points)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/identities
 */
router.get('/identities', protect, adminOnly, async (req, res, next) => {
    try {
        const { data: identities, error } = await supabase
            .from('nexus_identities')
            .select(`
                id, full_name, bio, created_at,
                shops (id, name, service_id, value)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: identities });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
