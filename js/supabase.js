// QRme - SECURE GATEWAY CLIENT V7
// 🛡️ ZERO-TRUST ARCHITECTURE
// All database and auth operations are proxied through the backend server.
// Direct Supabase interaction is strictly forbidden.

const API_BASE = 'http://localhost:3001/api';

/**
 * Custom Supabase Client Mock
 * Proxies auth methods to the backend.
 */
const supabaseClient = {
    auth: {
        async getUser() {
            const session = this.getSessionFromStorage();
            if (!session) return { data: { user: null }, error: null };

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                });
                const result = await response.json();
                if (result.success) return { data: { user: result.data.user }, error: null };
                return { data: { user: null }, error: result.error };
            } catch (err) {
                return { data: { user: null }, error: err.message };
            }
        },

        async getSession() {
            const session = this.getSessionFromStorage();
            return { data: { session }, error: null };
        },

        async signInWithPassword({ email, password }) {
            console.log('[DEBUG] Sending login request for:', email);
            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                console.log('[DEBUG] Login response status:', response.status);
                const result = await response.json();
                if (result.success) {
                    this.saveSession(result.data.session);
                    return { data: result.data, error: null };
                }
                console.error('[DEBUG] Login failed with error:', result.error);
                return { data: { user: null, session: null }, error: { message: result.error } };
            } catch (err) {
                return { data: { user: null, session: null }, error: err };
            }
        },

        async signUp({ email, password, options }) {
            const fullName = options?.data?.full_name || 'User';
            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, full_name: fullName })
                });
                const result = await response.json();
                if (result.success) return { data: result.data, error: null };
                return { data: { user: null, session: null }, error: { message: result.error } };
            } catch (err) {
                return { data: { user: null, session: null }, error: err };
            }
        },

        async resend({ type, email }) {
            try {
                const response = await fetch(`${API_BASE}/auth/resend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, type })
                });
                const result = await response.json();
                if (result.success) return { data: result.data, error: null };
                return { data: null, error: { message: result.error } };
            } catch (err) {
                return { data: null, error: err };
            }
        },

        async signOut() {
            localStorage.removeItem('qrme_session');
            return { error: null };
        },

        onAuthStateChange(callback) {
            // Basic emulation for state changes
            // In a real app, you'd use a more robust event emitter
            const session = this.getSessionFromStorage();
            if (session) callback('SIGNED_IN', session);
        },

        // Helper methods
        saveSession(session) {
            if (session) localStorage.setItem('qrme_session', JSON.stringify(session));
        },

        getSessionFromStorage() {
            const s = localStorage.getItem('qrme_session');
            return s ? JSON.parse(s) : null;
        }
    }
};

// Compatibility export
const db = supabaseClient.auth;
