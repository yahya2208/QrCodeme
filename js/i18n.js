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
            delete_confirm_code: 'هل أنت متأكد من حذف هذا الكود؟ لا يمكن التراجع عن هذا الإجراء.',

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
            points_disclaimer: 'النقاط هي نظام مكافآت معنوي فقط، وليست لها قيمة مالية ولا يمكن تحويلها لأرباح.',

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
            footer_for: 'لمستقبل رقمي آمن',

            // Privacy Policy
            privacy_title: 'سياسة الخصوصية',
            privacy_link: 'سياسة الخصوصية',
            privacy_last_update: 'آخر تحديث: 2024/01/28',

            // Game Rules (Onboarding)
            rules_title: 'قانون اللعبة',
            rules_subtitle: 'كيف تسيطر على المستقبل؟',
            rules_desc: 'نظام QRme يعتمد على التفاعل الذكي والقيمة المتبادلة.',
            rules_point1: '🚀 الهويات الأعلى نقاطًا تظهر أولاً في قائمة الاكتشاف.',
            rules_point2: '⭐ اكسب +5 نقاط عن كل شخص يفتح أحد روابطك.',
            rules_point3: '🌍 شارك التطبيق لزيادة انتشار هويتك الرقمية.',
            rules_point4: '⛔ الغش أو محاولة التلاعب تخصم -5 نقاط وقد تؤدي للحظر النهائي.',
            rules_point5: '⚠️ النقاط هي وسيلة تقييم معنوية فقط وليس لها أي قيمة مالية.',
            rules_acknowledge: 'فهمت القواعد، فلنبدأ!',
            rules_dont_show: 'لا تظهر هذه الرسالة مرة أخرى',

            // Curiosity Trap
            trap_title: 'هل هذا مجرد كود؟',
            trap_subtitle: 'لقد دخلت الخزنة بنجاح. ماذا لو كان الآخرون هم من يزورون خزنتك الآن؟ ابدأ بناء إرثك الرقمي.',
            trap_btn: '✨ امتلك هويتك الآن',

            // Admin Dashboard
            admin_title: 'وضع التحكم الشامل',
            admin_users: 'المستخدمون',
            admin_identities: 'الهويات',
            admin_codes: 'الأكواد',
            admin_stats_growth: 'نمو المنصة',
            admin_top_identities: 'أعلى الهويات',
            admin_ban_user: 'حظر',
            admin_delete: 'حذف',
            admin_adjust_points: 'تعديل النقاط',
            admin_nav_stats: 'الإحصائيات',
            admin_nav_users: 'المستخدمين',
            admin_nav_ids: 'الهويات',
            admin_nav_audit: 'سجل النشاط',
            admin_overview: 'نظرة عامة',
            admin_logs: 'السجلات',
            admin_total_users: 'المستخدمين',
            admin_total_identities: 'الهويات',
            admin_total_codes: 'الأكواد',
            admin_total_scans: 'إجمالي المسحات',
            admin_exit_btn: 'خروج من وضع الأدمن',
            admin_overview_title: 'نظرة عامة على النظام',
            admin_overview_desc: 'إحصائيات حيّة لأداء منصة QRme',
            admin_recent_actions: 'آخر عمليات الإدارة',
            admin_top_performance: 'أفضل الأداء',
            admin_users_title: 'إدارة المستخدمين',
            admin_search_placeholder: 'بحث بالإيميل أو الاسم...',
            admin_table_user: 'المستخدم',
            admin_table_status: 'الحالة',
            admin_table_identities: 'الهويات',
            admin_table_points: 'النقاط',
            admin_table_date: 'التاريخ',
            admin_table_actions: 'الإجراءات',
            admin_ids_title: 'إدارة الهويات',
            admin_logs_title: 'سجل نشاط النظام',
            admin_action_suspend: 'تعليق',
            admin_action_ban: 'حظر',
            admin_prompt_reason: 'السبب لـ ',
            admin_msg_success: 'تمت العملية بنجاح',
            admin_err_access: 'خطأ في الوصول أو في الخادم',
            admin_label_owner_id: 'معرف المالك',
            admin_label_codes: 'أكواد',
            admin_label_target: 'الهدف',
            common_confirm: 'هل أنت متأكد؟',

            // Identity Edit
            edit_identity_title: 'تعديل الهوية الرقمية',
            edit_identity_name: 'اسم الهوية',
            edit_identity_bio: 'النبذة التعريفية',
            edit_identity_save: 'حفظ التعديلات',
            delete_identity_p: 'عملية مسح الهوية نهائية ولا يمكن التراجع عنها.',
            delete_identity_btn: 'مسح الهوية نهائياً',
            delete_confirm_identity: 'هل أنت متأكد من حذف هويتك نهائياً؟ سيتم حذف جميع الأكواد المرتبطة بها أيضاً.'
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
            hub_reach_total: 'Total Network Reach',
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
            vault_per_count: 'scans/views',
            vault_total_engagement: 'Total Engagement',

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
            delete_confirm_code: 'Are you sure you want to delete this code? This action cannot be undone.',

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
            points_disclaimer: 'Points are for reward purposes only and have no monetary value and cannot be converted to profit.',

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
            footer_for: 'for a secure digital future',

            // Privacy Policy
            privacy_title: 'Privacy Policy',
            privacy_link: 'Privacy Policy',
            privacy_last_update: 'Last Update: 2024/01/28',

            // Game Rules (Onboarding)
            rules_title: 'The Game Law',
            rules_subtitle: 'How to dominate the future?',
            rules_desc: 'QRme system relies on smart interaction and mutual value.',
            rules_point1: '🚀 Higher points identities appear first in the Discovery Corridor.',
            rules_point2: '⭐ Earn +5 points every time someone opens one of your links.',
            rules_point3: '🌍 Share the app to increase your digital identity reach.',
            rules_point4: '⛔ Cheating or tampering attempts deduct -5 points and may lead to a ban.',
            rules_point5: '⚠️ Points are for reward purposes only and have no monetary value.',
            rules_acknowledge: 'I understand the rules, let’s go!',
            rules_dont_show: "Don't show this again",

            // Curiosity Trap
            trap_title: 'Just an ordinary code?',
            trap_subtitle: 'You have entered the vault. What if the world was visiting YOUR vault right now? Start building your digital legacy.',
            trap_btn: '✨ Claim Your Identity',

            // Admin Dashboard
            admin_title: 'Global Control Mode',
            admin_users: 'Users',
            admin_identities: 'Identities',
            admin_codes: 'Codes',
            admin_stats_growth: 'Platform Growth',
            admin_top_identities: 'Top Identities',
            admin_ban_user: 'Ban',
            admin_delete: 'Delete',
            admin_adjust_points: 'Adjust Points',
            admin_nav_stats: 'Statistics',
            admin_nav_users: 'Users',
            admin_nav_ids: 'Identities',
            admin_nav_audit: 'Audit Log',
            admin_overview: 'Overview',
            admin_logs: 'Logs',
            admin_total_users: 'Total Users',
            admin_total_identities: 'Total Identities',
            admin_total_codes: 'Total Codes',
            admin_total_scans: 'Total Scans',
            admin_exit_btn: 'Exit Admin Mode',
            admin_overview_title: 'System Overview',
            admin_overview_desc: 'Live statistics for QRme Platform',
            admin_recent_actions: 'Recent Admin Actions',
            admin_top_performance: 'Top Performance',
            admin_users_title: 'User Management',
            admin_search_placeholder: 'Search by email or name...',
            admin_table_user: 'User',
            admin_table_status: 'Status',
            admin_table_identities: 'Identities',
            admin_table_points: 'Points',
            admin_table_date: 'Date',
            admin_table_actions: 'Actions',
            admin_ids_title: 'Identity Management',
            admin_logs_title: 'System Activity Log',
            admin_action_suspend: 'Suspend',
            admin_action_ban: 'Ban',
            admin_prompt_reason: 'Reason for ',
            admin_msg_success: 'Action successful',
            admin_err_access: 'Access Violation or Server Error',
            admin_label_owner_id: 'Owner ID',
            admin_label_codes: 'Codes',
            admin_label_target: 'Target',
            common_confirm: 'Are you sure?',

            // Identity Edit
            edit_identity_title: 'Edit Digital Identity',
            edit_identity_name: 'Identity Name',
            edit_identity_bio: 'Biography',
            edit_identity_save: 'Save Changes',
            delete_identity_p: 'Deleting your identity is permanent and cannot be undone.',
            delete_identity_btn: 'Delete Identity Permanently',
            delete_confirm_identity: 'Are you sure you want to delete your identity permanently? All associated codes will be deleted as well.'
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
