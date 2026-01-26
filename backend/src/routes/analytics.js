/**
 * QR NEXUS - Analytics API Routes
 * All statistics from cloud (Supabase)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

/**
 * GET /api/analytics/stats
 * Get global statistics (cloud)
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await db.getGlobalStats();

        res.json({
            success: true,
            data: stats,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/categories
 * Get all categories (cloud)
 */
router.get('/categories', async (req, res, next) => {
    try {
        const categories = await db.getCategories();

        res.json({
            success: true,
            data: categories,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/shop/:id
 * Get analytics for a specific shop (cloud)
 */
router.get('/shop/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await db.getShop(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                error: 'Shop not found'
            });
        }

        const stats = await db.getShopStats(id);

        res.json({
            success: true,
            data: {
                shopId: shop.id,
                name: shop.name,
                category: shop.category,
                totalScans: stats.total_scans || 0,
                totalViews: stats.total_views || 0,
                lastScanAt: stats.last_scan_at,
                lastViewAt: stats.last_view_at,
                createdAt: shop.created_at
            },
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
