/**
 * QR NEXUS - Shops API Routes
 * All operations are cloud-based (Supabase)
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

/**
 * GET /api/shops
 * Get all shops (cloud)
 */
router.get('/', async (req, res, next) => {
    try {
        const { category } = req.query;
        const shops = await db.getShops(category);

        res.json({
            success: true,
            data: shops,
            count: shops.length,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/shops/search
 * Search shops (cloud)
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

        const shops = await db.searchShops(q.trim());

        res.json({
            success: true,
            data: shops,
            count: shops.length,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/shops/:id
 * Get single shop (cloud)
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await db.getShop(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                error: 'Shop not found'
            });
        }

        res.json({
            success: true,
            data: shop,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/shops
 * Create new shop with QR (cloud)
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, link, category, description } = req.body;

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

        // Create shop in cloud
        const shop = await db.createShop({
            name: name.trim(),
            link: link.trim(),
            category,
            description: description?.trim()
        });

        res.status(201).json({
            success: true,
            data: shop,
            message: 'Shop created successfully in cloud',
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/shops/:id/view
 * Record view in cloud
 */
router.post('/:id/view', async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await db.getShop(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                error: 'Shop not found'
            });
        }

        // Record view in cloud with metadata
        const viewId = await db.recordView(id, {
            source: req.body.source || 'web',
            ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null,
            userAgent: req.get('User-Agent')?.substring(0, 200)
        });

        res.json({
            success: true,
            message: 'View recorded in cloud',
            viewId,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/shops/:id/scan
 * Record scan in cloud
 */
router.post('/:id/scan', async (req, res, next) => {
    try {
        const { id } = req.params;
        const shop = await db.getShop(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                error: 'Shop not found'
            });
        }

        // Get QR code for this shop
        const qrCode = await db.getQRCodeByShop(id);

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                error: 'QR code not found for this shop'
            });
        }

        // Record scan in cloud with metadata
        const scanId = await db.recordScan(qrCode.id, id, {
            source: req.body.source || 'app',
            ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null,
            userAgent: req.get('User-Agent')?.substring(0, 200)
        });

        res.json({
            success: true,
            message: 'Scan recorded in cloud',
            scanId,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
