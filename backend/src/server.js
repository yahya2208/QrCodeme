/**
 * Qr Id - Backend Server
 * Main Entry Point
 * 
 * This server acts as a middleware between the frontend and Supabase.
 * All API keys are kept secure on the server side.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const storesRouter = require('./routes/stores');
const qrRouter = require('./routes/qr');
const analyticsRouter = require('./routes/analytics');
const nexusRouter = require('./routes/nexus');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Required for Vercel/proxied environments to get correct client IP)
app.set('trust proxy', 1);

// ===================
// SECURITY MIDDLEWARE
// ===================

// CORS: Allow origins (MUST be before other middleware for preflight)
const allowedOrigins = [
    'https://qrme-nu.vercel.app',
    'https://qrme.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:5173'
];

if (process.env.ALLOWED_ORIGINS) {
    allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
}

app.use(cors((req, callback) => {
    const origin = req.header('Origin');
    const corsOptions = {
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: true,
        optionsSuccessStatus: 200
    };

    // 1. Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
        corsOptions.origin = true;
        return callback(null, corsOptions);
    }

    // 2. Allow any localhost origin
    const isLocalhost = origin.startsWith('http://localhost:') ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:');

    // 3. Allow same-origin (if deployed on Vercel or similar)
    const isSameOrigin = origin.includes('vercel.app') ||
        (process.env.VERCEL_URL && origin.includes(process.env.VERCEL_URL));

    // 4. Check if origin matches allowed list
    const isAllowedOrigin = allowedOrigins.indexOf(origin) !== -1;

    if (isAllowedOrigin || isLocalhost || isSameOrigin) {
        corsOptions.origin = true;
    } else {
        console.warn(`[CORS] Rejected Origin: ${origin}`);
        corsOptions.origin = false;
    }

    callback(null, corsOptions);
}));

// Helmet: Set security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate Limiting: Prevent abuse
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Reduced from 1000 for better security
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', globalLimiter);

// Strict Auth Limiter: Prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per 15 minutes
    message: { success: false, error: 'Too many authentication attempts, please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth', authLimiter);

// Body parsing - CRITICAL: Must be before routes
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===================
// REQUEST LOGGING
// ===================
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ===================
// API ROUTES
// ===================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Stores API
app.use('/api/shops', storesRouter);

// QR Code API
app.use('/api/qr', qrRouter);

// Analytics API
app.use('/api/analytics', analyticsRouter);

// Nexus ID API
app.use('/api/nexus', nexusRouter);

// Secure Discovery, User & Auth APIs (Zero-Trust)
const discoveryRouter = require('./routes/discovery');
const userRouter = require('./routes/user');
const codesRouter = require('./routes/codes');
const authRouter = require('./routes/auth');
const referralRouter = require('./routes/referral');
const { supabase } = require('./config/supabase');
const crypto = require('crypto');

const adminRouter = require('./routes/admin');

app.use('/api/auth', authRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/user', userRouter);
app.use('/api/codes', codesRouter);
app.use('/api/referral', referralRouter);
app.use('/api/admin', adminRouter);

/**
 * GET Shorthand Referral Redirect
 * /r/:referrerId
 */
app.get('/r/:referrerId', async (req, res) => {
    try {
        const { referrerId } = req.params;

        // Check if referral ID exists in DB (to prevent invalid redirects)
        const { data: identity } = await supabase
            .from('nexus_identities')
            .select('id')
            .eq('id', referrerId)
            .maybeSingle();

        const frontendUrl = (process.env.ALLOWED_ORIGINS?.split(',')[0]) || 'http://localhost:5500';

        if (identity) {
            console.log(`[REFERRAL] Redirecting visitor for referrer: ${referrerId}`);
            res.redirect(`${frontendUrl}?ref=${referrerId}`);
        } else {
            res.redirect(frontendUrl);
        }
    } catch (err) {
        console.error('[REFERRAL REDIRECT ERROR]', err.message);
        res.redirect('/');
    }
});

/**
 * GET /q/:codeId - QR Code Scan Redirect
 * This is the URL encoded in printed QR codes.
 * When scanned, it:
 * 1. Records the scan in shop_stats
 * 2. Redirects to the actual destination (Facebook, Instagram, etc.)
 */
