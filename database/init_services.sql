-- ============================================
-- SYSTEM ASSETS & RENDERING INITIALIZATION
-- ============================================
-- This script ensures that the "Services" (Facebook, WhatsApp, etc.) exist.
-- Without these, the vault cannot link your codes to icons, and they won't appear.

-- 1. Create Code Categories Table (DROP first to fix schema conflicts)
DROP TABLE IF EXISTS code_services CASCADE;
DROP TABLE IF EXISTS code_categories CASCADE;

CREATE TABLE code_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 2. Create Code Services Table
CREATE TABLE code_services (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES code_categories(id),
    name TEXT NOT NULL,
    icon_svg TEXT,
    color TEXT DEFAULT '#ffffff',
    placeholder TEXT
);

-- 3. Populate Default Categories
INSERT INTO code_categories (id, name, icon, sort_order) VALUES
('social', 'Social Media', '🌐', 1),
('contact', 'Contact Info', '📞', 2),
('payment', 'Payments', '💰', 3),
('other', 'Other', '✨', 4)
ON CONFLICT (id) DO NOTHING;

-- 4. Populate Default Services (Actual SVGs and Colors)
INSERT INTO code_services (id, category_id, name, icon_svg, color, placeholder) VALUES
('whatsapp', 'contact', 'WhatsApp', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.19-.3a8.13 8.13 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m-3.53 3.03c-.19 0-.43.03-.66.25-.23.23-.87.85-.87 2.07 0 1.22.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.1-.23-.17-.48-.3s-1.46-.72-1.69-.81c-.23-.08-.39-.12-.56.12-.17.25-.66.83-.81 1.01-.15.17-.29.19-.54.07s-1.05-.39-1.99-1.23c-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43s.17-.23.25-.39c.09-.17.04-.31-.02-.43s-.56-1.35-.77-1.85c-.21-.51-.43-.43-.56-.44l-.48-.01z"/></svg>', '#25D366', 'https://wa.me/yournumber'),
('facebook', 'social', 'Facebook', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 4.97 3.66 9.08 8.44 9.83v-6.95h-2.52v-2.88h2.52v-2.2c0-2.48 1.47-3.85 3.74-3.85 1.09 0 2.23.19 2.23.19v2.45h-1.26c-1.23 0-1.62.76-1.62 1.54v1.86h2.77l-.44 2.88h-2.33v6.95c4.78-.75 8.44-4.86 8.44-9.83 0-5.53-4.5-10.02-10-10.02z"/></svg>', '#1877F2', 'https://facebook.com/username'),
('instagram', 'social', 'Instagram', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8A3.6 3.6 0 007.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6A3.6 3.6 0 0016.4 4H7.6m4.4 3.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9m0 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5M17 5.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/></svg>', '#E4405F', 'https://instagram.com/username'),
('snapchat', 'social', 'Snapchat', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-.67 0-1.22.46-1.68.86-.46.39-.81.65-1.57.65-1.12 0-2 .88-2.61 1.76-.62.88-1.04 2.05-1.39 3.23-.11.39-.21.78-.31 1.15l-.23.86c-.1.38-.2.72-.34.98-.13.25-.33.45-.7.58-.29.1-.56.24-.77.44-.21.19-.36.43-.44.75-.15.65.1 1.35.59 1.83.2.19.45.33.72.43.27.1.56.17.84.2.03.02.05.04.09.06l1.37.58c.28.12.55.22.78.36.23.14.41.33.49.61.1.33.22.7.35 1.05.13.35.29.7.47.98.37.56 1 1 1.75 1.24.47.15 1 .23 1.54.23s1.07-.08 1.54-.23c.75-.24 1.38-.68 1.75-1.24.18-.28.34-.63.47-.98.13-.35.25-.72.35-1.05.08-.28.26-.47.49-.61.23-.14.5-.24.78-.36l1.37-.58c.04-.02.06-.04.09-.06.28-.03.57-.1.84-.2.27-.1.52-.24.72-.43.49-.48.74-1.18.59-1.83-.08-.32-.23-.56-.44-.75-.21-.2-.48-.34-.77-.44-.37-.13-.57-.33-.7-.58-.14-.26-.24-.6-.34-.98l-.23-.86c-.1-.37-.2-.76-.31-1.15-.35-1.18-.77-2.35-1.39-3.23-.61-.88-1.49-1.76-2.61-1.76-.76 0-1.11-.26-1.57-.65C13.22 2.46 12.67 2 12 2z"/></svg>', '#FFFC00', 'Username'),
('tiktok', 'social', 'TikTok', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.74 4.24 1.97.03 1.44.03 2.87.03 4.31-.31-.04-.62-.07-.93-.18-1.37-.34-2.58-1.15-3.41-2.25V15.5c.01 1.07-.22 2.14-.7 3.12-.49.97-1.23 1.81-2.12 2.44-1.81 1.29-4.17 1.68-6.28 1.04-2.11-.64-3.83-2.36-4.48-4.47-.65-2.11-.26-4.47 1.04-6.27.63-.89 1.47-1.63 2.44-2.12.98-.48 2.05-.71 3.12-.7 1.07.01 2.14.24 3.12.72v4.36c-.63-.33-1.33-.52-2.04-.54-1.45-.04-2.88.58-3.82 1.69-.94 1.11-1.29 2.59-1.01 4.02.28 1.42 1.23 2.62 2.53 3.18.65.28 1.36.42 2.07.41 1.45.04 2.88-.58 3.82-1.69.94-1.11 1.29-2.59 1.01-4.02V.02z"/></svg>', '#000000', 'https://tiktok.com/@username'),
('website', 'other', 'Website', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>', '#7C4DFF', 'https://example.com'),
('phone', 'contact', 'Phone', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>', '#4CAF50', '+1234567890'),
('email', 'contact', 'Email', '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>', '#EA4335', 'email@example.com')
ON CONFLICT (id) DO NOTHING;

-- 5. FINAL REPAIR: Ensure all shops have a valid service_id
-- If a shop has a service_id that doesn't exist in code_services, it defaults to 'website' 
-- so it at least appears in the UI.
UPDATE shops SET service_id = 'website' WHERE service_id NOT IN (SELECT id FROM code_services);

-- 6. Ensure get_identity_codes is using the correct JOIN
CREATE OR REPLACE FUNCTION get_identity_codes(p_identity_id TEXT, p_viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id BIGINT,
    service_id TEXT,
    service_name TEXT,
    service_icon TEXT,
    service_color TEXT,
    name TEXT,
    display_value TEXT,
    is_owner BOOLEAN,
    owner_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_owner_id UUID;
    v_owner_name TEXT;
BEGIN
    -- Get owner info
    SELECT user_id, full_name INTO v_owner_id, v_owner_name 
    FROM nexus_identities WHERE nexus_identities.id = p_identity_id;

    RETURN QUERY
    SELECT 
        s.id,
        s.service_id,
        COALESCE(cs.name, 'Unknown') AS service_name,
        COALESCE(cs.icon_svg, 'link') AS service_icon,
        COALESCE(cs.color, '#ffffff') AS service_color,
        s.name,
        s.value AS display_value,
        (p_viewer_id IS NOT NULL AND p_viewer_id = v_owner_id) AS is_owner,
        v_owner_name AS owner_name,
        s.created_at
    FROM shops s
    LEFT JOIN code_services cs ON s.service_id = cs.id
    WHERE s.identity_id = p_identity_id
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

NOTIFY pgrst, 'reload schema';
