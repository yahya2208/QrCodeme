const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const { body, validationResult } = require('express-validator');

/**
 * POST /api/auth/login
 * Public: Authenticates user and returns JWT session
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        let { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (error.message === 'Email not confirmed') {
                return res.status(403).json({
                    success: false,
                    error: 'يرجى تأكيد بريدك الإلكتروني أولاً. تحقق من صندوق الوارد.',
                    needsEmailConfirmation: true,
                    email: email
                });
            }
            console.error(`[AUTH ERROR] Supabase signin failed: ${error.message}`);
            return res.status(error.status || 401).json({ success: false, error: error.message });
        }

        // FAST-TRACK: Auto-confirm email if not confirmed (Development privilege)
        // This block is now partially redundant due to the explicit handling above,
        // but can remain as a fallback or for other scenarios where email_confirmed_at might be null
        // without an explicit 'Email not confirmed' error from signInWithPassword.
        // Removed: AUTO-CONFIRM privilege fallback (Security Vulnerability Fixed)
        if (data.user && !data.user.email_confirmed_at) {
            return res.status(403).json({
                success: false,
                error: 'البريد غير مؤكد. يرجى مراجعة رسائل البريد الإلكتروني.',
                needsEmailConfirmation: true
            });
        }

        // AUTO-ENSURE PROFILE: If login is successful, make sure they have a row in public.users
        try {
            const { data: profile } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            if (!profile) {
                console.log(`[AUTH] Creating missing profile for user: ${data.user.id}`);
                await supabase.from('users').insert({
                    id: data.user.id,
                    full_name: data.user.user_metadata?.full_name || 'User',
                    email: data.user.email
                });
            }
        } catch (pErr) {
            console.warn('[AUTH] Profile sync during login failed:', pErr.message);
        }

        res.json({
            success: true,
            data: {
                user: data.user,
                session: data.session
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/auth/register
 * Public: Registers a new user via Supabase Auth
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('بريد إلكتروني غير صالح'),
    body('password').isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    body('full_name').trim().isLength({ min: 3 }).withMessage('الاسم يجب أن يكون 3 أحرف على الأقل')
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password, full_name, referral_code } = req.body;

        // SignUp via Supabase
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name }
            }
        });

        if (error) {
            return res.status(error.status || 400).json({ success: false, error: error.message });
        }

        // Optional: Manual profile creation if not handled by triggers
        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    full_name,
                    email
                });

            if (profileError) {
                console.warn('Profile creation warning:', profileError.message);
            } else if (referral_code) {
                // Securely award referral points
                console.log(`[AUTH] Processing referral ${referral_code} for new user ${data.user.id}`);
                try {
                    await supabase.rpc('award_referral_points_admin', {
                        p_referrer_id: referral_code,
                        p_points: 10
                    });

                    // Log the conversion
                    await supabase.from('referral_conversions').insert({
                        referrer_id: referral_code,
                        referred_user_id: data.user.id
                    });
                } catch (refErr) {
                    console.error('[AUTH] Referral processing failed:', refErr.message);
                }
            }
        }

        res.json({
            success: true,
            data: {
                user: data.user,
                session: data.session // Might be null if email confirmation required
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/auth/me
 * Private: Verifies current session token and returns user info
 */
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data || !data.user) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

        const user = data.user;

        res.json({
            success: true,
            data: { user }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/auth/resend
 * Public: Resends verification email
 */
router.post('/resend', async (req, res, next) => {
    try {
        const { email, type } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const { error } = await supabase.auth.resend({
            type: type || 'signup',
            email: email
        });

        if (error) {
            return res.status(error.status || 400).json({ success: false, error: error.message });
        }

        res.json({ success: true, message: 'Verification email resent successfully' });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/auth/confirm-me
 * DEBUG ONLY: Force confirm a user for development
 */
router.post('/confirm-me', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'Email required' });

        // Get user by email using admin API
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email === email);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        // Force confirm
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (confirmError) throw confirmError;

        console.log(`[AUTH DEBUG] Manually confirmed user: ${email}`);
        res.json({ success: true, message: 'User confirmed. Please try logging in now.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
