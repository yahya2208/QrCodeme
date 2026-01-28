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
 * GET /api/discovery/vault/my
 * Private: Get authenticated user's personal identity
 */
router.get('/vault/my', protect, async (req, res, next) => {
    try {
        const { data: identity, error } = await supabase
            .from('nexus_identities')
            .select('*')
            .eq('user_id', req.user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        res.json({ success: true, data: identity });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/discovery/vault/:nexusId
 * Public: Fetch vault codes by public Nexus ID.
 */
router.get('/vault/:nexusId', async (req, res, next) => {
    try {
        const { nexusId } = req.params;
        let viewerId = null;

        // Try to resolve viewer from JWT if token is provided
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            // Rename to avoid collision
            const { data: userData, error: userError } = await supabase.auth.getUser(token);
            if (userData && userData.user) {
                viewerId = userData.user.id;
            }
        }

        console.log(`[DISCOVERY] Vault access: ${nexusId} | Viewer: ${viewerId || 'Anonymous'}`);

        // Call our secure RPC
        const { data: codesData, error: rpcError } = await supabase.rpc('get_identity_codes', {
            p_identity_id: nexusId,
            p_viewer_id: viewerId
        });

        if (rpcError) {
            console.error('[RPC ERROR]', rpcError);
            // Return empty set if RPC fails to avoid 500
            return res.json({ success: true, data: [] });
        }

        // Fetch identity total stats separately for accuracy
        const { data: totalData } = await supabase.rpc('get_identity_total_stats', { p_identity_id: nexusId });
        const totalReach = (totalData && totalData[0]) ? totalData[0].total_reach : 0;

        // The RPC returns real values as requested.
        const sanitizedCodes = (codesData || []).map(code => ({
            id: code ? code.id : null,
            service_id: code ? code.service_id : null,
            service_name: code ? code.service_name : 'Unknown',
            service_icon: code ? code.service_icon : null,
            service_color: code ? code.service_color : '#ccc',
            name: code ? code.name : 'Untitled',
            display_value: code ? code.display_value : '',
            is_owner: code ? !!code.is_owner : false,
            owner_name: (code && code.owner_name) ? code.owner_name : 'Owner',
            scans: parseInt(code.total_scans) || 0,
            views: parseInt(code.total_views) || 0
        })).filter(c => c.id !== null);

        res.json({
            success: true,
            data: sanitizedCodes,
            meta: {
                total_reach: parseInt(totalReach) || 0
            }
        });
    } catch (err) {
        console.error('[VAULT ERROR FULL]', {
            message: err.message,
            stack: err.stack,
            details: err.details,
            hint: err.hint,
            code: err.code
        });
        next(err);
    }
});

/**
 * POST /api/discovery/track/:shopId
 * Public: Record engagement for a code
 */
router.post('/track/:shopId', async (req, res, next) => {
    try {
        const shopId = parseInt(req.params.shopId, 10);

        if (isNaN(shopId)) {
            return res.status(400).json({ success: false, error: 'Invalid shop ID' });
        }

        console.log(`[TRACK] Recording view for shop: ${shopId}`);

        // Try RPC first
        const { data, error } = await supabase.rpc('record_view', {
            p_shop_id: shopId,
            p_source: 'vault_click'
        });

        console.log('[TRACK] RPC Response:', { data, error });

        if (error) {
            console.error('[TRACK RPC ERROR]', error);

            // Fallback: Try direct insert/update
            console.log('[TRACK] Attempting direct insert fallback...');
            const { error: insertError } = await supabase
                .from('shop_stats')
                .upsert({
                    shop_id: shopId,
                    total_views: 1,
                    last_view_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'shop_id' });

            if (insertError) {
                console.error('[TRACK FALLBACK ERROR]', insertError);
                return res.json({ success: false, error: insertError.message });
            }

            console.log('[TRACK] Fallback succeeded');
        }

        console.log(`[TRACK] Success for shop: ${shopId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('[TRACK CRASH]', err.message);
        res.json({ success: false, error: err.message });
    }
});

/**
 * GET /api/discovery/stats
 * Public: Get platform-wide statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        // 1. Total Identities
        const { count: identitiesCount } = await supabase
            .from('nexus_identities')
            .select('*', { count: 'exact', head: true });

        // 2. Total Codes
        const { count: codesCount } = await supabase
            .from('shops')
            .select('*', { count: 'exact', head: true });

        // 3. Direct query to shop_stats for views/scans
        const { data: statsData, error: statsError } = await supabase
            .from('shop_stats')
            .select('total_scans, total_views');

        console.log('[STATS] Raw shop_stats data:', statsData, statsError);

        let totalScans = 0;
        let totalViews = 0;

        if (statsData && statsData.length > 0) {
            statsData.forEach(row => {
                totalScans += parseInt(row.total_scans) || 0;
                totalViews += parseInt(row.total_views) || 0;
            });
        }

        console.log('[STATS] Calculated:', { totalScans, totalViews });

        res.json({
            success: true,
            data: {
                total_identities: parseInt(identitiesCount) || 0,
                total_codes: parseInt(codesCount) || 0,
                total_network_reach: totalScans + totalViews
            }
        });
    } catch (err) {
        console.error('[STATS ERROR]', err.message);
        next(err);
    }
});

module.exports = router;
