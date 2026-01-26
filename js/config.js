// QR NEXUS - Configuration
const CONFIG = {
    // Supabase Configuration
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
    
    // App Settings
    APP_NAME: 'QR NEXUS',
    APP_VERSION: '1.0.0',
    
    // Categories
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

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.CATEGORIES);
Object.freeze(CONFIG.ANIMATION);
Object.freeze(CONFIG.QR);
