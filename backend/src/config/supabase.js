/**
 * QR NEXUS - Supabase Database Layer
 * Server-side only - ALL data stored in cloud
 * NO localStorage fallback - Cloud is mandatory
 */

const { createClient } = require('@supabase/supabase-js');

// Validate Supabase configuration
const validateConfig = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
        throw new Error('❌ FATAL: SUPABASE_URL and SUPABASE_SERVICE_KEY are required');
    }

    if (url.includes('your_supabase') || key.includes('your_supabase')) {
        throw new Error('❌ FATAL: Supabase credentials not configured properly');
    }

    try {
        new URL(url);
    } catch {
        throw new Error('❌ FATAL: Invalid SUPABASE_URL format');
    }

    return { url, key };
};

// Initialize Supabase client
let supabase = null;

try {
    const { url, key } = validateConfig();
    supabase = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    console.log('✅ Supabase connected - Cloud storage active');
} catch (error) {
    console.warn('⚠️ Supabase Initialization Warning:', error.message);

    // Create a robust recursion proxy to handle any chain of calls/properties
    // This prevents "TypeError: ... is not a function" crashes
    const throwNoConfig = () => {
        throw new Error('Database operation failed: Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY on Vercel.');
    };

    const handler = {
        get: (target, prop) => {
            // Return the same proxy for any property access
            return new Proxy(() => { }, handler);
        },
        apply: (target, thisArg, argumentsList) => {
            // Throw the informative error if called as a function
            throwNoConfig();
        }
    };

    supabase = new Proxy(() => { }, handler);
}

/**
 * Database operations - ALL cloud-based
 */
const db = {
    // ================
    // CATEGORIES
    // ================
    async getCategories() {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (error) throw error;
        return data || [];
    },

    // ================
    // SHOPS
    // ================
    async getShops(categoryId = null) {
        let query = supabase
            .from('shops')
            .select(`
                *,
                category:categories(*),
                stats:shop_stats(total_scans, total_views)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (categoryId && categoryId !== 'all') {
            query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Flatten stats
        return (data || []).map(shop => ({
            ...shop,
            scans: shop.stats?.[0]?.total_scans || 0,
            views: shop.stats?.[0]?.total_views || 0,
            stats: undefined
        }));
    },

    async getShop(id) {
        const { data, error } = await supabase
            .from('shops')
            .select(`
                *,
                category:categories(*),
                stats:shop_stats(total_scans, total_views),
                qr_code:qr_codes(id, qr_content)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (!data) return null;

        return {
            ...data,
            scans: data.stats?.[0]?.total_scans || 0,
            views: data.stats?.[0]?.total_views || 0,
            qr_id: data.qr_code?.[0]?.id,
            qr_content: data.qr_code?.[0]?.qr_content,
            stats: undefined,
            qr_code: undefined
        };
    },

    async searchShops(term) {
        const { data, error } = await supabase
            .from('shops')
            .select(`
                *,
                category:categories(*),
                stats:shop_stats(total_scans, total_views)
            `)
            .eq('is_active', true)
            .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(shop => ({
            ...shop,
            scans: shop.stats?.[0]?.total_scans || 0,
            views: shop.stats?.[0]?.total_views || 0,
            stats: undefined
        }));
    },

    // ================
    // CREATE SHOP WITH QR
    // ================
    async createShop(shopData) {
        // Use the database function for atomic creation
        const { data, error } = await supabase
            .rpc('create_shop_with_qr_v2', {
                p_name: shopData.name,
                p_link: shopData.link,
                p_category_id: shopData.category,
                p_identity_id: shopData.identityId,
                p_description: shopData.description || null
            });

        if (error) {
            console.error('RPC Error:', error);
            // Fallback to old version if v2 not yet migrated
            const { data: oldData, error: oldError } = await supabase
                .rpc('create_shop_with_qr', {
                    p_name: shopData.name,
                    p_link: shopData.link,
                    p_category_id: shopData.category,
                    p_description: shopData.description || null
                });
            if (oldError) throw oldError;
            return await this.getShop(oldData[0].shop_id);
        }

        const result = data[0];
        return await this.getShop(result.shop_id);
    },

    async getNexusIdentityWithShops(id) {
        const { data, error } = await supabase
            .from('nexus_identities')
            .select(`
                *,
                shops:shops(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // ================
    // RECORD SCAN (Cloud)
    // ================
    async recordScan(qrCodeId, shopId, metadata = {}) {
        const { data, error } = await supabase
            .rpc('record_scan', {
                p_qr_code_id: qrCodeId,
                p_shop_id: shopId,
                p_source: metadata.source || 'app',
                p_ip_hash: metadata.ipHash || null,
                p_user_agent: metadata.userAgent || null
            });

        if (error) throw error;
        return data; // Returns scan ID
    },

    // ================
    // RECORD VIEW (Cloud)
    // ================
    async recordView(shopId, metadata = {}) {
        const { data, error } = await supabase
            .rpc('record_view', {
                p_shop_id: shopId,
                p_source: metadata.source || 'app',
                p_ip_hash: metadata.ipHash || null,
                p_user_agent: metadata.userAgent || null
            });

        if (error) throw error;
        return data; // Returns view ID
    },

    // ================
    // STATISTICS (Cloud)
    // ================
    async getGlobalStats() {
        const { data, error } = await supabase
            .rpc('get_global_stats');

        if (error) throw error;

        const stats = data[0] || {};
        return {
            totalShops: parseInt(stats.total_shops) || 0,
            totalQRCodes: parseInt(stats.total_qr_codes) || 0,
            totalScans: parseInt(stats.total_scans) || 0,
            totalViews: parseInt(stats.total_views) || 0,
            totalCategories: parseInt(stats.total_categories) || 0
        };
    },

    async getShopStats(shopId) {
        const { data, error } = await supabase
            .from('shop_stats')
            .select('*')
            .eq('shop_id', shopId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return data || { total_scans: 0, total_views: 0 };
    },

    // ================
    // QR CODES
    // ================
    async getQRCode(id) {
        const { data, error } = await supabase
            .from('qr_codes')
            .select(`
                *,
                shop:shops(*)
            `)
            .eq('id', id)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async getQRCodeByShop(shopId) {
        const { data, error } = await supabase
            .from('qr_codes')
            .select('*')
            .eq('shop_id', shopId)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }
};

module.exports = { supabase, db };
