-- ============================================
-- QRme V7 - IDENTITY-CENTRIC CODE SYSTEM
-- ============================================

-- 0. DROP EXISTING FUNCTIONS FIRST (Required to change return types)
DROP FUNCTION IF EXISTS get_public_hub(INTEGER);
DROP FUNCTION IF EXISTS get_public_hub;
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID);
DROP FUNCTION IF EXISTS get_identity_codes;
DROP FUNCTION IF EXISTS create_user_identity(TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_identity;

-- 1. CATEGORIES (المجالات)
DROP TABLE IF EXISTS code_categories CASCADE;
CREATE TABLE code_categories (
    id TEXT PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO code_categories (id, name_ar, name_en, icon, sort_order) VALUES
('social', 'تواصل اجتماعي', 'Social Media', '📱', 1),
('store', 'متجر', 'Store', '🛒', 2),
('service', 'خدمة', 'Service', '⚡', 3),
('personal', 'موقع شخصي', 'Personal Website', '🌐', 4),
('contact', 'واتساب / هاتف', 'WhatsApp / Phone', '📞', 5);

-- 2. SERVICES (الخدمات داخل كل مجال - مع أيقونات حديثة)
DROP TABLE IF EXISTS code_services CASCADE;
CREATE TABLE code_services (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES code_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon_svg TEXT, -- SVG icon code
    color TEXT,
    placeholder_ar TEXT,
    placeholder_en TEXT
);

-- Social Media Services
INSERT INTO code_services (id, category_id, name, icon_svg, color, placeholder_ar, placeholder_en) VALUES
('facebook', 'social', 'Facebook', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>', '#1877F2', 'رابط صفحتك على فيسبوك', 'Your Facebook page URL'),
('instagram', 'social', 'Instagram', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"/></svg>', '#E4405F', 'رابط حسابك على انستغرام', 'Your Instagram profile URL'),
('whatsapp', 'contact', 'WhatsApp', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>', '#25D366', 'رقم الواتساب', 'WhatsApp number'),
('telegram', 'social', 'Telegram', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>', '#0088CC', 'رابط حسابك على تيليجرام', 'Your Telegram link'),
('twitter', 'social', 'X (Twitter)', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>', '#000000', 'رابط حسابك على X', 'Your X (Twitter) URL'),
('tiktok', 'social', 'TikTok', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>', '#000000', 'رابط حسابك على تيك توك', 'Your TikTok URL'),
('youtube', 'social', 'YouTube', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>', '#FF0000', 'رابط قناتك على يوتيوب', 'Your YouTube channel URL'),
('linkedin', 'social', 'LinkedIn', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>', '#0A66C2', 'رابط حسابك على لينكد إن', 'Your LinkedIn URL'),
('website', 'personal', 'Website', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>', '#4285F4', 'رابط موقعك الشخصي', 'Your website URL'),
('phone', 'contact', 'Phone', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>', '#34A853', 'رقم الهاتف', 'Phone number'),
('email', 'contact', 'Email', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>', '#EA4335', 'البريد الإلكتروني', 'Email address'),
('snapchat', 'social', 'Snapchat', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>', '#FFFC00', 'اسم المستخدم على سناب شات', 'Snapchat username');

-- 3. تحديث جدول الأكواد ليشمل الخدمة والتشفير
DROP TABLE IF EXISTS shops CASCADE;
CREATE TABLE shops (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    identity_id TEXT REFERENCES nexus_identities(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    service_id TEXT REFERENCES code_services(id),
    name TEXT NOT NULL,
    value TEXT NOT NULL, -- الرابط أو الرقم
    is_public BOOLEAN DEFAULT TRUE, -- هل يظهر للعامة
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shops: Public read" ON shops FOR SELECT USING (true);
CREATE POLICY "Shops: Owner manages" ON shops FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. RPC لجلب أكواد الهوية مع التشفير للعامة
CREATE OR REPLACE FUNCTION get_identity_codes(p_identity_id TEXT, p_viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id BIGINT,
    service_id TEXT,
    service_name TEXT,
    service_icon TEXT,
    service_color TEXT,
    name TEXT,
    display_value TEXT, -- القيمة المشفرة أو الكاملة
    is_owner BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    identity_owner UUID;
BEGIN
    -- Get the identity owner
    SELECT user_id INTO identity_owner FROM nexus_identities WHERE nexus_identities.id = p_identity_id;
    
    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        cs.name AS service_name,
        cs.icon_svg AS service_icon,
        cs.color AS service_color,
        s.name,
        CASE 
            WHEN p_viewer_id = identity_owner THEN s.value -- Owner sees full value
            ELSE CONCAT(REPEAT('•', GREATEST(LENGTH(s.value) - 4, 0)), RIGHT(s.value, 4)) -- Others see masked
        END AS display_value,
        (p_viewer_id = identity_owner) AS is_owner,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id AND s.is_public = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. تحديث get_public_hub
CREATE OR REPLACE FUNCTION get_public_hub(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    id TEXT,
    full_name TEXT,
    bio TEXT,
    user_id UUID,
    codes_count BIGINT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        ni.id, 
        ni.full_name, 
        ni.bio, 
        ni.user_id,
        (SELECT COUNT(*) FROM shops WHERE identity_id = ni.id) AS codes_count,
        ni.created_at
    FROM nexus_identities ni 
    ORDER BY ni.created_at DESC 
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

NOTIFY pgrst, 'reload schema';
