// QR NEXUS - API Client
// Connects frontend to backend API (NOT directly to Supabase)

class APIClient {
    constructor() {
        // Backend API URL - change in production
        this.baseURL = 'http://localhost:3001/api';
        this.isOnline = true;
    }

    // Generic fetch wrapper with error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error.message);

            // If server is down, switch to offline mode
            if (error.message.includes('Failed to fetch')) {
                this.isOnline = false;
                console.warn('⚠️ Backend offline - using local storage');
            }

            throw error;
        }
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// Database layer using API client with localStorage fallback
class Database {
    constructor() {
        this.api = new APIClient();
        this.useLocalFallback = false;
    }

    async init() {
        // Check if backend is available
        try {
            await this.api.get('/health');
            console.log('✅ Backend API connected');
            this.useLocalFallback = false;
        } catch {
            console.warn('⚠️ Backend unavailable - using localStorage');
            this.useLocalFallback = true;
        }
        return this;
    }

    // Get all stores
    async getStores(category = 'all') {
        if (this.useLocalFallback) {
            return this._getLocalStores(category);
        }

        try {
            const response = await this.api.get(`/stores?category=${category}`);
            return response.data || [];
        } catch {
            return this._getLocalStores(category);
        }
    }

    // Search stores
    async searchStores(term) {
        if (this.useLocalFallback) {
            const stores = this._getLocalStores();
            const lowerTerm = term.toLowerCase();
            return stores.filter(s =>
                s.name.toLowerCase().includes(lowerTerm) ||
                s.category.toLowerCase().includes(lowerTerm)
            );
        }

        try {
            const response = await this.api.get(`/stores/search?q=${encodeURIComponent(term)}`);
            return response.data || [];
        } catch {
            return [];
        }
    }

    // Get store by ID
    async getStore(id) {
        if (this.useLocalFallback) {
            const stores = this._getLocalStores();
            return stores.find(s => s.id === id) || null;
        }

        try {
            const response = await this.api.get(`/stores/${id}`);
            return response.data;
        } catch {
            return null;
        }
    }

    // Create store
    async createStore(storeData) {
        if (this.useLocalFallback) {
            return this._createLocalStore(storeData);
        }

        try {
            const response = await this.api.post('/qr/generate', storeData);
            return response.data.store;
        } catch {
            return this._createLocalStore(storeData);
        }
    }

    // Increment scan count
    async incrementScan(id) {
        if (this.useLocalFallback) {
            this._incrementLocalStat(id, 'scans');
            return;
        }

        try {
            await this.api.post(`/stores/${id}/scan`);
        } catch {
            this._incrementLocalStat(id, 'scans');
        }
    }

    // Increment view count
    async incrementView(id) {
        if (this.useLocalFallback) {
            this._incrementLocalStat(id, 'views');
            return;
        }

        try {
            await this.api.post(`/stores/${id}/view`);
        } catch {
            this._incrementLocalStat(id, 'views');
        }
    }

    // Get stats
    async getStats() {
        if (this.useLocalFallback) {
            const stores = this._getLocalStores();
            return {
                totalQR: stores.length,
                totalScans: stores.reduce((sum, s) => sum + (s.scans || 0), 0),
                categories: 8
            };
        }

        try {
            const response = await this.api.get('/analytics/stats');
            return response.data;
        } catch {
            return { totalQR: 0, totalScans: 0, categories: 8 };
        }
    }

    // ================
    // LOCAL STORAGE FALLBACK
    // ================

    _generateId() {
        return 'qr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    _getLocalStores(category = 'all') {
        try {
            const stores = JSON.parse(localStorage.getItem('qr_nexus_stores') || '[]');
            if (category === 'all') return stores;
            return stores.filter(s => s.category === category);
        } catch {
            return [];
        }
    }

    _setLocalStores(stores) {
        localStorage.setItem('qr_nexus_stores', JSON.stringify(stores));
    }

    _createLocalStore(storeData) {
        const store = {
            id: this._generateId(),
            name: storeData.name,
            link: storeData.link,
            category: storeData.category,
            scans: 0,
            views: 0,
            created_at: new Date().toISOString()
        };

        const stores = this._getLocalStores();
        stores.unshift(store);
        this._setLocalStores(stores);
        return store;
    }

    _incrementLocalStat(id, field) {
        const stores = this._getLocalStores();
        const store = stores.find(s => s.id === id);
        if (store) {
            store[field] = (store[field] || 0) + 1;
            this._setLocalStores(stores);
        }
    }
}

// Export instance
const db = new Database();
