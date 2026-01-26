/**
 * QR NEXUS - QR Code API Routes
 * All operations are cloud-based
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

/**
 * GET /api/qr/resolve/:id
 * Resolve a QR code to get shop information (cloud)
 */
router.get('/resolve/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // Try to find shop by ID
        let shop = await db.getShop(id);

        // If not found, try as QR code ID
        if (!shop) {
            const qrCode = await db.getQRCode(id);
            if (qrCode && qrCode.shop) {
                shop = qrCode.shop;
            }
        }

        if (!shop) {
            return res.json({
                success: true,
                isInternal: false,
                message: 'Not a QR NEXUS code',
                source: 'cloud'
            });
        }

        // Record scan in cloud
        const qrCode = await db.getQRCodeByShop(shop.id);
        if (qrCode) {
            await db.recordScan(qrCode.id, shop.id, {
                source: 'scan',
                ipHash: req.ip ? require('crypto').createHash('sha256').update(req.ip).digest('hex').substring(0, 16) : null,
                userAgent: req.get('User-Agent')?.substring(0, 200)
            });
        }

        res.json({
            success: true,
            isInternal: true,
            data: shop,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/qr/generate
 * Generate QR code for new shop (cloud)
 */
router.post('/generate', async (req, res, next) => {
    try {
        const { name, link, category, description } = req.body;

        if (!name || !link || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Create shop with QR in cloud
        const shop = await db.createShop({
            name: name.trim(),
            link: link.trim(),
            category,
            description: description?.trim()
        });

        res.status(201).json({
            success: true,
            data: {
                shopId: shop.id,
                qrId: shop.qr_id,
                qrContent: shop.qr_content || `qrnexus://${shop.id}`,
                shop: shop
            },
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/qr/:id
 * Get QR code details (cloud)
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const qrCode = await db.getQRCode(id);

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                error: 'QR code not found'
            });
        }

        res.json({
            success: true,
            data: qrCode,
            source: 'cloud'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
