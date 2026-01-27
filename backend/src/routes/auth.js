const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

/**
 * POST /api/auth/login
 * Public: Authenticates user and returns JWT session
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        if (!email || !password) {
            console.warn('[AUTH] Missing email or password in request body');
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        let { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            // If email not confirmed, handle it immediately via admin privileges
            if (error.message === 'Email not confirmed' || error.status === 400) {
                console.log(`[AUTH] Attempting emergency auto-confirm for: ${email}`);

                // Find user ID by email
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                const targetUser = users?.find(u => u.email === email);

                if (targetUser) {
                    await supabase.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
                    // Try login again after confirm
                    const retry = await supabase.auth.signInWithPassword({ email, password });
                    data = retry.data;
                    error = retry.error;
                }
            }

            if (error) {
                console.error(`[AUTH ERROR] Supabase signin failed: ${error.message}`);
                return res.status(error.status || 401).json({ success: false, error: error.message });
            }
        }

        // FAST-TRACK: Auto-confirm email if not confirmed (Development privilege)
        // This block is now partially redundant due to the explicit handling above,
        // but can remain as a fallback or for other scenarios where email_confirmed_at might be null
        // without an explicit 'Email not confirmed' error from signInWithPassword.
        if (data.user && !data.user.email_confirmed_at) {
            console.log(`[AUTH] Auto-confirming email for: ${email}`);
            const { error: confirmError } = await supabase.auth.admin.updateUserById(
                data.user.id,
                { email_confirm: true }
            );
            if (confirmError) console.warn('[AUTH] Admin confirm failed:', confirmError.message);
            else data.user.email_confirmed_at = new Date().toISOString();
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
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, full_name } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, error: 'All fields are required' });
        }

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
            if (profileError) console.warn('Profile creation warning:', profileError.message);
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
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }

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
