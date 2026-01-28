const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

const ADMIN_EMAIL = 'y220890@gmail.com';

/**
 * ADMIN PROTECTION MIDDLEWARE
 * Strictly enforces that only the master email can cross this line.
 */
const adminGate = (req, res, next) => {
    if (req.user && req.user.email === ADMIN_EMAIL) {
        next();
    } else {
        // Security: Log unauthorized attempt (optional, but requested)
        console.warn(`[SECURITY BREACH ATTEMPT] Unauthorized Admin Access by ${req.user?.email || 'Unknown'}`);
        res.status(404).json({ success: false, error: 'Reality not found.' }); // 404 Illusion as requested
    }
};

/**
 * Audit Log Utility
 */
const logAudit = async (req, action, targetType, targetId, details = {}) => {
    await supabase.from('admin_audit_logs').insert({
        admin_id: req.user.id,
        admin_email: req.user.email,
        action,
        target_type: targetType,
        target_id: String(targetId),
        details,
        ip_address: req.ip,
        user_agent: req.headers['user-agent']
    });
};

// Apply protection to all routes in this file
router.use(protect, adminGate);

/**
 * GET /api/admin/system/overview
 */
router.get('/system/overview', async (req, res, next) => {
    try {
        const { data, error } = await supabase.rpc('get_admin_dashboard_stats');
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

/**
 * GET /api/admin/users
 */
router.get('/users', async (req, res, next) => {
    try {
        const { search, status, page = 1 } = req.query;
        let query = supabase
            .from('users')
            .select(`
                id, email, full_name, created_at, status, 
                user_points (total_points, total_shares),
                nexus_identities (id, full_name)
            `);

        if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        if (status && status !== 'all') query = query.eq('status', status);

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * 20, page * 20 - 1);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

/**
 * POST /api/admin/users/action
 */
router.post('/users/action', async (req, res, next) => {
    try {
        const { userId, action, reason, points } = req.body;

        if (action === 'SUSPEND' || action === 'BAN' || action === 'ACTIVATE') {
            const statusMap = { 'SUSPEND': 'suspended', 'BAN': 'banned', 'ACTIVATE': 'active' };
            const { error } = await supabase
                .from('users')
                .update({ status: statusMap[action], ban_reason: reason })
                .eq('id', userId);
            if (error) throw error;
            await logAudit(req, action, 'USER', userId, { reason });
        } else if (action === 'RESET_POINTS') {
            const { error } = await supabase
                .from('user_points')
                .update({ total_points: points || 0 })
                .eq('user_id', userId);
            if (error) throw error;
            await logAudit(req, 'RESET_POINTS', 'USER', userId, { new_points: points });
        }

        res.json({ success: true });
    } catch (err) { next(err); }
});

/**
 * GET /api/admin/identities
 */
router.get('/identities', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('nexus_identities')
            .select(`
                id, full_name, bio, created_at, user_id,
                shops (id, name, value, service_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

/**
 * GET /api/admin/audit-logs
 */
router.get('/audit-logs', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('admin_audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) { next(err); }
});

module.exports = router;
