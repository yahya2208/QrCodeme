// QR NEXUS - Main Application

class QRNexusApp {
    constructor() {
        this.currentPage = 'home';
        this.stores = [];
        this.currentCategory = 'all';
        this.isLoading = true;
    }

    async init() {
        console.log('🚀 QR NEXUS Initializing...');

        try {
            // Initialize modules without blocking too much
            await db.init().catch(e => console.warn('DB Init Warning:', e));
            animations.init();
            await scanner.init().catch(e => console.warn('Scanner Init Warning:', e));

            // Setup event listeners
            this.setupNavigation();
            this.setupCreateModal();
            this.setupSearch();
            this.setupCategories();
            this.setupNexusId();

            // Load initial data
            this.loadStats().catch(e => console.error('Stats Error:', e));
            this.loadStores().catch(e => console.error('Stores Error:', e));

        } catch (error) {
            console.error('💥 Critical Init Failure:', error);
        }

        // Hide loader after animation
        setTimeout(() => this.hideLoader(), CONFIG.ANIMATION.LOADER_DURATION || 2000);

        console.log('✅ QR NEXUS Ready!');
    }

    // Hide cinematic loader
    hideLoader() {
        const loader = document.getElementById('cinematic-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 800);
        }
        this.isLoading = false;
    }

