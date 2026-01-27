// QR NEXUS - Frontend Configuration
// No sensitive keys here - all handled by backend

const getHost = () => {
    // Check if we are running in a local file or local server
    const host = window.location.hostname;
    if (!host || host === 'localhost' || host === '127.0.0.1') {
        return 'localhost'; // Default to localhost for local dev
    }
    return host;
};

const CONFIG = {
    // Backend API URL - use current host to support network discovery
    API_URL: `http://${getHost()}:3001/api`,
    WEB_URL: window.location.protocol === 'file:' ? 'http://localhost:3000' : window.location.origin,

    // App Settings
    APP_NAME: 'Qr Id',
    APP_VERSION: '1.0.0',

    // Categories (for UI only)
    CATEGORIES: {
        all: { name: 'الكل', icon: '🌟' },
        pharmacy: { name: 'صيدلية', icon: '💊' },
        phones: { name: 'هواتف', icon: '📱' },
        restaurant: { name: 'مطعم', icon: '🍽️' },
        cafe: { name: 'مقهى', icon: '☕' },
        maintenance: { name: 'صيانة', icon: '🔧' },
        fashion: { name: 'أزياء', icon: '👔' },
        services: { name: 'خدمات', icon: '⚡' },
        other: { name: 'أخرى', icon: '🏪' }
    },

    // Animation Timings
    ANIMATION: {
        LOADER_DURATION: 2500,
        PAGE_TRANSITION: 500,
        MODAL_TRANSITION: 400,
        RIPPLE_DURATION: 600
    },

    // QR Settings
    QR: {
        SIZE: 200,
        COLOR_DARK: '#0a0a0a',
        COLOR_LIGHT: '#ffffff',
        CORRECTION_LEVEL: 'H'
    }
};

// Freeze config (careful with dynamic objects)
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.QR);
