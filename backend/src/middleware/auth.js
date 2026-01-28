const { supabase } = require('../config/supabase');

/**
 * Advanced Zero-Trust Auth Middleware
 * Verifies the user JWT and attaches the user object to the request.
 * If the token is invalid or missing, the request is rejected immediately.
 */
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.warn(`[SECURITY] Unauthorized access attempt from IP: ${req.ip}`);
            return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
        }

        // Verify token with Supabase (Server-side verification)
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data || !data.user) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
        }

        const user = data.user;

        // Attach user to request object
        req.user = user;
        next();
    } catch (err) {
        console.error('[AUTH ERROR]', err.message);
        res.status(500).json({ success: false, error: 'Internal authentication error.' });
    }
};

/**
 * Role-Based Access Control (RBAC) - Optional for future expansion
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
