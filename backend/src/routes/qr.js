/**
 * QR NEXUS - QR Code API Routes
 * Handles QR code generation and resolution
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/supabase');

/**
 * GET /api/qr/resolve/:id
 * Resolve a QR code to get store information
 * Used when scanning internal QR codes
 */
router.get('/resolve/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const store = await db.getStore(id);

        if (!store) {
            return res.json({
                success: true,
                isInternal: false,
                message: 'Not a QR NEXUS code'
            });
        }

        // Increment scan count
        await db.incrementScan(id);

        res.json({
            success: true,
            isInternal: true,
            data: store
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/qr/generate
 * Generate QR code data for a new store
 * Returns the store ID to be encoded in QR
 */
router.post('/generate', async (req, res, next) => {
    try {
        const { name, link, category } = req.body;

        // Validation is handled by stores route
        if (!name || !link || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Create store
        const store = await db.createStore({
            name: name.trim(),
            link: link.trim(),
            category
        });

        // Return QR data
        res.status(201).json({
            success: true,
            data: {
                storeId: store.id,
                qrContent: `qrnexus://${store.id}`,
                store: store
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
