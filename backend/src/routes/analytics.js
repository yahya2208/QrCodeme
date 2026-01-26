/**
 * QR NEXUS - Analytics API Routes
 * Handles statistics and analytics
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

/**
 * GET /api/analytics/stats
 * Get global statistics
 */
router.get('/stats', async (req, res, next) => {
    try {
        const stats = await db.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/store/:id
 * Get analytics for a specific store
 */
router.get('/store/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await db.getStore(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }

        res.json({
            success: true,
            data: {
                storeId: store.id,
                name: store.name,
                scans: store.scans || 0,
                views: store.views || 0,
                created_at: store.created_at
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/analytics/categories
 * Get statistics by category
 */
router.get('/categories', async (req, res, next) => {
    try {
        const stores = await db.getStores();

        // Group by category
        const categoryStats = {};
        stores.forEach(store => {
            if (!categoryStats[store.category]) {
                categoryStats[store.category] = {
                    count: 0,
                    totalScans: 0,
                    totalViews: 0
                };
            }
            categoryStats[store.category].count++;
            categoryStats[store.category].totalScans += store.scans || 0;
            categoryStats[store.category].totalViews += store.views || 0;
        });

        res.json({
            success: true,
            data: categoryStats
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