    // Setup navigation
    setupNavigation() {
        // Nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = btn.dataset.page;
                if (page) this.navigateTo(page);
                animations.createRipple(e, btn);
            });
        });

        // Home action cards
        document.getElementById('btn-create-qr')?.addEventListener('click', (e) => {
            animations.createRipple(e, e.currentTarget);
            this.openCreateModal();
        });

        document.getElementById('btn-discover')?.addEventListener('click', (e) => {
            animations.createRipple(e, e.currentTarget);
            this.navigateTo('discover');
        });

        document.getElementById('btn-scan')?.addEventListener('click', (e) => {
            animations.createRipple(e, e.currentTarget);
            this.navigateTo('scan');
        });

        document.getElementById('btn-nexus-id')?.addEventListener('click', (e) => {
            animations.createRipple(e, e.currentTarget);
            this.navigateTo('nexus-id');
        });

        // Add first store button
        document.getElementById('btn-add-first')?.addEventListener('click', () => {
            this.openCreateModal();
        });
    }

    // Navigate to page
    navigateTo(page) {
        if (page === this.currentPage) return;

        const fromPage = document.querySelector('.page.active');
        const toPage = document.getElementById(`page-${page}`);

        if (!toPage) return;

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        // Page transition
        animations.pageTransition(fromPage, toPage, () => {
            fromPage?.classList.remove('active');
            toPage.classList.add('active');
        });

        this.currentPage = page;

        // Page-specific actions
        if (page === 'scan') {
            this.startScanner();
        } else {
            scanner.stop();
        }

        if (page === 'discover') {
            this.loadStores();
        }

        if (page === 'nexus-id') {
            this.triggerNexusEntry();
        }
    }

    // Setup create modal
    setupCreateModal() {
        const modal = document.getElementById('modal-create');
        const closeBtn = document.getElementById('modal-close-create');
        const form = document.getElementById('create-qr-form');
        const resultDiv = document.getElementById('qr-result');

        closeBtn?.addEventListener('click', () => {
            animations.closeModal(modal);
            this.resetCreateForm();
        });

        modal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            animations.closeModal(modal);
            this.resetCreateForm();
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.generateQR();
        });

        // QR result actions
        document.getElementById('btn-save-qr')?.addEventListener('click', () => this.saveQR());
        document.getElementById('btn-share-qr')?.addEventListener('click', () => this.shareQR());
        document.getElementById('btn-new-qr')?.addEventListener('click', () => this.resetCreateForm());
    }

    // Open create modal
    openCreateModal() {
        const modal = document.getElementById('modal-create');
        if (modal) {
            animations.openModal(modal);
        }
    }

    // Generate QR code
    async generateQR() {
        const name = document.getElementById('store-name')?.value?.trim();
        const link = document.getElementById('store-link')?.value?.trim();
        const profession = document.querySelector('input[name="profession"]:checked')?.value;

        if (!name || !link || !profession) {
            this.showToast('يرجى ملء جميع الحقول', 'error');
            return;
        }

        try {
            // Create store in database
            const store = await db.createStore({
                name,
                link,
                category: profession
            });

            // Generate QR code
            const qrContainer = document.getElementById('qr-code-container');
            qrContainer.innerHTML = '';

            // Create internal link for the store page
            const internalLink = `${window.location.origin}${window.location.pathname}?store=${store.id}`;

            new QRCode(qrContainer, {
                text: internalLink,
                width: CONFIG.QR.SIZE,
                height: CONFIG.QR.SIZE,
                colorDark: CONFIG.QR.COLOR_DARK,
                colorLight: CONFIG.QR.COLOR_LIGHT,
                correctLevel: QRCode.CorrectLevel.H
            });

            // Save current store for actions
            this.currentGeneratedStore = store;

            // Show result
            document.querySelector('.create-form')?.classList.add('hidden');
            document.getElementById('qr-result')?.classList.remove('hidden');

            // Flash effect
            animations.qrSuccessFlash();

            // Update stats
            await this.loadStats();

            this.showToast('تم إنشاء QR بنجاح! 🎉', 'success');

        } catch (error) {
            console.error('Error generating QR:', error);
            this.showToast('حدث خطأ أثناء الإنشاء', 'error');
        }
    }

    // Reset create form
    resetCreateForm() {
        const form = document.getElementById('create-qr-form');
        form?.reset();
        document.querySelector('.create-form')?.classList.remove('hidden');
        document.getElementById('qr-result')?.classList.add('hidden');
        document.getElementById('qr-code-container').innerHTML = '';
        this.currentGeneratedStore = null;
    }

    // Save QR as image
    saveQR() {
        const canvas = document.querySelector('#qr-code-container canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `qr-${this.currentGeneratedStore?.name || 'code'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        this.showToast('تم حفظ الصورة', 'success');
    }

    // Share QR
    async shareQR() {
        if (!navigator.share) {
            this.showToast('المشاركة غير مدعومة في هذا المتصفح', 'error');
            return;
        }

        const canvas = document.querySelector('#qr-code-container canvas');
        if (!canvas) return;

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'qr-code.png', { type: 'image/png' });

            await navigator.share({
                title: `QR Code - ${this.currentGeneratedStore?.name || 'QR NEXUS'}`,
                files: [file]
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                this.showToast('فشلت المشاركة', 'error');
            }
        }
    }

    // Setup search
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        let debounceTimer;

        searchInput?.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                this.searchStores(e.target.value);
            }, 300);
        });
    }

    // Search stores
    async searchStores(term) {
        if (!term.trim()) {
            await this.loadStores();
            return;
        }

        const stores = await db.searchStores(term);
        this.renderStores(stores);
    }

    // Setup categories
    setupCategories() {
        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const category = chip.dataset.category;
                this.selectCategory(category);
                animations.createRipple(e, chip);
            });
        });
    }

    // Select category
    async selectCategory(category) {
        this.currentCategory = category;

        document.querySelectorAll('.category-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.category === category);
        });

        await this.loadStores();
    }

    // Load stores
    async loadStores() {
        try {
            this.stores = await db.getStores(this.currentCategory);
            this.renderStores(this.stores);
        } catch (error) {
            console.error('Error loading stores:', error);
        }
    }

    // Render stores grid
    renderStores(stores) {
        const grid = document.getElementById('stores-grid');
        const emptyState = document.getElementById('empty-discover');

        if (!grid) return;

        // Clear existing cards (keep empty state)
        grid.querySelectorAll('.store-card').forEach(card => card.remove());

        if (stores.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        stores.forEach((store, index) => {
            const card = this.createStoreCard(store);
            grid.appendChild(card);

            // Stagger animation
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 50);
        });
    }

    // Create store card element
    createStoreCard(store) {
        const category = CONFIG.CATEGORIES[store.category] || CONFIG.CATEGORIES.other;

        const card = document.createElement('div');
        card.className = 'store-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.3s ease';

        card.innerHTML = `
            <div class="store-header">
                <div class="store-icon">${category.icon}</div>
                <div class="store-info">
                    <div class="store-name">${this.escapeHtml(store.name)}</div>
                    <div class="store-category">${category.name}</div>
                </div>
            </div>
            <div class="store-stats">
                <div class="store-stat">
                    <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>${store.views || 0} مشاهدة</span>
                </div>
                <div class="store-stat">
                    <svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
                    <span>${store.scans || 0} مسحة</span>
                </div>
            </div>
        `;

        card.addEventListener('click', () => this.openStoreModal(store));

        return card;
    }

    // Open store detail modal
    async openStoreModal(store) {
        const modal = document.getElementById('modal-store');
        const content = document.getElementById('store-identity');

        if (!modal || !content) return;

        // Increment view
        await db.incrementView(store.id);
        store.views = (store.views || 0) + 1;

        const category = CONFIG.CATEGORIES[store.category] || CONFIG.CATEGORIES.other;
        const internalLink = `${window.location.origin}${window.location.pathname}?store=${store.id}`;

        content.innerHTML = `
            <div class="identity-header">
                <div class="identity-icon">${category.icon}</div>
                <h2 class="identity-name">${this.escapeHtml(store.name)}</h2>
                <span class="identity-category">${category.name}</span>
            </div>
            <div class="identity-qr" id="store-qr-container"></div>
            <div class="identity-actions">
                <a href="${this.escapeHtml(store.link)}" target="_blank" rel="noopener" class="btn-identity primary">
                    <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    <span>زيارة الموقع</span>
                </a>
                <button class="btn-identity" onclick="app.saveStoreQR()">
                    <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>حفظ QR</span>
                </button>
            </div>
            <div class="identity-stats">
                <div class="stat-item">
                    <span class="stat-number">${store.views || 0}</span>
                    <span class="stat-label">مشاهدة</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${store.scans || 0}</span>
                    <span class="stat-label">مسحة</span>
                </div>
            </div>
        `;

        // Generate QR
        const qrContainer = document.getElementById('store-qr-container');
        new QRCode(qrContainer, {
            text: internalLink,
            width: 150,
            height: 150,
            colorDark: CONFIG.QR.COLOR_DARK,
            colorLight: CONFIG.QR.COLOR_LIGHT,
            correctLevel: QRCode.CorrectLevel.H
        });

        this.currentViewedStore = store;
        animations.openModal(modal);

        // Close button
        document.getElementById('modal-close-store')?.addEventListener('click', () => {
            animations.closeModal(modal);
        });

        modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            animations.closeModal(modal);
        });
    }

    // Save store QR
    saveStoreQR() {
        const canvas = document.querySelector('#store-qr-container canvas');
        if (!canvas || !this.currentViewedStore) return;

        const link = document.createElement('a');
        link.download = `qr-${this.currentViewedStore.name}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        this.showToast('تم حفظ الصورة', 'success');
    }

    // Start QR scanner
    async startScanner() {
        try {
            await scanner.start((result) => this.handleScanResult(result));
        } catch (error) {
            this.showToast('لا يمكن تشغيل الكاميرا', 'error');
        }
    }

    // Handle scan result
    async handleScanResult(data) {
        scanner.stop();

        // Check if it's an internal QR NEXUS link
        const storeMatch = data.match(/[?&]store=([^&]+)/);

        if (storeMatch) {
            const storeId = storeMatch[1];
            const store = await db.getStore(storeId);

            if (store) {
                await db.incrementScan(storeId);
                this.openStoreModal(store);
                return;
            }
        }

        // External link
        this.showScanResult(data);
    }

    // Show scan result modal
    showScanResult(data) {
        const modal = document.getElementById('modal-scan-result');
        const content = document.getElementById('scan-result-content');

        if (!modal || !content) return;

        const isUrl = data.startsWith('http://') || data.startsWith('https://');

        content.innerHTML = `
            <div class="scan-result-icon">
                <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 class="scan-result-title">تم المسح بنجاح!</h3>
            <p class="scan-result-link">${this.escapeHtml(data)}</p>
            <div class="scan-result-actions">
                ${isUrl ? `
                    <a href="${this.escapeHtml(data)}" target="_blank" rel="noopener" class="btn-identity primary">
                        <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        <span>فتح الرابط</span>
                    </a>
                ` : ''}
                <button class="btn-identity" onclick="navigator.clipboard.writeText('${this.escapeHtml(data)}'); app.showToast('تم النسخ', 'success');">
                    <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    <span>نسخ</span>
                </button>
                <button class="btn-identity" onclick="app.navigateTo('scan'); animations.closeModal(document.getElementById('modal-scan-result'));">
                    <svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
                    <span>مسح آخر</span>
                </button>
            </div>
        `;

        animations.openModal(modal);

        document.getElementById('modal-close-scan')?.addEventListener('click', () => {
            animations.closeModal(modal);
        });

        modal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            animations.closeModal(modal);
        });
    }

    // Load stats
    async loadStats() {
        try {
            const stats = await db.getStats();

            const totalQR = document.getElementById('stat-total-qr');
            const totalScans = document.getElementById('stat-total-scans');
            const categories = document.getElementById('stat-categories');

            if (totalQR) this.animateNumber(totalQR, stats.totalQR);
            if (totalScans) this.animateNumber(totalScans, stats.totalScans);
            if (categories) categories.textContent = stats.categories;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Animate number counting
    animateNumber(element, target) {
        const current = parseInt(element.textContent) || 0;
        const diff = target - current;
        const duration = 500;
        const steps = 20;
        const increment = diff / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            element.textContent = Math.round(current + (increment * step));
            if (step >= steps) {
                element.textContent = target;
                clearInterval(timer);
            }
        }, duration / steps);
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // NEXUS ID: Entry Animation
    triggerNexusEntry() {
        const overlay = document.getElementById('nexus-entry-overlay');
        if (!overlay) return;

        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto'; // Block interaction during entry

        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.pointerEvents = 'none'; // Re-enable interaction
            }, 1000);
        }, 1500);
    }

    // NEXUS ID: Setup Creation & Workspace
    setupNexusId() {
        const btnCreate = document.getElementById('btn-create-nexus');
        const btnAddLink = document.getElementById('btn-nexus-add-link');

        btnCreate?.addEventListener('click', async () => {
            const nameEl = document.getElementById('nexus-name');
            const bioEl = document.getElementById('nexus-bio');
            const name = nameEl?.value?.trim();
            const bio = bioEl?.value?.trim();

            if (!name) {
                this.showToast('يرجى إدخال الاسم', 'error');
                return;
            }

            try {
                btnCreate.disabled = true;
                btnCreate.innerHTML = '<span>جاري التكوين...</span>';

                const response = await fetch(`${CONFIG.API_URL}/nexus/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ displayName: name, bio: bio })
                });
                const result = await response.json();

                if (result.success) {
                    this.showToast('تم تكوين هويتك بنجاح! 🌌', 'success');
                    this.currentNexusId = result.data.identityId;
                    this.renderNexusWorkspace(this.currentNexusId, name, bio, []);
                }
            } catch (e) {
                this.showToast('خطأ في الاتصال بالخادم', 'error');
            } finally {
                btnCreate.disabled = false;
                btnCreate.innerHTML = '<span>تكوين الهوية</span><div class="btn-glow"></div>';
            }
        });

        btnAddLink?.addEventListener('click', () => {
            this.addNexusLinkUI('', '');
        });
    }

    async saveNexusIdentity() {
        if (!this.currentNexusId) return;

        const name = document.getElementById('workspace-name')?.textContent;
        const bio = document.getElementById('workspace-bio')?.textContent;
        const links = [];

        document.querySelectorAll('.nexus-link-item').forEach(item => {
            const label = item.querySelector('.link-label-input')?.value;
            const url = item.querySelector('.link-url-input')?.value;
            if (label && url) {
                links.push({ label, url, icon: 'link' });
            }
        });

        try {
            const response = await fetch(`${CONFIG.API_URL}/nexus/${this.currentNexusId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: name, bio: bio, links: links })
            });
            const result = await response.json();
            if (result.success) {
                this.showToast('تمت المزامنة سحابياً ✅', 'success');
            }
        } catch (e) {
            this.showToast('فشلت المزامنة', 'error');
        }
    }

    renderNexusWorkspace(id, name, bio, links) {
        const createView = document.getElementById('view-nexus-create');
        const manageView = document.getElementById('view-nexus-manage');

        const nameEl = document.getElementById('workspace-name');
        const bioEl = document.getElementById('workspace-bio');

        if (nameEl) nameEl.textContent = name;
        if (bioEl) bioEl.textContent = bio || 'مساحة رقمية حية';

        // Render existing links
        const list = document.getElementById('nexus-links-list');
        if (list) {
            list.innerHTML = '';
            links.forEach(l => this.addNexusLinkUI(l.label, l.url));
        }

        // Generate Master QR
        const qrBox = document.getElementById('nexus-master-qr');
        if (qrBox) {
            qrBox.innerHTML = '';
            new QRCode(qrBox, {
                text: `${window.location.origin}${window.location.pathname}?nexus=${id}`,
                width: 140,
                height: 140,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }

        if (createView) createView.classList.add('hidden');
        if (manageView) manageView.classList.remove('hidden');

        this.setupAutoSync();
    }

    addNexusLinkUI(label = '', url = '') {
        const list = document.getElementById('nexus-links-list');
        if (!list) return;

        const linkEl = document.createElement('div');
        linkEl.className = 'nexus-link-item action-card active-link';
        linkEl.style.cssText = `
            padding: 20px;
            margin-bottom: 15px;
            flex-direction: column;
            align-items: stretch;
            background: rgba(15,15,15,0.9);
            border: 1px solid rgba(255,240,0,0.1);
        `;

        linkEl.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                 <div class="card-icon" style="width:24px; height:24px">
                    <svg viewBox="0 0 24 24" fill="none" stroke="var(--yellow-neon)" stroke-width="2.5"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"></path></svg>
                </div>
                <button class="delete-link-btn" style="color:#ff3333; font-size:24px; font-weight:bold; cursor:pointer">&times;</button>
            </div>
            <div class="link-fields" style="display:flex; flex-direction:column; gap:12px">
                <input type="text" class="link-label-input" placeholder="اسم الرابط (مثال: متجري)" value="${this.escapeHtml(label)}" style="background:var(--black-deep); border:1px solid var(--black-charcoal); border-radius:8px; padding:12px; color:white; font-size:15px">
                <input type="url" class="link-url-input" placeholder="رابط URL (https://...)" value="${this.escapeHtml(url)}" style="background:var(--black-deep); border:1px solid var(--black-charcoal); border-radius:8px; padding:12px; color:white; font-size:15px">
            </div>
            <button class="sync-now-btn" style="margin-top:15px; background:var(--yellow-warm); color:black; border:none; padding:10px; border-radius:8px; font-size:12px; font-weight:bold; cursor:pointer; width:100%">تحديث هذا العنصر</button>
        `;

        linkEl.querySelector('.delete-link-btn').onclick = (e) => {
            e.stopPropagation();
            linkEl.style.opacity = '0.5';
            linkEl.style.transform = 'scale(0.9)';
            setTimeout(() => {
                linkEl.remove();
                this.saveNexusIdentity();
            }, 200);
        };

        linkEl.querySelector('.sync-now-btn').onclick = async (e) => {
            const btn = e.currentTarget;
            const originalText = btn.textContent;
            btn.textContent = 'جاري المزامنة...';
            await this.saveNexusIdentity();
            btn.textContent = 'تم الحفظ ✅';
            setTimeout(() => btn.textContent = originalText, 2000);
        };

        list.appendChild(linkEl);
        if (typeof gsap !== 'undefined') {
            gsap.from(linkEl, { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' });
        }
    }

    setupAutoSync() {
        const nameEl = document.getElementById('workspace-name');
        const bioEl = document.getElementById('workspace-bio');

        let syncTimeout;
        [nameEl, bioEl].forEach(el => {
            if (el) {
                el.setAttribute('contenteditable', 'true');
                el.oninput = () => {
                    clearTimeout(syncTimeout);
                    syncTimeout = setTimeout(() => this.saveNexusIdentity(), 3000);
                };
            }
        });
    }

    async downloadNexusQR() {
        const canvas = document.querySelector('#nexus-master-qr canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `nexus-id-${this.currentNexusId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.showToast('تم حفظ الكود بنجاح! 📸', 'success');
    }

    // Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check for store or nexus query params
    async checkQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const storeId = params.get('store');
        const nexusId = params.get('nexus');

        if (storeId) {
            const store = await db.getStore(storeId);
            if (store) {
                await db.incrementScan(storeId);
                this.openStoreModal(store);
            }
        } else if (nexusId) {
            this.showToast('مرحباً بك في فضاء NEXUS', 'info');
            // Additional logic to display a public NEXUS page could go here
        }
    }
}

// Initialize app
const app = new QRNexusApp();

document.addEventListener('DOMContentLoaded', async () => {
    await app.init();
    await app.checkQueryParams();
});
