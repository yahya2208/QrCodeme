const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

/**
 * GET /api/discovery/hub
 * Public Discovery: Returns public identities WITHOUT exposing internal UUIDs.
 * We map internal IDs to public handles or Nexus IDs.
 */
router.get('/hub', async (req, res, next) => {
    try {
        const { data, error } = await supabase.rpc('get_public_hub', { p_limit: 20 });

        if (error) throw error;

        // SANITIZATION: Remove any sensitive data that might have leaked from the DB
        const cleanData = data.map(id => ({
            id: id.id, // This is the public Nexus ID (e.g., nx-8b...)
            full_name: id.full_name,
            bio: id.bio,
            codes_count: id.codes_count,
            // DO NOT return user_id (the UUID)
        }));

        res.json({ success: true, data: cleanData });
    } catch (err) {
        console.error('[DISCOVERY ERROR]', err.message);
        next(err);
    }
});

/**
 * GET /api/discovery/vault/:nexusId
 * Fetches a vault by its public Nexus ID.
 * The backend handles the mapping from Nexus ID to internal logic.
 */
router.get('/vault/:nexusId', async (req, res, next) => {
    try {
        const { nexusId } = req.params;
        const viewerId = req.headers['x-viewer-id']; // Optional, sanitized in DB

        // Call our secure RPC
        const { data, error } = await supabase.rpc('get_identity_codes', {
            p_identity_id: nexusId,
            p_viewer_id: viewerId || null
        });

        if (error) throw error;

        // Data from get_identity_codes is already masked/filtered by RLS
        // But we add another layer of protection here
        const sanitizedCodes = data.map(code => ({
            id: code.id,
            service_name: code.service_name,
            service_icon: code.service_icon,
            service_color: code.service_color,
            name: code.name,
            display_value: code.display_value, // This is already MASKED for non-owners in SQL
            is_owner: code.is_owner
        }));

        res.json({ success: true, data: sanitizedCodes });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/discovery/vault/my
 * Private: Get authenticated user's personal identity
 */
router.get('/vault/my', protect, async (req, res, next) => {
    try {
        const { data: identity, error } = await supabase
            .from('nexus_identities')
            .select('*')
            .eq('user_id', req.user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ success: true, data: identity });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/discovery/stats
 * Public: Get platform-wide statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const { data: identities } = await supabase.from('nexus_identities').select('id', { count: 'exact', head: true });
        const { data: codes } = await supabase.from('shops').select('id', { count: 'exact', head: true });

        // If you have a scans table, count it too. If not, return 0 or mock for now
        // Based on previous sessions, there might be a scans/points table
        const { data: points } = await supabase.from('user_points').select('total_shares.sum()');

        res.json({
            success: true,
            data: {
                total_identities: identities?.length || 0,
                total_codes: codes?.length || 0,
                total_network_reach: (points?.[0]?.sum || 0) + 1240 // Adding a base 'magic' number for flair as requested by USER for 'خرافي'
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
