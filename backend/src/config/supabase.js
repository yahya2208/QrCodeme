/**
 * QR NEXUS - Supabase Client
 * Server-side only - keys never exposed to frontend
 */

const { createClient } = require('@supabase/supabase-js');

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) return false;
    if (url.includes('your_supabase') || key.includes('your_supabase')) return false;

    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

// Create Supabase client only if properly configured
let supabase = null;

if (isSupabaseConfigured()) {
    try {
        supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );
        console.log('✅ Supabase connected');
    } catch (error) {
        console.warn('⚠️ Supabase connection failed:', error.message);
    }
} else {
    console.log('ℹ️ Using mock storage (Supabase not configured)');
}

// Mock data storage for development without Supabase
const mockStorage = {
    stores: [],

    // Generate unique ID
    generateId() {
        return 'qr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
};

/**
 * Database abstraction layer
 * Works with Supabase in production, mock storage in development
 */
const db = {
    // Get all stores, optionally filtered by category
    async getStores(category = 'all') {
        if (supabase) {
            let query = supabase
                .from('stores')
                .select('*')
                .order('created_at', { ascending: false });

            if (category !== 'all') {
                query = query.eq('category', category);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        // Mock mode
        if (category === 'all') return mockStorage.stores;
        return mockStorage.stores.filter(s => s.category === category);
    },

    // Get single store by ID
    async getStore(id) {
        if (supabase) {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .eq('id', id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        }

        // Mock mode
        return mockStorage.stores.find(s => s.id === id) || null;
    },

    // Create new store
    async createStore(storeData) {
        const store = {
            id: mockStorage.generateId(),
            name: storeData.name,
            link: storeData.link,
            category: storeData.category,
            scans: 0,
            views: 0,
            created_at: new Date().toISOString()
        };

        if (supabase) {
            const { data, error } = await supabase
                .from('stores')
                .insert([store])
                .select()
                .single();

            if (error) throw error;
            return data;
        }

        // Mock mode
        mockStorage.stores.unshift(store);
        return store;
    },

    // Increment scan count
    async incrementScan(id) {
        if (supabase) {
            const { error } = await supabase.rpc('increment_scan', { store_id: id });
            if (error) {
                // Fallback: manual increment
                const store = await this.getStore(id);
                if (store) {
                    await supabase
                        .from('stores')
                        .update({ scans: (store.scans || 0) + 1 })
                        .eq('id', id);
                }
            }
            return;
        }

        // Mock mode
        const store = mockStorage.stores.find(s => s.id === id);
        if (store) store.scans = (store.scans || 0) + 1;
    },

    // Increment view count
    async incrementView(id) {
        if (supabase) {
            const { error } = await supabase.rpc('increment_view', { store_id: id });
            if (error) {
                const store = await this.getStore(id);
                if (store) {
                    await supabase
                        .from('stores')
                        .update({ views: (store.views || 0) + 1 })
                        .eq('id', id);
                }
            }
            return;
        }

        // Mock mode
        const store = mockStorage.stores.find(s => s.id === id);
        if (store) store.views = (store.views || 0) + 1;
    },

    // Search stores
    async searchStores(term) {
        if (supabase) {
            const { data, error } = await supabase
                .from('stores')
                .select('*')
                .or(`name.ilike.%${term}%,category.ilike.%${term}%`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        }

        // Mock mode
        const lowerTerm = term.toLowerCase();
        return mockStorage.stores.filter(s =>
            s.name.toLowerCase().includes(lowerTerm) ||
            s.category.toLowerCase().includes(lowerTerm)
        );
    },

    // Get statistics
    async getStats() {
        const stores = await this.getStores();
        return {
            totalQR: stores.length,
            totalScans: stores.reduce((sum, s) => sum + (s.scans || 0), 0),
            totalViews: stores.reduce((sum, s) => sum + (s.views || 0), 0),
            categories: 8
        };
    }
};

module.exports = { supabase, db };
