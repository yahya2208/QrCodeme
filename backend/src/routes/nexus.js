const express = require('express');
const router = express.Router();
const { supabase, db } = require('../config/supabase');

/**
 * GET /api/nexus/discovery
 * Fetches public identities for the exploration corridor
 */
router.get('/discovery', async (req, res, next) => {
    try {
        const { data, error } = await supabase.rpc('get_public_hub', { p_limit: 20 });
        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/nexus/my/:ownerId
 * Fetches the specific personal identity of a user
 */
router.get('/my/:ownerId', async (req, res, next) => {
    try {
        const { ownerId } = req.params;
        const { data: identity, error } = await supabase
            .from('nexus_identities')
            .select('*')
            .eq('owner_id', ownerId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (identity) {
            const shops = await db.getShopsByIdentity(identity.id);
            return res.json({ success: true, data: { ...identity, shops } });
        }

        res.json({ success: true, data: null });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/nexus/:id
 * Fetches any identity for viewing (Public/Private handled by logic)
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch identity details with linked shops
        const identity = await db.getNexusIdentityWithShops(id);

        if (!identity) {
            return res.status(404).json({ success: false, error: 'Identity not found' });
        }

        // Get calculated pulse
        let pulse = 1.0;
        try {
            const { data: pulseData, error: pulseError } = await supabase
                .rpc('get_identity_pulse', { p_identity_id: id });
            if (!pulseError) pulse = pulseData;
        } catch (e) {
            console.warn('RPC get_identity_pulse failed');
        }

        res.json({
            success: true,
            data: {
                ...identity,
                pulse: pulse || 1.0,
                temporal_status: getTemporalStatus()
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/nexus/create
 * Creates a unique digital identity with mandatory ownership
 */
router.post('/create', async (req, res, next) => {
    try {
        const { displayName, profession, bio, ownerId } = req.body;

        if (!displayName) {
            return res.status(400).json({ success: false, error: 'Display name is required' });
        }

        if (!ownerId) {
            return res.status(400).json({ success: false, error: 'Owner ID is mandatory' });
        }

        // Use the protected RPC
        const { data: identityId, error: idError } = await supabase
            .rpc('create_protected_identity', {
                p_name: displayName,
                p_bio: bio,
                p_profession: profession || 'other',
                p_owner_id: ownerId
            });

        if (idError) throw idError;

        res.status(201).json({
            success: true,
            data: {
                identityId,
                qrContent: `qrnexus://id/${identityId}`
            },
            message: 'NEXUS ID secured in the cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/nexus/:id
 * Updates a living identity (Ownership check enforced)
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { displayName, bio, ownerId } = req.body;

        // Verify ownership
        const { data: identity, error: fetchError } = await supabase
            .from('nexus_identities')
            .select('owner_id')
            .eq('id', id)
            .single();

        if (fetchError || !identity) return res.status(404).json({ success: false, error: 'Identity not found' });

        if (identity.owner_id && identity.owner_id !== ownerId) {
            return res.status(403).json({ success: false, error: 'Unauthorized: Ownership mismatch' });
        }

        // Update Identity
        const { error: idError } = await supabase
            .from('nexus_identities')
            .update({
                display_name: displayName,
                bio: bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (idError) throw idError;

        res.json({
            success: true,
            message: 'NEXUS ID state updated'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/nexus/claim-orphans
 */
router.post('/claim-orphans', async (req, res, next) => {
    try {
        const { identityId, ownerId } = req.body;

        // Ownership check
        const { data: identity } = await supabase.from('nexus_identities').select('owner_id').eq('id', identityId).single();
        if (identity && identity.owner_id !== ownerId) return res.status(403).json({ success: false });

        const { data: count, error } = await supabase.rpc('claim_orphan_shops', {
            p_identity_id: identityId
        });

        if (error) throw error;

        // Also update shops with owner_id if missing
        await supabase.from('shops').update({ owner_id: ownerId }).eq('identity_id', identityId).is('owner_id', null);

        res.json({ success: true, claimed_count: count });
    } catch (error) {
        next(error);
    }
});

function getTemporalStatus() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'dawn';
    if (hour >= 12 && hour < 17) return 'noon';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'void';
}

module.exports = router;
