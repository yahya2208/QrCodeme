// QRme V8.5 - COMPLETE IDENTITY-CENTRIC QR CODE SYSTEM
// Features: QR-only, Share System, Points, Full i18n
// Non-Negotiable: Links are NEVER opened - QR codes ONLY

class QRmeApp {
    constructor() {
        // Smart API Base: Detect local development environment
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.endsWith('.local');

        this.apiBase = isLocal ? `http://${hostname}:3001/api` : window.location.origin + '/api';
        console.log(`[INIT] API Base set to: ${this.apiBase}`);
        this.user = null;
        this.session = null;
        this.identity = null;
        this.categories = [];
        this.services = [];
        this.selectedCategory = null;
        this.selectedService = null;
        this.currentStep = 1;
        this.isOwnerViewing = false;
        this.currentVaultIdentity = null;
        this.editingCodeId = null;
        this.userPoints = 0;
        this.statsInterval = null;
        this.currentStats = {
            total_identities: 0,
            total_codes: 0,
            total_network_reach: 0
        };
    }

    /**
     * Centralized Gateway Caller
     * assumptive zero-trust: all responses are verified
     */
    async callApi(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Inject session token if available
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) config.body = JSON.stringify(body);

        const response = await fetch(`${this.apiBase}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    }

    async init() {
        console.log('🚀 QRme V8.5 - Full Release Initializing...');

        // Initialize localization FIRST
        if (typeof i18n !== 'undefined') {
            i18n.init();
        }

        this.setupAuthForms();
        this.setupNavigation();
        this.setupPasswordToggles();
        this.setupPasswordValidation();
        this.setupCodeCreation();
        this.setupQRModal();
        this.setupShareSystem();
        this.setupI18n();
        this.setupIdentityEditing();
        this.setupAdminDashboard();
        this.setupOnboarding();

        await this.checkAuthState();

        setTimeout(() => {
            document.getElementById('app-loader')?.classList.add('hidden');
            this.startStatsPolling(); // Start polling after initial load
        }, 1000);
    }

    setupI18n() {
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                i18n.toggle();
                // Refresh dynamic content that might not use data-t
                if (this.currentVaultIdentity) {
                    this.loadVault(this.currentVaultIdentity, this.isOwnerViewing);
                }
                if (this.user) {
                    this.loadHub();
                }
            });
        }
    }

    // =====================
    // AUTH STATE
    // =====================
    async checkAuthState() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();

            if (user && !error) {
                // If email confirmation is required but not done
                // Note: user.email_confirmed_at logic might vary based on your backend return
                if (user.aud === 'authenticated' && !user.email_confirmed_at && user.app_metadata?.provider === 'email') {
                    this.showView('verify');
                    document.getElementById('verify-email-display').textContent = user.email;
                    return;
                }

                this.user = user;

                // Load user points & data via backend
                await Promise.all([
                    this.loadUserPoints(),
                    this.loadHub()
                ]);

                document.getElementById('user-controls')?.classList.remove('hidden');

                // Admin check
                // Admin check - Restricted to authorized engineering email
                if (user.email === 'y220890@gmail.com') {
                    this.showAdminLink();
                }

                this.showView('hub');
                this.checkOnboarding();
            } else {
                this.showView('login');
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            this.showView('login');
        }
    }


    // =====================
    // AUTH FORMS
    // =====================
    setupAuthForms() {
        // LOGIN
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            this.setLoading(e.target, true);

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (!data.user.email_confirmed_at) {
                    this.showView('verify');
                    document.getElementById('verify-email-display').textContent = email;
                } else {
                    location.reload();
                }
            } catch (err) {
                this.showToast(i18n.t('err_login_failed'), 'error');
            } finally {
                this.setLoading(e.target, false);
            }
        });

        // REGISTER
        document.getElementById('register-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('reg-fullname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;

            if (password !== confirm) {
                this.showToast(i18n.t('err_password_mismatch'), 'error');
                return;
            }

            this.setLoading(e.target, true);

            // Detection of referral code from URL
            const urlParams = new URLSearchParams(window.location.search);
            const referralCode = urlParams.get('ref');

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            referral_code: referralCode
                        }
                    }
                });

                if (error) throw (typeof error === 'string' ? new Error(error) : error);

                this.showView('verify');
                document.getElementById('verify-email-display').textContent = email;
                this.showToast(i18n.t('msg_verification_sent'), 'success');

            } catch (err) {
                this.showToast(err.message || i18n.t('err_register_failed'), 'error');
            } finally {
                this.setLoading(e.target, false);
            }
        });

        // RESEND
        document.getElementById('resend-email')?.addEventListener('click', async () => {
            const email = document.getElementById('verify-email-display').textContent;
            try {
                await supabaseClient.auth.resend({ type: 'signup', email });
                this.showToast(i18n.t('msg_verification_sent'), 'success');
            } catch (err) {
                this.showToast(i18n.t('msg_error'), 'error');
            }
        });

        // LOGOUT
        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            location.reload();
        });

        // CREATE IDENTITY
        document.getElementById('create-identity-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('identity-name').value.trim();
            const bio = document.getElementById('identity-bio').value.trim();

            try {
                const result = await this.callApi('/user/identity', 'POST', {
                    full_name: name,
                    bio: bio
                });

                if (result.success) {
                    this.showToast(i18n.t('msg_success'), 'success');
                    await this.loadHub();
                }
            } catch (err) {
                this.showToast(err.message || i18n.t('err_create_identity'), 'error');
            }
        });
    }

    // =====================
    // NAVIGATION
    // =====================
    setupNavigation() {
        document.getElementById('goto-register')?.addEventListener('click', () => this.showView('register'));
        document.getElementById('goto-login')?.addEventListener('click', () => this.showView('login'));
        document.getElementById('back-to-login')?.addEventListener('click', () => this.showView('login'));
        document.getElementById('close-vault-btn')?.addEventListener('click', () => {
            document.getElementById('vault-overlay')?.classList.add('hidden');
            document.getElementById('global-back-btn')?.classList.add('hidden');
        });

        // Global Back Button
        document.getElementById('global-back-btn')?.addEventListener('click', () => {
            const vault = document.getElementById('vault-overlay');
            if (vault && !vault.classList.contains('hidden')) {
                vault.classList.add('hidden');
                document.getElementById('global-back-btn')?.classList.add('hidden');
            } else {
                this.showView('hub');
                document.getElementById('global-back-btn')?.classList.add('hidden');
            }
        });
    }

    showView(viewName) {
        document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
        document.getElementById(`view-${viewName}`)?.classList.remove('hidden');

        // Show global back button if not in Hub
        const backBtn = document.getElementById('global-back-btn');
        if (backBtn) {
            if (viewName !== 'hub' && viewName !== 'login') {
                backBtn.classList.remove('hidden');
            } else {
                backBtn.classList.add('hidden');
            }
        }

        // Ensure vault is hidden if changing view
        if (viewName !== 'hub') {
            document.getElementById('vault-overlay')?.classList.add('hidden');
        }
    }

    // =====================
    // HUB
    // =====================
    async loadHub() {
        try {
            const result = await this.callApi('/discovery/vault/my');
            const identity = result.data;

            if (identity) {
                this.identity = identity;
                document.getElementById('create-identity-ui')?.classList.add('hidden');
                const card = document.getElementById('my-biometric-card');
                card?.classList.remove('hidden');
                document.getElementById('my-identity-name').textContent = identity.full_name || 'Identity Owner';
                document.getElementById('my-identity-id').textContent = identity.id.toUpperCase();

                // Copy ID Logic (Requirement 3 - Owner View)
                const copyBtn = document.getElementById('copy-my-id');
                if (copyBtn) {
                    copyBtn.onclick = (e) => {
                        e.stopPropagation();
                        const idToCopy = identity.id.toUpperCase();
                        navigator.clipboard.writeText(idToCopy);
                        this.showToast(i18n.t('msg_copied'), 'success');
                    };
                }

                card.onclick = () => this.openVault(identity.id, true);
            } else {
                document.getElementById('create-identity-ui')?.classList.remove('hidden');
                document.getElementById('my-biometric-card')?.classList.add('hidden');
            }
        } catch (err) {
            document.getElementById('create-identity-ui')?.classList.remove('hidden');
        }

        await this.loadDiscovery();
        await this.loadProjectStats();
    }

    async loadProjectStats() {
        try {
            const result = await this.callApi('/discovery/stats');
            if (result.success) {
                console.log('[STATS] Received:', result.data);
                this.updateStats(result.data);
            }
        } catch (err) {
            console.warn('[STATS ERROR]', err.message);
        }
    }

    startStatsPolling() {
        if (this.statsInterval) clearInterval(this.statsInterval);

        // Poll every 5 seconds for "real-time" feel
        this.statsInterval = setInterval(() => {
            this.loadProjectStats();
        }, 5000);
    }

    updateStats(newStats) {
        // Sync identities
        if (newStats.total_identities !== this.currentStats.total_identities) {
            this.animateNumber('stat-identities', newStats.total_identities);
        }

        // Sync codes
        if (newStats.total_codes !== this.currentStats.total_codes) {
            this.animateNumber('stat-codes', newStats.total_codes);
        }

        // Sync reach
        if (newStats.total_network_reach !== this.currentStats.total_network_reach) {
            this.animateNumber('stat-reach', newStats.total_network_reach);
        }

        this.currentStats = { ...newStats };
    }

    animateNumber(id, finalValue) {
        const el = document.getElementById(id);
        if (!el) return;

        const obj = { value: parseInt(el.textContent) || 0 };
        gsap.to(obj, {
            value: finalValue,
            duration: 2,
            ease: 'power2.out',
            onUpdate: () => {
                el.textContent = Math.floor(obj.value).toLocaleString();
            }
        });
    }

    async loadDiscovery() {
        const corridor = document.getElementById('discovery-corridor');
        if (!corridor) return;

        try {
            const result = await this.callApi('/discovery/hub');
            const identities = result.data;

            corridor.innerHTML = '';

            if (identities && identities.length > 0) {
                identities.forEach(id => {
                    const card = document.createElement('div');
                    card.className = 'discovery-card';

                    // Mask ID for public view: NX-EETWIX -> ••••-TWIX
                    const rawId = id.id.toUpperCase();
                    const maskedId = `••••-${rawId.includes('-') ? rawId.split('-')[1].slice(-4) : rawId.slice(-4)}`;

                    card.innerHTML = `
                        <div class="d-card-body">
                            <h4 class="d-name"></h4>
                            <p class="d-bio"></p>
                            <div class="d-meta">
                                <span class="d-id">${maskedId}</span>
                                <span class="d-badge"></span>
                            </div>
                        </div>
                    `;
                    card.querySelector('.d-name').textContent = id.full_name || 'Anonymous User';
                    card.querySelector('.d-bio').textContent = id.bio || '';
                    card.querySelector('.d-badge').textContent = `${id.codes_count || 0} ${i18n.t('hub_codes_count')}`;
                    card.onclick = () => this.openVault(id.id, false);
                    corridor.appendChild(card);
                });
            } else {
                corridor.innerHTML = `<p class="empty-corridor">${i18n.t('hub_empty_discovery')}</p>`;
            }
        } catch (err) {
            corridor.innerHTML = `<p class="empty-corridor">${i18n.t('msg_error')}</p>`;
        }
    }

    // =====================
    // VAULT (With QR Code on Click)
    // =====================
    async openVault(identityId, isOwner) {
        this.isOwnerViewing = isOwner;
        this.currentVaultIdentity = identityId;

        const overlay = document.getElementById('vault-overlay');
        const grid = document.getElementById('vault-grid');
        const ownerLabel = document.getElementById('vault-owner-name');
        const vaultActions = document.getElementById('vault-actions');
        const badge = document.getElementById('vault-badge');

        overlay?.classList.remove('hidden');
        gsap.fromTo(overlay.querySelector('.vault-container'),
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );

        grid.innerHTML = `<div class="loading-vault">${i18n.t('vault_loading')}</div>`;
        badge.textContent = isOwner ? i18n.t('vault_owner_badge') : i18n.t('vault_visitor_badge');

        try {
            const result = await this.callApi(`/discovery/vault/${identityId}`);
            const codes = result.data || [];

            // Robust ownership check
            const realIsOwner = isOwner || (codes.length > 0 && codes[0].is_owner === true);
            this.isOwnerViewing = realIsOwner;

            // Set owner name
            ownerLabel.textContent = (codes.length > 0 && codes[0].owner_name)
                ? codes[0].owner_name
                : (realIsOwner ? i18n.t('vault_my_title') : i18n.t('vault_title'));

            // Set Total Reach
            const totalReachEl = document.getElementById('identity-total-scans');
            if (totalReachEl) {
                this.animateNumber('identity-total-scans', result.meta?.total_reach || 0);
            }

            vaultActions.classList.toggle('hidden', !realIsOwner);
            document.getElementById('global-back-btn')?.classList.remove('hidden');
            grid.innerHTML = '';

            if (codes && codes.length > 0) {
                codes.forEach(code => {
                    const item = document.createElement('div');
                    item.className = 'vault-item';
                    item.setAttribute('data-code-id', code.id);

                    let actionsHTML = '';
                    if (realIsOwner) {
                        actionsHTML = `
                            <div class="vault-item-actions">
                                <button class="btn-edit-code" data-id="${code.id}" title="${i18n.t('btn_edit')}">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                                </button>
                                <button class="btn-delete-code" data-id="${code.id}" title="${i18n.t('btn_delete')}">
                                    <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                </button>
                            </div>`;
                    }

                    // Futuristic Glyph Generation (Requirement 1)
                    const glyphHTML = this.generateFuturisticGlyph(code.service_name || 'generic', code.service_color || '#f0ff42');

                    item.innerHTML = `
                        <div class="vault-item-main">
                            <div class="vault-item-icon">
                                ${glyphHTML}
                            </div>
                            <div class="vault-item-info">
                                <div class="vault-item-name"></div>
                                <div class="vault-item-stats">
                                    <div class="v-stat highlight">
                                        <span class="v-stat-icon">📈</span>
                                        <span class="v-stat-value">${(parseInt(code.scans) || 0) + (parseInt(code.views) || 0)}</span>
                                        <span class="v-stat-label">${i18n.t('vault_per_count')}</span>
                                    </div>
                                </div>
                                <div class="vault-item-hint">${i18n.t('vault_tap_qr')}</div>
                            </div>
                        </div>
                        ${actionsHTML}`;

                    item.querySelector('.vault-item-name').textContent = code.name || code.service_name;

                    item.querySelector('.vault-item-main').onclick = (e) => {
                        e.stopPropagation();
                        if (code.display_value && code.display_value !== '••••••••') {
                            this.showQRModal(code.display_value, code.name || code.service_name, code.service_color, code.id);
                        } else {
                            this.showEncryptedQRMessage(code.name || code.service_name);
                        }
                    };

                    if (realIsOwner) {
                        item.querySelector('.btn-edit-code').onclick = (e) => { e.stopPropagation(); this.openEditModal(code); };
                        item.querySelector('.btn-delete-code').onclick = (e) => { e.stopPropagation(); this.deleteCode(code.id); };
                    }

                    grid.appendChild(item);
                });
            } else {
                grid.innerHTML = `<div class="empty-vault">${i18n.t('vault_empty')}</div>`;
            }

            // Curiosity Trap (Requirement 2)
            const trap = document.getElementById('curiosity-trap');
            if (trap) {
                if (!realIsOwner && (!this.user || !this.identity)) {
                    trap.classList.remove('hidden');
                    document.getElementById('trap-cta-btn').onclick = () => {
                        document.getElementById('vault-overlay').classList.add('hidden');
                        this.showView('register');
                    };
                } else if (realIsOwner || (this.user && this.identity)) {
                    trap.classList.add('hidden');
                }
            }
        } catch (err) {
            grid.innerHTML = `<div class="error-vault">${i18n.t('msg_error')}</div>`;
        }
    }

    // =====================
    // QR CODE MODAL - CORE FEATURE
    // =====================
    setupQRModal() {
        // Create QR modal if not exists
        if (!document.getElementById('qr-display-modal')) {
            const qrModal = document.createElement('div');
            qrModal.id = 'qr-display-modal';
            qrModal.className = 'qr-display-modal hidden';
            qrModal.innerHTML = `
                <div class="qr-display-container">
                    <button class="btn-close-qr" id="close-qr-btn">✕</button>
                    <div class="qr-display-header">
                        <h3 id="qr-display-title">QR Code</h3>
                    </div>
                    <div class="qr-display-content">
                        <div id="qr-code-container" class="qr-code-box"></div>
                    </div>
                    <div class="qr-display-footer">
                        <p class="qr-instruction" data-t="qr_scan_instruction">${i18n.t('qr_scan_instruction')}</p>
                    </div>
                </div>
            `;
            document.body.appendChild(qrModal);

            document.getElementById('close-qr-btn').addEventListener('click', () => {
                this.hideQRModal();
            });

            qrModal.addEventListener('click', (e) => {
                if (e.target === qrModal) {
                    this.hideQRModal();
                }
            });
        }
    }

    showQRModal(value, title, color = '#f0ff42', codeId = null) {
        const modal = document.getElementById('qr-display-modal');
        const container = document.getElementById('qr-code-container');
        const titleEl = document.getElementById('qr-display-title');

        if (!value) {
            this.showToast(i18n.t('qr_encrypted_desc'), 'error');
            return;
        }

        modal.classList.remove('hidden');
        titleEl.textContent = title;
        container.innerHTML = '';

        // Determine QR content
        // If codeId is provided, use tracking URL to count scans from printed QR
        let qrContent = value;
        if (codeId) {
            // Use the backend tracking endpoint
            qrContent = `${this.apiBase.replace('/api', '')}/q/${codeId}`;
            console.log('[QR] Generated tracking URL:', qrContent);
        }

        // Generate QR Code
        try {
            new QRCode(container, {
                text: qrContent,
                width: 280,
                height: 280,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } catch (err) {
            container.innerHTML = '<p class="qr-error">خطأ في إنشاء QR</p>';
        }

        // Animate in
        gsap.fromTo(modal.querySelector('.qr-display-container'),
            { opacity: 0, scale: 0.85, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
    }

    hideQRModal() {
        const modal = document.getElementById('qr-display-modal');
        gsap.to(modal.querySelector('.qr-display-container'), {
            opacity: 0, scale: 0.85, y: 30, duration: 0.3, ease: 'power3.in',
            onComplete: () => modal.classList.add('hidden')
        });
    }

    // Show encrypted message for non-owners trying to view QR
    showEncryptedQRMessage(serviceName) {
        const modal = document.getElementById('qr-display-modal');
        const container = document.getElementById('qr-code-container');
        const titleEl = document.getElementById('qr-display-title');
        const footer = modal.querySelector('.qr-display-footer');

        modal.classList.remove('hidden');
        titleEl.textContent = serviceName;

        // Show encrypted/locked state
        container.innerHTML = `
            <div class="qr-encrypted-state">
                <div class="encrypted-icon">🔒</div>
                <p class="encrypted-title">${i18n.t('qr_encrypted_title')}</p>
                <p class="encrypted-desc">${i18n.t('qr_encrypted_desc')}</p>
            </div>
        `;

        // Update footer instruction
        if (footer) {
            footer.querySelector('.qr-instruction').textContent = i18n.t('qr_encrypted_info');
        }

        // Animate in
        gsap.fromTo(modal.querySelector('.qr-display-container'),
            { opacity: 0, scale: 0.85, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
    }


    // =====================
    // EDIT CODE MODAL
    // =====================
    openEditModal(code) {
        this.editingCodeId = code.id;

        // Create edit modal if not exists
        let modal = document.getElementById('edit-code-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'edit-code-modal';
            modal.className = 'edit-code-modal hidden';
            modal.innerHTML = `
                <div class="edit-code-container">
                    <div class="edit-code-header">
                        <h3>تعديل الكود</h3>
                        <button class="btn-close-edit" id="close-edit-btn">✕</button>
                    </div>
                    <form id="edit-code-form">
                        <div class="input-group">
                            <label>الرابط أو الرقم الجديد</label>
                            <input type="text" id="edit-code-value" required placeholder="أدخل القيمة الجديدة">
                        </div>
                        <button type="submit" class="btn-primary btn-full">حفظ التعديل</button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('close-edit-btn').addEventListener('click', () => {
                this.hideEditModal();
            });

            document.getElementById('edit-code-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.saveCodeEdit();
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideEditModal();
                }
            });
        }

        // Set current value
        document.getElementById('edit-code-value').value = code.display_value || '';

        modal.classList.remove('hidden');
        gsap.fromTo(modal.querySelector('.edit-code-container'),
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );
    }

    hideEditModal() {
        const modal = document.getElementById('edit-code-modal');
        gsap.to(modal.querySelector('.edit-code-container'), {
            opacity: 0, scale: 0.9, y: 30, duration: 0.3, ease: 'power3.in',
            onComplete: () => modal.classList.add('hidden')
        });
        this.editingCodeId = null;
    }

    async saveCodeEdit() {
        const newValue = document.getElementById('edit-code-value').value.trim();

        if (!newValue) {
            this.showToast('يرجى إدخال قيمة صحيحة', 'error');
            return;
        }

        try {
            const result = await this.callApi(`/codes/${this.editingCodeId}`, 'PUT', { display_value: newValue });

            if (result.success) {
                this.showToast(i18n.t('msg_success'), 'success');
                this.hideEditModal();
                await this.openVault(this.currentVaultIdentity, true);
            }
        } catch (err) {
            console.error('Edit error:', err);
            this.showToast(i18n.t('err_update_code'), 'error');
        }
    }

    // =====================
    // DELETE CODE
    // =====================
    async deleteCode(codeId) {
        // Confirmation dialog
        const confirmed = confirm(i18n.t('delete_confirm'));

        if (!confirmed) return;

        try {
            const result = await this.callApi(`/codes/${codeId}`, 'DELETE');

            if (result.success) {
                this.showToast(i18n.t('msg_deleted'), 'success');
                await this.openVault(this.currentVaultIdentity, true);
            }
        } catch (err) {
            console.error('Delete error:', err);
            this.showToast(i18n.t('err_delete_code'), 'error');
        }
    }

    // =====================
    // CODE CREATION (Step-Based)
    // =====================
    setupCodeCreation() {
        // Open modal
        document.getElementById('add-code-btn')?.addEventListener('click', async () => {
            await this.loadCategoriesAndServices();
            this.openCodeModal();
        });

        // Close modal
        document.getElementById('close-code-btn')?.addEventListener('click', () => {
            this.closeCodeModal();
        });

        // Back button
        document.getElementById('back-step-btn')?.addEventListener('click', () => {
            this.goToPreviousStep();
        });

        // Form submit
        document.getElementById('code-value-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createCode();
        });
    }

    async loadCategoriesAndServices() {
        try {
            const result = await this.callApi('/codes/metadata');
            this.categories = result.data.categories || [];
            this.services = result.data.services || [];
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    }

    openCodeModal() {
        const modal = document.getElementById('add-code-overlay');
        modal?.classList.remove('hidden');

        // Animate in
        gsap.fromTo(modal.querySelector('.code-modal-container'),
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );

        // Reset to step 1
        this.goToStep(1);
        this.selectedCategory = null;
        this.selectedService = null;

        // Populate categories
        const catList = document.getElementById('category-list');
        catList.innerHTML = '';

        const catIcons = {
            'social': 'fas fa-share-nodes',
            'contact': 'fas fa-id-card',
            'payment': 'fas fa-credit-card',
            'professional': 'fas fa-user-tie',
            'media': 'fas fa-clapperboard',
            'other': 'fas fa-star'
        };

        this.categories.forEach(cat => {
            const item = document.createElement('button');
            item.className = 'category-item';

            const name = i18n.current === 'ar' ? (cat.name_ar || cat.name) : (cat.name_en || cat.name || cat.name_ar);
            const catName = name || i18n.t('category_generic') || 'Unnamed';

            // Map category ID to FontAwesome icon or use the one from DB
            const iconClass = catIcons[cat.id] || (cat.icon && cat.icon.includes('fa-') ? cat.icon : null);
            const iconHTML = iconClass ? `<i class="${iconClass}"></i>` : `<span>${cat.icon || '✨'}</span>`;

            item.innerHTML = `
                <div class="cat-icon-container">${iconHTML}</div>
                <span class="cat-name">${catName}</span>
            `;
            item.onclick = () => this.selectCategory(cat);
            catList.appendChild(item);
        });
    }

    closeCodeModal() {
        const modal = document.getElementById('add-code-overlay');
        gsap.to(modal.querySelector('.code-modal-container'), {
            opacity: 0, scale: 0.9, y: 30, duration: 0.3, ease: 'power3.in',
            onComplete: () => modal?.classList.add('hidden')
        });
    }

    selectCategory(category) {
        this.selectedCategory = category;

        // Filter services by category
        const filteredServices = this.services.filter(s => s.category_id === category.id);

        // Populate services grid
        const serviceGrid = document.getElementById('service-grid');
        serviceGrid.innerHTML = '';

        filteredServices.forEach(svc => {
            const item = document.createElement('button');
            item.className = 'service-item';
            const name = i18n.current === 'ar' ? (svc.name_ar || svc.name) : (svc.name_en || svc.name || svc.name_ar);
            const localizedName = name || 'Service';

            const glyphHTML = this.generateFuturisticGlyph(svc.id, svc.color || '#f0ff42');
            item.innerHTML = `
                <div class="service-icon">${glyphHTML}</div>
                <span class="service-name">${localizedName}</span>
            `;
            item.onclick = () => this.selectService(svc);
            serviceGrid.appendChild(item);
        });

        this.goToStep(2);
    }

    selectService(service) {
        this.selectedService = service;

        // Show preview
        const preview = document.getElementById('selected-service-preview');
        const localizedName = i18n.current === 'ar' ? (service.name_ar || service.name) : (service.name_en || service.name);
        const placeholder = i18n.current === 'ar' ? (service.placeholder_ar || i18n.t('code_value_label')) : (service.placeholder_en || i18n.t('code_value_label'));

        const glyphHTML = this.generateFuturisticGlyph(service.id, service.color);
        preview.innerHTML = `
            <div class="preview-icon">${glyphHTML}</div>
            <span class="preview-name">${localizedName}</span>
        `;

        // Set placeholder
        const label = document.getElementById('code-value-label');
        label.textContent = placeholder;

        document.getElementById('code-value-input').placeholder = placeholder;
        document.getElementById('code-value-input').value = '';
        document.getElementById('code-name-input').value = '';

        this.goToStep(3);
    }

    goToStep(step) {
        this.currentStep = step;

        // Hide all steps
        document.querySelectorAll('.code-step').forEach(s => s.classList.add('hidden'));
        document.querySelectorAll('.code-step').forEach(s => s.classList.remove('active'));

        // Show current step with animation
        const currentStepEl = document.getElementById(
            step === 1 ? 'step-category' : step === 2 ? 'step-service' : 'step-form'
        );
        currentStepEl?.classList.remove('hidden');
        currentStepEl?.classList.add('active');

        gsap.fromTo(currentStepEl,
            { opacity: 0, x: 20 },
            { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
        );

        // Update progress dots
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i < step);
        });

        // Show/hide back button
        document.getElementById('back-step-btn')?.classList.toggle('hidden', step === 1);

        // Update title
        const titles = ['إضافة كود جديد', 'اختر الخدمة', 'أدخل البيانات'];
        document.getElementById('code-modal-title').textContent = titles[step - 1];
    }

    goToPreviousStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }

    async createCode() {
        const value = document.getElementById('code-value-input').value.trim();
        const name = document.getElementById('code-name-input').value.trim();

        if (!value || !this.selectedService || !this.currentVaultIdentity) {
            this.showToast('يرجى ملء جميع الحقول', 'error');
            return;
        }

        this.setLoading(document.getElementById('code-value-form'), true);
        const t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

        try {
            const result = await this.callApi('/codes/create', 'POST', {
                identity_id: this.currentVaultIdentity,
                service_id: this.selectedService.id,
                name: name,
                display_value: value
            });

            if (result.success) {
                this.showToast(t('msg_success'), 'success');
                this.closeCodeModal();
                await this.openVault(this.currentVaultIdentity, true);
            } else {
                this.showToast(result.message || t('msg_error'), 'error');
            }
        } catch (err) {
            console.error('Create code error:', err);
            this.showToast(err.message || t('msg_error'), 'error');
        } finally {
            this.setLoading(document.getElementById('code-value-form'), false);
        }
    }

    // =====================
    // PASSWORD HELPERS
    // =====================
    setupPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.getElementById(btn.dataset.target);
                if (input) {
                    input.type = input.type === 'password' ? 'text' : 'password';
                    btn.innerHTML = input.type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
                }
            });
        });
    }

    setupPasswordValidation() {
        const passwordInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm');
        const strengthBar = document.querySelector('.strength-bar');
        const confirmHint = document.getElementById('confirm-hint');

        passwordInput?.addEventListener('input', () => {
            const val = passwordInput.value;
            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.length >= 10) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            const percent = (strength / 5) * 100;
            if (strengthBar) {
                strengthBar.style.width = percent + '%';
                strengthBar.style.background =
                    percent < 40 ? '#ff4444' : percent < 70 ? '#ffaa00' : '#44ff44';
            }
        });

        confirmInput?.addEventListener('input', () => {
            const match = confirmInput.value === passwordInput?.value;
            if (confirmHint) {
                confirmHint.textContent = match ? '✓ متطابقة' : '✗ غير متطابقة';
                confirmHint.style.color = match ? '#44ff44' : '#ff4444';
            }
        });
    }

    // =====================
    // UTILITIES
    // =====================
    setLoading(form, isLoading) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = isLoading;
            btn.style.opacity = isLoading ? '0.6' : '1';
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        gsap.fromTo(toast, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });

        setTimeout(() => {
            gsap.to(toast, { opacity: 0, y: -20, duration: 0.3, onComplete: () => toast.remove() });
        }, 3000);
    }

    // =====================
    // SHARE SYSTEM (Web Share API + Fallback)
    // =====================
    setupShareSystem() {
        const shareBtn = document.getElementById('share-app-btn');

        shareBtn?.addEventListener('click', async () => {
            await this.shareApp();
        });
    }

    async shareApp() {
        const t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

        try {
            // Fetch unique referral link from backend
            const refData = await this.callApi('/referral/link');
            const shareUrl = refData.data.referral_link;

            // Share content
            const shareData = {
                title: 'QRme - ' + t('app_tagline'),
                text: t('share_text'),
                url: shareUrl
            };

            // Check if Web Share API is available (native share sheet)
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);

                // Points are NOT awarded here anymore.
                // Points are awarded when the recipient opens the link.
                this.showToast(t('msg_verification_sent'), 'info');

            } else {
                // Fallback: Show modal with unique link
                await this.showShareFallback(shareData);
            }
        } catch (err) {
            // User cancelled share
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err);
                this.showToast(t('msg_error'), 'error');
            }
        }
    }

    async showShareFallback(shareData) {
        const t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

        // Create fallback modal
        const modal = document.createElement('div');
        modal.id = 'share-fallback-modal';
        modal.className = 'share-fallback-modal';
        modal.innerHTML = `
            <div class="share-fallback-container">
                <div class="share-fallback-header">
                    <h3>${t('share_title')}</h3>
                    <button class="btn-close-share">✕</button>
                </div>
                <div class="share-fallback-content">
                    <p class="share-text">${shareData.text}</p>
                    <div class="share-link-box">
                        <input type="text" value="${shareData.url}" readonly id="share-url-input">
                        <button class="btn-copy-link" id="copy-share-link">
                            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                        </button>
                    </div>
                    <div class="share-apps">
                        <a href="https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}" target="_blank" class="share-app-btn whatsapp">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path fill="currentColor" d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.789l4.925-1.292A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.178-.697-5.818-1.879l-.417-.281-2.924.767.781-2.852-.308-.489A9.82 9.82 0 012.182 12c0-5.423 4.395-9.818 9.818-9.818S21.818 6.577 21.818 12 17.423 21.818 12 21.818z"/></svg>
                        </a>
                        <a href="https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}" target="_blank" class="share-app-btn telegram">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                        </a>
                        <a href="mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.text + ' ' + shareData.url)}" class="share-app-btn email">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Animate in
        gsap.fromTo(modal.querySelector('.share-fallback-container'),
            { opacity: 0, scale: 0.9, y: 30 },
            { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'power3.out' }
        );

        // Event listeners
        modal.querySelector('.btn-close-share').onclick = () => this.closeShareModal(modal);
        modal.onclick = (e) => { if (e.target === modal) this.closeShareModal(modal); };

        // Copy functionality
        modal.querySelector('#copy-share-link').onclick = async () => {
            const input = modal.querySelector('#share-url-input');
            try {
                await navigator.clipboard.writeText(input.value);
                this.showToast(t('msg_copied'), 'success');
                this.closeShareModal(modal);
            } catch (err) {
                input.select();
                document.execCommand('copy');
                this.showToast(t('msg_copied'), 'success');
            }
        };

        // Track clicks on share app links
        modal.querySelectorAll('.share-app-btn').forEach(btn => {
            btn.onclick = async () => {
                setTimeout(async () => {
                    this.closeShareModal(modal);
                }, 500);
            };
        });
    }

    closeShareModal(modal) {
        gsap.to(modal.querySelector('.share-fallback-container'), {
            opacity: 0, scale: 0.9, y: 30, duration: 0.3, ease: 'power3.in',
            onComplete: () => modal.remove()
        });
    }

    async awardSharePoints(channel = 'unknown') {
        if (!this.user) return;

        const t = typeof i18n !== 'undefined' ? i18n.t.bind(i18n) : (k) => k;

        try {
            const result = await this.callApi('/user/share', 'POST', { channel });

            if (result.success) {
                this.userPoints = result.data.total_points;
                this.updatePointsDisplay();
                this.showToast(`${t('share_success')}`, 'success');
            }
        } catch (err) {
            if (err.message === 'Cooldown active') {
                this.showToast(t('share_cooldown'), 'warning');
            } else {
                console.warn('Points award failed:', err.message);
            }
        }
    }

    async loadUserPoints() {
        if (!this.user) return;

        try {
            const result = await this.callApi('/user/points');

            if (result.success && result.data) {
                this.userPoints = result.data.total_points || 0;
                this.updatePointsDisplay();
            }
        } catch (err) {
            console.warn('Failed to load points:', err.message);
        }
    }

    updatePointsDisplay() {
        const pointsValue = document.getElementById('points-value');
        if (pointsValue) {
            pointsValue.textContent = this.userPoints;

            // Animate if points changed
            gsap.fromTo(pointsValue,
                { scale: 1.3, color: '#f0ff42' },
                { scale: 1, color: '#ffffff', duration: 0.5, ease: 'elastic.out(1, 0.3)' }
            );
        }
    }

    // =====================
    // REQUIREMENT 6: IDENTITY EDITING
    // =====================
    setupIdentityEditing() {
        document.getElementById('edit-identity-btn')?.addEventListener('click', () => {
            if (!this.identity) return;
            document.getElementById('edit-id-name').value = this.identity.full_name || '';
            document.getElementById('edit-id-bio').value = this.identity.bio || '';
            document.getElementById('edit-identity-overlay')?.classList.remove('hidden');
        });

        document.getElementById('close-edit-identity')?.addEventListener('click', () => {
            document.getElementById('edit-identity-overlay')?.classList.add('hidden');
        });

        document.getElementById('edit-identity-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-id-name').value.trim();
            const bio = document.getElementById('edit-id-bio').value.trim();

            try {
                const result = await this.callApi('/user/identity', 'PUT', {
                    full_name: name,
                    bio: bio
                });

                if (result.success) {
                    this.showToast(i18n.t('msg_success'), 'success');
                    document.getElementById('edit-identity-overlay')?.classList.add('hidden');
                    await this.loadHub();
                    if (this.currentVaultIdentity) {
                        await this.openVault(this.currentVaultIdentity, true);
                    }
                }
            } catch (err) {
                this.showToast(err.message || i18n.t('msg_error'), 'error');
            }
        });

        document.getElementById('delete-identity-final-btn')?.addEventListener('click', () => this.deleteIdentity());
    }

    async deleteIdentity() {
        if (!confirm(i18n.t('delete_confirm'))) return;

        try {
            const btn = document.getElementById('delete-identity-final-btn');
            if (btn) {
                btn.disabled = true;
                btn.textContent = '...';
            }

            const result = await this.callApi('/user/identity', 'DELETE');
            if (result.success) {
                this.showToast(i18n.t('msg_success'), 'success');
                document.getElementById('edit-identity-overlay')?.classList.add('hidden');
                document.getElementById('vault-overlay')?.classList.add('hidden');
                this.identity = null;
                await this.loadHub();
            }
        } catch (err) {
            this.showToast(err.message || i18n.t('msg_error'), 'error');
        } finally {
            const btn = document.getElementById('delete-identity-final-btn');
            if (btn) {
                btn.disabled = false;
                btn.textContent = i18n.t('delete_identity_btn');
            }
        }
    }

    // =====================
    // ============================================
    // ADMIN SUPREMACY LOGIC (Requirement 1-10)
    // ============================================
    setupAdminDashboard() {
        // Tab Navigation
        document.querySelectorAll('.admin-nav-vertical .nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.admin-nav-vertical .nav-item').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.admin-tab').forEach(c => c.classList.add('hidden'));
                btn.classList.add('active');
                const targetId = btn.dataset.target;
                document.getElementById(targetId).classList.remove('hidden');

                // Close sidebar on mobile after click
                if (window.innerWidth <= 1024) {
                    this.toggleAdminSidebar(false);
                }

                this.loadAdminTab(targetId);
            });
        });

        // Toggle Admin Sidebar (Mobile Drawer)
        document.getElementById('admin-nav-toggle')?.addEventListener('click', () => {
            this.toggleAdminSidebar();
        });

        // Close when clicking outside (on backdrop)
        document.querySelector('.admin-supremacy')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('admin-supremacy') && window.innerWidth <= 1024) {
                this.toggleAdminSidebar(false);
            }
        });

        document.getElementById('admin-exit-btn')?.addEventListener('click', () => {
            if (window.innerWidth <= 1024) this.toggleAdminSidebar(false);
            this.showView('hub');
        });

        // Search filter
        document.getElementById('admin-user-search')?.addEventListener('input', (e) => {
            clearTimeout(this.adminSearchTimer);
            this.adminSearchTimer = setTimeout(() => this.loadAdminUsers(e.target.value), 500);
        });
    }

    toggleAdminSidebar(force) {
        const sidebar = document.querySelector('.admin-sidebar');
        const container = document.querySelector('.admin-supremacy');
        const isOpen = sidebar.classList.contains('open');
        const nextState = force !== undefined ? force : !isOpen;

        sidebar.classList.toggle('open', nextState);
        container.classList.toggle('nav-open', nextState);
    }

    showAdminLink() {
        const controls = document.getElementById('user-controls');
        if (controls && !document.getElementById('admin-link-btn')) {
            const adminBtn = document.createElement('button');
            adminBtn.id = 'admin-link-btn';
            adminBtn.className = 'btn-admin-secret';
            adminBtn.innerHTML = '⚡';
            adminBtn.onclick = () => {
                this.showView('admin');
                this.loadAdminTab('admin-overview');
            };
            controls.prepend(adminBtn);
        }
    }

    async loadAdminTab(tabId) {
        switch (tabId) {
            case 'admin-overview': await this.loadAdminOverview(); break;
            case 'admin-users': await this.loadAdminUsers(); break;
            case 'admin-identities': await this.loadAdminIdentities(); break;
            case 'admin-logs': await this.loadAdminAuditLogs(); break;
        }
    }

    async loadAdminOverview() {
        try {
            const result = await this.callApi('/admin/system/overview');
            if (result.success) {
                const s = result.data.counters;
                const grid = document.getElementById('admin-kpis');
                grid.innerHTML = `
                    <div class="kpi-card">
                        <div class="kpi-label">${i18n.t('admin_total_users')}</div>
                        <div class="kpi-value">${s.users}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">${i18n.t('admin_total_identities')}</div>
                        <div class="kpi-value">${s.identities}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">${i18n.t('admin_total_codes')}</div>
                        <div class="kpi-value">${s.codes}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">${i18n.t('admin_total_scans')}</div>
                        <div class="kpi-value">${s.total_scans}</div>
                    </div>
                `;
            }
        } catch (err) { this.handleAdminError(err); }
    }

    async loadAdminUsers(search = '') {
        try {
            const result = await this.callApi(`/admin/users?search=${search}`);
            if (result.success) {
                const tbody = document.getElementById('admin-users-tbody');
                tbody.innerHTML = result.data.map(u => `
                    <tr>
                        <td>
                            <div class="u-info">
                                <strong>${u.full_name || 'Anonymous'}</strong><br>
                                <span class="u-email">${u.email}</span>
                            </div>
                        </td>
                        <td><span class="status-tag status-${u.status || 'active'}">${u.status || 'active'}</span></td>
                        <td>${u.nexus_identities?.length || 0}</td>
                        <td>${u.user_points?.total_points || 0}</td>
                        <td>${new Date(u.created_at).toLocaleDateString()}</td>
                        <td>
                            <div class="action-btns">
                                <button onclick="app.adminUserAction('${u.id}', 'SUSPEND')">${i18n.t('admin_action_suspend')}</button>
                                <button onclick="app.adminUserAction('${u.id}', 'BAN')">${i18n.t('admin_action_ban')}</button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) { this.handleAdminError(err); }
    }

    async adminUserAction(userId, action) {
        const reason = prompt(`${i18n.t('admin_prompt_reason')} ${action}:`);
        if (!reason) return;
        try {
            await this.callApi('/admin/users/action', 'POST', { userId, action, reason });
            this.showToast(i18n.t('admin_msg_success'), 'success');
            this.loadAdminUsers();
        } catch (err) { this.showToast(err.message, 'error'); }
    }

    handleAdminError(err) {
        console.error('[ADMIN FAIL]', err);
        this.showToast(i18n.t('admin_err_access'), 'error');
    }

    async loadAdminIdentities() {
        try {
            const result = await this.callApi('/admin/identities');
            if (result.success) {
                const grid = document.getElementById('admin-identities-grid');
                grid.innerHTML = result.data.map(id => `
                    <div class="kpi-card">
                        <div class="kpi-label">${id.id}</div>
                        <div class="kpi-value">${id.full_name}</div>
                        <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 10px;">
                            ${i18n.t('admin_label_owner_id')}: ${id.user_id.slice(0, 8)}...<br>
                            ${i18n.t('admin_label_codes')}: ${id.shops?.length || 0}
                        </p>
                    </div>
                `).join('');
            }
        } catch (err) { this.handleAdminError(err); }
    }

    async loadAdminAuditLogs() {
        try {
            const result = await this.callApi('/admin/audit-logs');
            if (result.success) {
                const container = document.getElementById('admin-full-audit-log');
                container.innerHTML = result.data.map(log => `
                    <div class="audit-item" style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span style="color: var(--yellow-warm); font-weight: 700;">[${log.action}]</span>
                        <span style="opacity: 0.6; font-size: 0.8rem;">${new Date(log.created_at).toLocaleString()}</span><br>
                        <span>Target: ${log.target_type} (${log.target_id})</span>
                    </div>
                `).join('');
            }
        } catch (err) { this.handleAdminError(err); }
    }


    async adminAction(action, target) {
        if (!confirm('Are you sure?')) return;
        try {
            await this.callApi(`/admin/action`, 'POST', { action, target });
            this.showToast('Action successful', 'success');
            this.loadAdminData();
        } catch (err) {
            this.showToast(err.message, 'error');
        }
    }

    // =====================
    // REQUIREMENT 4: ONBOARDING
    // =====================
    setupOnboarding() {
        document.getElementById('rules-close-btn')?.addEventListener('click', () => {
            const dontShow = document.getElementById('rules-dont-show-checkbox').checked;
            if (dontShow) {
                localStorage.setItem('qrme_rules_seen', 'true');
            }
            document.getElementById('rules-overlay').classList.add('hidden');
        });
    }

    checkOnboarding() {
        const seen = localStorage.getItem('qrme_rules_seen');
        if (!seen) {
            setTimeout(() => {
                const modal = document.getElementById('rules-overlay');
                modal.classList.remove('hidden');
                gsap.fromTo(modal.querySelector('.rules-container'),
                    { opacity: 0, scale: 0.9, y: 50 },
                    { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
                );
            }, 1000);
        }
    }

    // =====================
    // REQUIREMENT 1: SEMANTIC ICONS - MASSIVE EXPANSION
    // =====================
    generateFuturisticGlyph(serviceId, color = '#f0ff42') {
        const id = (serviceId || '').toLowerCase();
        let iconClass = "fas fa-link"; // Fallback: Universal link icon

        // Comprehensive Social Media & Service Mapping
        const mapping = {
            // Main Socials
            'instagram': 'fab fa-instagram',
            'facebook': 'fab fa-facebook',
            'messenger': 'fab fa-facebook-messenger',
            'tiktok': 'fab fa-tiktok',
            'snapchat': 'fab fa-snapchat',
            'youtube': 'fab fa-youtube',
            'whatsapp': 'fab fa-whatsapp',
            'telegram': 'fab fa-telegram',
            'twitter': 'fab fa-x-twitter',
            'x': 'fab fa-x-twitter',
            'linkedin': 'fab fa-linkedin',
            'threads': 'fab fa-threads',

            // Communication & Community
            'discord': 'fab fa-discord',
            'reddit': 'fab fa-reddit',
            'pinterest': 'fab fa-pinterest',
            'twitch': 'fab fa-twitch',
            'skype': 'fab fa-skype',
            'slack': 'fab fa-slack',
            'vimeo': 'fab fa-vimeo',
            'tumblr': 'fab fa-tumblr',
            'line': 'fab fa-line',

            // Development & Professional
            'github': 'fab fa-github',
            'gitlab': 'fab fa-gitlab',
            'bitbucket': 'fab fa-bitbucket',
            'stack-overflow': 'fab fa-stack-overflow',
            'portfolio': 'fas fa-briefcase',
            'resume': 'fas fa-file-pdf',
            'cv': 'fas fa-file-invoice',

            // Media & Music
            'spotify': 'fab fa-spotify',
            'soundcloud': 'fab fa-soundcloud',
            'apple-music': 'fab fa-apple',
            'music': 'fas fa-music',
            'video': 'fas fa-video',
            'netflix': 'fab fa-netflix',
            'google-play': 'fab fa-google-play',
            'app-store': 'fab fa-app-store-ios',

            // Business & Finance
            'paypal': 'fab fa-paypal',
            'patreon': 'fab fa-patreon',
            'buy-me-coffee': 'fas fa-coffee',
            'store': 'fas fa-store',
            'cart': 'fas fa-shopping-cart',
            'shop': 'fas fa-shop',
            'payment': 'fas fa-credit-card',

            // Communication Lines
            'phone': 'fas fa-phone',
            'call': 'fas fa-phone-volume',
            'email': 'fas fa-envelope',
            'mail': 'fas fa-at',
            'contact': 'fas fa-id-badge',

            // General Web / Utilities
            'web': 'fas fa-globe',
            'website': 'fas fa-laptop-code',
            'link': 'fas fa-link',
            'location': 'fas fa-location-dot',
            'map': 'fas fa-map-location-dot',
            'wifi': 'fas fa-wifi',
            'qr': 'fas fa-qrcode',
            'info': 'fas fa-circle-info',
            'other': 'fas fa-star-of-life'
        };

        // Advanced matching using keys
        for (const [key, value] of Object.entries(mapping)) {
            if (id.includes(key)) {
                iconClass = value;
                break;
            }
        }

        return `
            <div class="f-glyph" style="color: ${color}">
                <i class="${iconClass}"></i>
                <div class="glyph-glow" style="background: ${color}"></div>
            </div>
        `;
    }
}

// Initialize
const app = new QRmeApp();
document.addEventListener('DOMContentLoaded', () => app.init());

