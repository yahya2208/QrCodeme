// ============================================
// QRme V8.5 - COMPLETE LOCALIZATION SYSTEM
// ============================================
// Full i18n support for Arabic (RTL) and English (LTR)
// NO hardcoded strings - ALL text is translated
// ============================================

const i18n = {
    current: localStorage.getItem('qrme_lang') || 'ar',

    // Complete translations object
    translations: {
        // ============================================
        // ARABIC - العربية (RTL)
        // ============================================
        ar: {
            // Meta
            dir: 'rtl',
            lang: 'ar',
            font: "'Cairo', 'Outfit', sans-serif",

            // App Info
            app_name: 'QRme',
            app_tagline: 'هويتك الرقمية',
            app_description: 'أنشئ هويتك الرقمية وشاركها بأمان عبر QR Code',

            // Auth - Login
            login_title: 'مرحباً بعودتك',
            login_subtitle: 'سجّل دخولك للوصول إلى هويتك الرقمية',
            login_email: 'البريد الإلكتروني',
            login_password: 'كلمة المرور',
            login_btn: 'تسجيل الدخول',
            login_no_account: 'ليس لديك حساب؟',
            login_register_link: 'انضم الآن',

            // Auth - Register
            register_title: 'انضم إلى QRme',
            register_subtitle: 'أنشئ هويتك الرقمية المتطورة',
            register_fullname: 'الاسم الكامل',
            register_email: 'البريد الإلكتروني',
            register_password: 'كلمة المرور',
            register_confirm: 'تأكيد كلمة المرور',
            register_btn: 'إنشاء حساب',
            register_have_account: 'لديك حساب بالفعل؟',
            register_login_link: 'سجّل دخولك',

            // Auth - Verify
            verify_title: 'تأكيد البريد الإلكتروني',
            verify_subtitle: 'تم إرسال رابط التأكيد إلى',
            verify_resend: 'إعادة الإرسال',
            verify_back: 'رجوع لتسجيل الدخول',

            // Hub
            hub_my_space: 'المساحة الشخصية',
            hub_discovery: 'رواق الاكتشاف',
            hub_create_identity: 'تكوين هويتك الرقمية',
            hub_name_label: 'الاسم الكامل',
            hub_bio_label: 'نبذة قصيرة',
            hub_reach_total: 'إجمالي وصول الشبكة',
            hub_create_btn: 'تكوين الهوية',
            hub_empty_discovery: 'لا توجد هويات عامة',
            hub_codes_count: 'أكواد',

            // Vault
            vault_title: 'خزنة الأكواد',
            vault_empty: 'الخزنة فارغة',
            vault_loading: 'جاري التحميل...',
            vault_owner_badge: 'مالك',
            vault_visitor_badge: 'زائر',
            vault_tap_qr: 'اضغط لعرض QR',
            vault_add_code: 'إضافة كود',
            vault_per_count: 'مسحة/مشاهدة',
            vault_total_engagement: 'إجمالي التفاعل',

            // Code Creation
            code_modal_title: 'إضافة كود جديد',
            code_step_category: 'اختر المجال',
            code_step_service: 'اختر الخدمة',
            code_step_form: 'أدخل البيانات',
            code_value_label: 'الرابط أو الرقم',
            code_name_label: 'اسم مخصص (اختياري)',
            code_save_btn: 'حفظ الكود',
            code_back_btn: 'رجوع',

            // QR Modal
            qr_title: 'QR Code',
            qr_scan_instruction: 'امسح الكود باستخدام كاميرا الهاتف',
            qr_encrypted_title: 'البيانات مشفرة',
            qr_encrypted_desc: 'هذا الكود محمي ولا يمكنك عرضه',
            qr_encrypted_info: 'لا يمكن عرض QR Code للمستخدمين الآخرين',

            // Edit/Delete
            edit_title: 'تعديل الكود',
            edit_value_label: 'الرابط أو الرقم الجديد',
            edit_save_btn: 'حفظ التعديل',
            delete_confirm: 'هل أنت متأكد من حذف هذا الكود؟ لا يمكن التراجع عن هذا الإجراء.',

            // Share
            share_btn: 'مشاركة التطبيق',
            share_title: 'شارك QRme',
            share_text: 'جرّب تطبيق QRme - هويتك الرقمية الآمنة! أنشئ أكواد QR لجميع حساباتك وشاركها بسهولة.',
            share_success: 'شكراً لمشاركتك! +5 نقاط',
            share_cooldown: 'انتظر قليلاً قبل المشاركة مرة أخرى',

            // Points
            points_title: 'نقاطي',
            points_label: 'نقطة',
            points_total_shares: 'مشاركة',
            points_earn_more: 'شارك لتكسب المزيد!',

            // Messages
            msg_success: 'تم بنجاح',
            msg_error: 'حدث خطأ',
            msg_loading: 'جاري التحميل...',
            msg_saved: 'تم الحفظ',
            msg_deleted: 'تم الحذف',
            msg_copied: 'تم النسخ',
            msg_verification_sent: 'تم إرسال رابط التأكيد',

            // Errors
            err_login_failed: 'فشل تسجيل الدخول',
            err_register_failed: 'فشل التسجيل',
            err_rate_limit: 'عدد محاولات كثيرة! انتظر بضع دقائق',
            err_already_registered: 'هذا البريد مسجل بالفعل',
            err_invalid_email: 'البريد الإلكتروني غير صحيح',
            err_weak_password: 'كلمة المرور ضعيفة',
            err_password_mismatch: 'كلمتا المرور غير متطابقتين',
            err_min_password: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
            err_fill_fields: 'يرجى ملء جميع الحقول',
            err_create_code: 'فشل إنشاء الكود',
            err_update_code: 'فشل تحديث الكود',
            err_delete_code: 'فشل حذف الكود',
            err_create_identity: 'فشل إنشاء الهوية',

            // UI
            btn_close: 'إغلاق',
            btn_cancel: 'إلغاء',
            btn_confirm: 'تأكيد',
            btn_logout: 'خروج',
            btn_save: 'حفظ',
            btn_edit: 'تعديل',
            btn_delete: 'حذف',
            btn_copy: 'نسخ',
            btn_download: 'تحميل',

            // Footer
            footer_made_with: 'صُنع بـ',
            footer_for: 'لمستقبل رقمي آمن'
        },

        // ============================================
        // ENGLISH (LTR)
        // ============================================
        en: {
            // Meta
            dir: 'ltr',
            lang: 'en',
            font: "'Outfit', 'Cairo', sans-serif",

            // App Info
            app_name: 'QRme',
            app_tagline: 'Your Digital Identity',
            app_description: 'Create your digital identity and share it securely via QR Code',

            // Auth - Login
            login_title: 'Welcome Back',
            login_subtitle: 'Sign in to access your digital identity',
            login_email: 'Email Address',
            login_password: 'Password',
            login_btn: 'Sign In',
            login_no_account: "Don't have an account?",
            login_register_link: 'Join Now',

            // Auth - Register
            register_title: 'Join QRme',
            register_subtitle: 'Create your advanced digital identity',
            register_fullname: 'Full Name',
            register_email: 'Email Address',
            register_password: 'Password',
            register_confirm: 'Confirm Password',
            register_btn: 'Create Account',
            register_have_account: 'Already have an account?',
            register_login_link: 'Sign In',

            // Auth - Verify
            verify_title: 'Email Verification',
            verify_subtitle: 'Verification link sent to',
            verify_resend: 'Resend',
            verify_back: 'Back to Sign In',

            // Hub
            hub_my_space: 'My Space',
            hub_discovery: 'Discovery Corridor',
            hub_create_identity: 'Create Your Digital Identity',
            hub_name_label: 'Full Name',
            hub_bio_label: 'Short Bio',
            hub_create_btn: 'Create Identity',
            hub_empty_discovery: 'No public identities',
            hub_codes_count: 'codes',

            // Vault
            vault_title: 'Code Vault',
            vault_empty: 'Vault is empty',
            vault_loading: 'Loading...',
            vault_owner_badge: 'Owner',
            vault_visitor_badge: 'Visitor',
            vault_tap_qr: 'Tap for QR',
            vault_add_code: 'Add Code',

            // Code Creation
            code_modal_title: 'Add New Code',
            code_step_category: 'Choose Category',
            code_step_service: 'Choose Service',
            code_step_form: 'Enter Details',
            code_value_label: 'Link or Number',
            code_name_label: 'Custom Name (optional)',
            code_save_btn: 'Save Code',
            code_back_btn: 'Back',

            // QR Modal
            qr_title: 'QR Code',
            qr_scan_instruction: 'Scan this code with your phone camera',
            qr_encrypted_title: 'Data Encrypted',
            qr_encrypted_desc: 'This code is protected and cannot be viewed',
            qr_encrypted_info: 'QR Code cannot be shown to other users',

            // Edit/Delete
            edit_title: 'Edit Code',
            edit_value_label: 'New Link or Number',
            edit_save_btn: 'Save Changes',
            delete_confirm: 'Are you sure you want to delete this code? This action cannot be undone.',

            // Share
            share_btn: 'Share App',
            share_title: 'Share QRme',
            share_text: 'Try QRme - Your secure digital identity! Create QR codes for all your accounts and share them easily.',
            share_success: 'Thanks for sharing! +5 points',
            share_cooldown: 'Please wait before sharing again',

            // Points
            points_title: 'My Points',
            points_label: 'points',
            points_total_shares: 'shares',
            points_earn_more: 'Share to earn more!',

            // Messages
            msg_success: 'Success',
            msg_error: 'Error occurred',
            msg_loading: 'Loading...',
            msg_saved: 'Saved',
            msg_deleted: 'Deleted',
            msg_copied: 'Copied',
            msg_verification_sent: 'Verification link sent',

            // Errors
            err_login_failed: 'Login failed',
            err_register_failed: 'Registration failed',
            err_rate_limit: 'Too many attempts! Please wait',
            err_already_registered: 'Email already registered',
            err_invalid_email: 'Invalid email address',
            err_weak_password: 'Password is too weak',
            err_password_mismatch: 'Passwords do not match',
            err_min_password: 'Password must be at least 6 characters',
            err_fill_fields: 'Please fill all fields',
            err_create_code: 'Failed to create code',
            err_update_code: 'Failed to update code',
            err_delete_code: 'Failed to delete code',
            err_create_identity: 'Failed to create identity',

            // UI
            btn_close: 'Close',
            btn_cancel: 'Cancel',
            btn_confirm: 'Confirm',
            btn_logout: 'Sign Out',
            btn_save: 'Save',
            btn_edit: 'Edit',
            btn_delete: 'Delete',
            btn_copy: 'Copy',
            btn_download: 'Download',

            // Footer
            footer_made_with: 'Made with',
            footer_for: 'for a secure digital future'
        }
    },

    // Initialize localization
    init() {
        this.applyLanguage();
        this.updateDOM();
    },

    // Get translation by key
    t(key) {
        return this.translations[this.current]?.[key] || key;
    },

    // Set language and apply
    setLang(lang) {
        if (!this.translations[lang]) return;

        this.current = lang;
        localStorage.setItem('qrme_lang', lang);
        this.applyLanguage();
        this.updateDOM();

        // Dispatch event for dynamic components
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    },

    // Toggle between AR/EN
    toggle() {
        this.setLang(this.current === 'ar' ? 'en' : 'ar');
    },

    // Apply language settings to document
    applyLanguage() {
        const t = this.translations[this.current];

        document.documentElement.lang = t.lang;
        document.documentElement.dir = t.dir;
        document.body.style.fontFamily = t.font;

        // Update lang toggle button
        const langLabel = document.getElementById('lang-label');
        if (langLabel) {
            langLabel.textContent = this.current === 'ar' ? 'EN' : 'عربي';
        }
    },

    // Update all DOM elements with data-t attribute
    updateDOM() {
        const t = this.translations[this.current];

        // Update elements with data-t attribute
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.dataset.t;
            if (t[key]) {
                el.textContent = t[key];
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-t-placeholder]').forEach(el => {
            const key = el.dataset.tPlaceholder;
            if (t[key]) {
                el.placeholder = t[key];
            }
        });

        // Update titles
        document.querySelectorAll('[data-t-title]').forEach(el => {
            const key = el.dataset.tTitle;
            if (t[key]) {
                el.title = t[key];
            }
        });

        // Update page title
        document.title = `${t.app_name} | ${t.app_tagline}`;
    },

    // Check if current language is RTL
    isRTL() {
        return this.current === 'ar';
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
    i18n.init();
}

// Export for use
window.i18n = i18n;
