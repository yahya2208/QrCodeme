const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

/**
 * GET /api/referral/link
 * Private: Get user's unique referral link
 */
router.get('/link', protect, async (req, res, next) => {
    try {
        // Use the authenticated user's ID
        const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
        const referralLink = `${baseUrl}/r/${req.user.id}`;

        res.json({
            success: true,
            data: {
                referral_code: req.user.id,
                referral_link: referralLink
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
