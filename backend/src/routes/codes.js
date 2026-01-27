const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

/**
 * GET /api/codes/metadata
 * Public: Load categories and services for UI
 */
router.get('/metadata', async (req, res, next) => {
    try {
        const [catRes, svcRes] = await Promise.all([
            supabase.from('code_categories').select('*').order('sort_order'),
            supabase.from('code_services').select('*')
        ]);

        if (catRes.error) throw catRes.error;
        if (svcRes.error) throw svcRes.error;

        res.json({
            success: true,
            data: {
                categories: catRes.data,
                services: svcRes.data
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/codes/create
 * Private: Create a new identity code. Requires Auth.
 */
router.post('/create', protect, async (req, res, next) => {
    try {
        const { service_id, identity_id, name, display_value } = req.body;

        if (!service_id || !identity_id || !display_value) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Verify identity ownership before creating code
        const { data: identity } = await supabase
            .from('nexus_identities')
            .select('user_id')
            .eq('id', identity_id)
            .single();

        if (!identity || identity.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized: You do not own this identity' });
        }

        const { data, error } = await supabase
            .from('shops') // Table name is 'shops' in the schema
            .insert({
                identity_id,
                user_id: req.user.id, // Adding user_id explicitly as required by some migrations
                service_id,
                name: name || null,
                value: display_value, // Column name is 'value' in migration_v7
                is_public: true
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/codes/:id
 * Private: Update an existing code. Requires Auth and Ownership.
 */
router.put('/:id', protect, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { display_value } = req.body;

        // Check ownership
        const { data: code, error: fetchErr } = await supabase
            .from('shops')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchErr || !code) return res.status(404).json({ success: false, error: 'Code not found' });
        if (code.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { data, error } = await supabase
            .from('shops')
            .update({
                value: display_value
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/codes/:id
 * Private: Delete a code. Requires Auth and Ownership.
 */
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: code, error: fetchErr } = await supabase
            .from('shops')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchErr || !code) return res.status(404).json({ success: false, error: 'Code not found' });
        if (code.user_id !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized' });
        }

        const { error } = await supabase
            .from('shops')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Code deleted successfully' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
