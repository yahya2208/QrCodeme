// QR NEXUS - GLOBAL CONFIG V5
// Security Note: Real keys should be in .env for production

const CONFIG = {
    // SUPABASE CONFIG (User: Update these in your dashboard)
    SUPABASE_URL: 'https://fhyjymjgojttbqfsrlvr.supabase.co',
    // 🛡️ SUPABASE_KEY removed - All operations now go through the Backend Gateway
    // to maintain Zero-Trust Architecture.

    // APP SETTINGS
    VERSION: '5.0.0-PRO',
    DEFAULT_LANG: 'ar',

    // THEME
    COLORS: {
        NEON_YELLOW: '#f0ff42',
        BG_VOID: '#050505'
    }
};

// Global Helper
const isRTL = () => document.documentElement.dir === 'rtl';
function getT(key) {
    if (typeof i18n !== 'undefined') return i18n.t(key);
    return key;
}
