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

// ===================
// SECURITY MIDDLEWARE
// ===================

// Helmet: Set security headers
app.use(helmet());

// CORS: Allow only specified origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true
}));

// Rate Limiting: Prevent abuse
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
    message: {
        success: false,
        error: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

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

app.use('/api/auth', authRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/user', userRouter);
app.use('/api/codes', codesRouter);
app.use('/api/referral', referralRouter);

/**
 * GET Shorthand Referral Redirect
 * /r/:referrerId
 */
app.get('/r/:referrerId', async (req, res) => {
    try {
        const { referrerId } = req.params;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');

        console.log(`[REFERRAL] Hit for ${referrerId} from IP Hash: ${ipHash.substring(0, 10)}...`);

        // Check for unique conversion
        const { data: existing } = await supabase
            .from('referral_conversions')
            .select('id')
            .eq('referrer_id', referrerId)
            .eq('visitor_ip_hash', ipHash)
            .maybeSingle();

        if (!existing) {
            // New conversion
            const { error: convError } = await supabase
                .from('referral_conversions')
                .insert({
                    referrer_id: referrerId,
                    visitor_ip_hash: ipHash
                });

            if (!convError) {
                // Award points via RPC
                await supabase.rpc('award_referral_points_admin', {
                    p_referrer_id: referrerId,
                    p_points: 10
                });
                console.log(`[REFERRAL] Points awarded to ${referrerId}`);
            }
        }

        // Redirect to main frontend app
        const frontendUrl = (process.env.ALLOWED_ORIGINS?.split(',')[0]) || 'http://localhost:5500';
        res.redirect(`${frontendUrl}?ref=${referrerId}`);
    } catch (err) {
        console.error('[REFERRAL REDIRECT ERROR]', err.message);
        res.redirect('/');
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
    console.error(`[ERROR] ${err.message}`);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        success: false,
        error: isDev ? err.message : 'Internal server error',
        ...(isDev && { stack: err.stack })
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