app.get('/q/:codeId', async (req, res) => {
    try {
        const codeId = parseInt(req.params.codeId, 10);

        if (isNaN(codeId)) {
            console.error('[QR SCAN] Invalid code ID');
            return res.status(400).send('Invalid QR Code');
        }

        console.log(`[QR SCAN] Code ${codeId} scanned!`);

        // 1. Get the code's destination URL
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id, value, name, service_id')
            .eq('id', codeId)
            .single();

        if (shopError || !shop) {
            console.error('[QR SCAN] Code not found:', codeId);
            const frontendUrl = (process.env.ALLOWED_ORIGINS?.split(',')[0]) || 'http://localhost:5500';
            return res.redirect(frontendUrl);
        }

        // 2. Record the scan (increment views counter)
        const { error: trackError } = await supabase
            .from('shop_stats')
            .upsert({
                shop_id: codeId,
                total_scans: 1,
                last_scan_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'shop_id',
                ignoreDuplicates: false
            });

        // If upsert didn't work, try increment
        if (trackError) {
            console.log('[QR SCAN] Upsert failed, trying RPC...');
            await supabase.rpc('record_scan', {
                p_qr_code_id: String(codeId),
                p_shop_id: codeId,
                p_source: 'qr_scan'
            });
        } else {
            // Increment the counter manually
            await supabase.rpc('record_view', {
                p_shop_id: codeId,
                p_source: 'qr_scan'
            });
        }

        console.log(`[QR SCAN] Recorded scan for code ${codeId}, redirecting to: ${shop.value}`);

        // 3. Prepare destination and Interstitial Page
        let destination = shop.value;
        if (!destination.startsWith('http://') && !destination.startsWith('https://')) {
            destination = 'https://' + destination;
        }

        const interstitialHtml = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QRme // Nexus Protocol</title>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@800&family=Cairo:wght@800&display=swap" rel="stylesheet">
            <style>
                body {
                    background: #030303;
                    color: white;
                    font-family: 'Cairo', 'Outfit', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                    overflow: hidden;
                }
                .logo { font-size: 3rem; margin-bottom: 2rem; color: #f0ff42; text-shadow: 0 0 20px rgba(240, 255, 66, 0.4); }
                .msg { font-size: 1.25rem; margin-bottom: 3rem; opacity: 0.8; max-width: 80%; }
                .progress-bar { width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; position: relative; }
                .progress-fill { width: 0%; height: 100%; background: #f0ff42; border-radius: 2px; animation: load 3s linear forwards; }
                @keyframes load { to { width: 100%; } }
                .cta { margin-top: 4rem; text-decoration: none; color: white; background: rgba(255,255,255,0.05); padding: 12px 24px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); transition: 0.3s; }
                .cta:hover { background: #f0ff42; color: black; }
            </style>
        </head>
        <body>
            <div class="logo">QRme</div>
            <div class="msg">جاري توجيهك إلى الوجهة المطلوبة...</div>
            <div class="msg" style="font-size: 0.9rem; margin-top: -2rem;">اكتشف هويتك الرقمية الخاصة مع QRme</div>
            <div class="progress-bar"><div class="progress-fill"></div></div>
            <a href="https://qrme.vercel.app" class="cta">ما هو QRme؟</a>

            <script>
                setTimeout(() => {
                    window.location.href = "${destination}";
                }, 3000);
            </script>
        </body>
        </html>`;

        res.send(interstitialHtml);
    } catch (err) {
        console.error('[QR SCAN ERROR]', err.message);
        const frontendUrl = (process.env.ALLOWED_ORIGINS?.split(',')[0]) || 'http://localhost:5500';
        res.redirect(frontendUrl);
    }
});

// ===================
// ERROR HANDLING
// ===================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    // Log error stack only on server
    console.error(`[ERROR] ${err.message}`, err.stack);

    // Don't leak error details in production
    const isProd = process.env.NODE_ENV === 'production';

    res.status(err.status || 500).json({
        success: false,
        error: isProd ? 'Internal server error' : err.message,
        ...(!isProd && { stack: err.stack })
    });
});

// ===================
// START SERVER
// ===================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║             Qr Id Backend Server           ║
╠════════════════════════════════════════════╣
║  Status:  ✅ Running                        ║
║  Port:    ${PORT}                              ║
║  Mode:    ${process.env.NODE_ENV || 'development'}                     ║
║  Time:    ${new Date().toISOString()}  ║
╚════════════════════════════════════════════╝
    `);
});

module.exports = app;
