/**
 * QR NEXUS - Stores API Routes
 * Handles all store-related operations
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

// Categories list
const VALID_CATEGORIES = [
    'pharmacy', 'phones', 'restaurant', 'cafe',
    'maintenance', 'fashion', 'services', 'other'
];

/**
 * GET /api/stores
 * Get all stores, optionally filtered by category
 */
router.get('/', async (req, res, next) => {
    try {
        const { category = 'all' } = req.query;

        // Validate category
        if (category !== 'all' && !VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
        }

        const stores = await db.getStores(category);

        res.json({
            success: true,
            data: stores,
            count: stores.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/stores/search
 * Search stores by name or category
 */
router.get('/search', async (req, res, next) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'Search term must be at least 2 characters'
            });
        }

        const stores = await db.searchStores(q.trim());

        res.json({
            success: true,
            data: stores,
            count: stores.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/stores/:id
 * Get single store by ID
 */
router.get('/:id', async (req, res, next) => {
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
            data: store
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/stores
 * Create new store
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, link, category } = req.body;

        // Validation
        if (!name || !link || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: name, link, category'
            });
        }

        if (name.trim().length < 2 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Name must be between 2 and 100 characters'
            });
        }

        // Validate URL
        try {
            new URL(link);
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format'
            });
        }

        if (!VALID_CATEGORIES.includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category'
            });
        }

        const store = await db.createStore({
            name: name.trim(),
            link: link.trim(),
            category
        });

        res.status(201).json({
            success: true,
            data: store,
            message: 'Store created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/stores/:id/view
 * Increment view count for a store
 */
router.post('/:id/view', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await db.getStore(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }

        await db.incrementView(id);

        res.json({
            success: true,
            message: 'View recorded'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/stores/:id/scan
 * Increment scan count for a store
 */
router.post('/:id/scan', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await db.getStore(id);

        if (!store) {
            return res.status(404).json({
                success: false,
                error: 'Store not found'
            });
        }

        await db.incrementScan(id);

        res.json({
            success: true,
            message: 'Scan recorded'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
