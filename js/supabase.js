// QR NEXUS - API Client
// Connects frontend to backend API (NOT directly to Supabase)
// ALL DATA IS CLOUD-BASED - No localStorage

class APIClient {
    constructor() {
        // Use the global config if available, otherwise fallback
        this.baseURL = (typeof CONFIG !== 'undefined') ? CONFIG.API_URL : 'http://localhost:3001/api';
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Database layer - Cloud only, no fallback
class Database {
    constructor() {
        this.api = new APIClient();
        this.isConnected = false;
    }

    async init() {
        try {
            const response = await this.api.get('/health');
            this.isConnected = response.success;
            console.log('✅ Connected to cloud backend');
        } catch (error) {
            console.error('❌ Backend connection failed:', error.message);
            this.isConnected = false;
        }
        return this;
    }

    // Get all shops (cloud)
    async getStores(category = 'all') {
        try {
            const endpoint = category === 'all'
                ? '/shops'
                : `/shops?category=${category}`;
            const response = await this.api.get(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Failed to get shops:', error);
            return [];
        }
    }

    // Search shops (cloud)
    async searchStores(term) {
        try {
            const response = await this.api.get(`/shops/search?q=${encodeURIComponent(term)}`);
            return response.data || [];
        } catch {
            return [];
        }
    }

    // Get shop by ID (cloud)
    async getStore(id) {
        try {
            const response = await this.api.get(`/shops/${id}`);
            return response.data;
        } catch {
            return null;
        }
    }

    // Create shop with QR (cloud)
    async createStore(storeData) {
        try {
            const response = await this.api.post('/qr/generate', storeData);
            return response.data.shop || response.data;
        } catch (error) {
            console.error('Failed to create shop:', error);
            throw error;
        }
    }

    // Record scan (cloud)
    async incrementScan(id) {
        try {
            await this.api.post(`/shops/${id}/scan`, { source: 'web' });
        } catch (error) {
            console.error('Failed to record scan:', error);
        }
    }

    // Record view (cloud)
    async incrementView(id) {
        try {
            await this.api.post(`/shops/${id}/view`, { source: 'web' });
        } catch (error) {
            console.error('Failed to record view:', error);
        }
    }

    // Get global stats (cloud)
    async getStats() {
        try {
            const response = await this.api.get('/analytics/stats');
            return {
                totalQR: response.data.totalQRCodes || 0,
                totalScans: response.data.totalScans || 0,
                categories: response.data.totalCategories || 8
            };
        } catch {
            return { totalQR: 0, totalScans: 0, categories: 8 };
        }
    }

    // Get categories (cloud)
    async getCategories() {
        try {
            const response = await this.api.get('/analytics/categories');
            return response.data || [];
        } catch {
            return [];
        }
    }
}

// Export instance
const db = new Database();
