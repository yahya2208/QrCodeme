/**
 * QR NEXUS - NEXUS ID API Routes
 * Secure Cloud Gateway to Digital Identities
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase'); // Using direct supabase from config

/**
 * GET /api/nexus/:id
 * Fetches the living identity and resolves its "Pulse" intensity
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Fetch identity details
        const { data: identity, error: idError } = await supabase
            .from('nexus_identities')
            .select(`
                *,
                links:nexus_identity_links(*)
            `)
            .eq('id', id)
            .single();

        if (idError || !identity) {
            return res.status(404).json({ success: false, error: 'Identity not found' });
        }

        // Get calculated pulse (The "Life" factor)
        const { data: pulse, error: pulseError } = await supabase
            .rpc('get_identity_pulse', { p_identity_id: id });

        // Log scan event
        await supabase.from('nexus_identity_scans').insert({
            identity_id: id,
            ip_hash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null,
            user_agent: req.get('User-Agent')?.substring(0, 200)
        });

        // Log visual view
        await supabase.from('nexus_identity_activity_log').insert({
            identity_id: id,
            activity_type: 'view'
        });

        res.json({
            success: true,
            data: {
                ...identity,
                pulse: pulse || 1.0,
                temporal_status: getTemporalStatus()
            },
            source: 'cloud_sync'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/nexus/create
 * Creates a unique digital identity (No login required)
 */
router.post('/create', async (req, res, next) => {
    try {
        const { displayName, profession, bio, links } = req.body;

        if (!displayName) {
            return res.status(400).json({ success: false, error: 'Display name is required' });
        }

        // 1. Create Identity
        const { data: identity, error: idError } = await supabase
            .from('nexus_identities')
            .insert({
                display_name: displayName,
                profession_id: profession,
                bio: bio
            })
            .select()
            .single();

        if (idError) throw idError;

        // 2. Add Links if provided
        if (links && Array.isArray(links)) {
            const formattedLinks = links.map((link, index) => ({
                identity_id: identity.id,
                label: link.label,
                target_url: link.url,
                icon_type: link.icon || 'bolt',
                sort_order: index
            }));

            await supabase.from('nexus_identity_links').insert(formattedLinks);
        }

        res.status(201).json({
            success: true,
            data: {
                identityId: identity.id,
                qrContent: `qrnexus://id/${identity.id}`
            },
            message: 'NEXUS ID formed in the cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/nexus/:id
 * Updates a living identity and its nested links
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { displayName, bio, links } = req.body;

        // 1. Update Identity Details
        const { error: idError } = await supabase
            .from('nexus_identities')
            .update({
                display_name: displayName,
                bio: bio,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (idError) throw idError;

        // 2. Handle Links (Sync Approach)
        if (links && Array.isArray(links)) {
            // Delete existing links for this identity (Simple sync)
            await supabase.from('nexus_identity_links').delete().eq('identity_id', id);

            // Insert new links
            const formattedLinks = links.map((link, index) => ({
                identity_id: id,
                label: link.label,
                target_url: link.url,
                icon_type: link.icon || 'bolt',
                sort_order: index
            }));

            if (formattedLinks.length > 0) {
                const { error: linksError } = await supabase.from('nexus_identity_links').insert(formattedLinks);
                if (linksError) throw linksError;
            }
        }

        // Log edit event
        await supabase.from('nexus_identity_activity_log').insert({
            identity_id: id,
            activity_type: 'edit'
        });

        res.json({
            success: true,
            message: 'NEXUS ID state updated in the cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Helper: Determine Temporal UI Status
 */
function getTemporalStatus() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'dawn';
    if (hour >= 12 && hour < 17) return 'noon';
    if (hour >= 17 && hour < 20) return 'dusk';
    return 'void';
}

module.exports = router;
