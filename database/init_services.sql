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
('professional', 'Professional', '💼', 4),
('media', 'Media & Music', '🎵', 5),
('other', 'Other', '✨', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon, sort_order = EXCLUDED.sort_order;

-- 4. Populate Default Services
INSERT INTO code_services (id, category_id, name, icon_svg, color, placeholder) VALUES
-- Contact
('whatsapp', 'contact', 'WhatsApp', 'fab fa-whatsapp', '#25D366', 'wa.me/number'),
('telegram', 'contact', 'Telegram', 'fab fa-telegram', '#0088cc', 't.me/username'),
('phone', 'contact', 'Phone', 'fas fa-phone', '#4CAF50', '+1234567890'),
('email', 'contact', 'Email', 'fas fa-envelope', '#EA4335', 'email@example.com'),
('signal', 'contact', 'Signal', 'fas fa-comment', '#3a76f0', 'Signal Number'),
('viber', 'contact', 'Viber', 'fab fa-viber', '#7360f2', 'Viber Number'),
('line', 'contact', 'Line', 'fab fa-line', '#00c300', 'Line ID'),

-- Social
('facebook', 'social', 'Facebook', 'fab fa-facebook', '#1877F2', 'fb.com/username'),
('instagram', 'social', 'Instagram', 'fab fa-instagram', '#E4405F', 'instagr.am/username'),
('snapchat', 'social', 'Snapchat', 'fab fa-snapchat', '#FFFC00', 'snapchat.com/add/user'),
('tiktok', 'social', 'TikTok', 'fab fa-tiktok', '#000000', 'tiktok.com/@user'),
('twitter', 'social', 'X / Twitter', 'fab fa-x-twitter', '#000000', 'x.com/username'),
('threads', 'social', 'Threads', 'fab fa-threads', '#000000', 'threads.net/@user'),
('discord', 'social', 'Discord', 'fab fa-discord', '#5865F2', 'discord.gg/invite'),
('reddit', 'social', 'Reddit', 'fab fa-reddit', '#FF4500', 'reddit.com/u/user'),
('pinterest', 'social', 'Pinterest', 'fab fa-pinterest', '#BD081C', 'pinterest.com/user'),
('twitch', 'social', 'Twitch', 'fab fa-twitch', '#9146FF', 'twitch.tv/user'),

-- Professional
('linkedin', 'professional', 'LinkedIn', 'fab fa-linkedin', '#0A66C2', 'linkedin.com/in/user'),
('github', 'professional', 'GitHub', 'fab fa-github', '#181717', 'github.com/user'),
('behance', 'professional', 'Behance', 'fab fa-behance', '#1769ff', 'behance.net/user'),
('dribbble', 'professional', 'Dribbble', 'fab fa-dribbble', '#ea4c89', 'dribbble.com/user'),
('cv', 'professional', 'CV / Resume', 'fas fa-file-pdf', '#FF5722', 'Link to PDF'),
('portfolio', 'professional', 'Portfolio', 'fas fa-briefcase', '#444444', 'yourwebsite.com'),

-- Media
('youtube', 'media', 'YouTube', 'fab fa-youtube', '#FF0000', 'youtube.com/@channel'),
('spotify', 'media', 'Spotify', 'fab fa-spotify', '#1DB954', 'open.spotify.com/user'),
('soundcloud', 'media', 'SoundCloud', 'fab fa-soundcloud', '#FF3300', 'soundcloud.com/user'),
('medium', 'media', 'Medium', 'fab fa-medium', '#000000', 'medium.com/@user'),

-- Payments
('paypal', 'payment', 'PayPal', 'fab fa-paypal', '#003087', 'paypal.me/user'),
('patreon', 'payment', 'Patreon', 'fab fa-patreon', '#FF424D', 'patreon.com/user'),
('buy-me-coffee', 'payment', 'Coffee', 'fas fa-coffee', '#FFDD00', 'buymeacoffee.com/user'),

-- Other
('website', 'other', 'Website', 'fas fa-globe', '#7C4DFF', 'https://example.com'),
('other', 'other', 'Other', 'fas fa-star', '#f0ff42', 'Any Link')
ON CONFLICT (id) DO UPDATE SET 
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    icon_svg = EXCLUDED.icon_svg,
    color = EXCLUDED.color,
    placeholder = EXCLUDED.placeholder;

-- 5. FINAL REPAIR: Ensure all shops have a valid service_id
-- If a shop has a service_id that doesn't exist in code_services, it defaults to 'website' 
-- so it at least appears in the UI.
UPDATE shops SET service_id = 'website' WHERE service_id NOT IN (SELECT id FROM code_services);

-- 6. Ensure get_identity_codes is using the correct JOIN
DROP FUNCTION IF EXISTS get_identity_codes(TEXT, UUID) CASCADE;
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
