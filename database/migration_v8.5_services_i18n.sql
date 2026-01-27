-- ============================================
-- QRme V8.5 - SERVICE LOCALIZATION UPDATE
-- ============================================

-- 1. Add columns to code_services
ALTER TABLE code_services ADD COLUMN IF NOT EXISTS name_ar TEXT;
ALTER TABLE code_services ADD COLUMN IF NOT EXISTS name_en TEXT;

-- 2. Populate columns based on existing name
UPDATE code_services SET 
    name_ar = CASE 
        WHEN id = 'facebook' THEN 'فيسبوك'
        WHEN id = 'instagram' THEN 'انستجرام'
        WHEN id = 'whatsapp' THEN 'واتساب'
        WHEN id = 'telegram' THEN 'تيليجرام'
        WHEN id = 'twitter' THEN 'إكس (تويتر)'
        WHEN id = 'tiktok' THEN 'تيك توك'
        WHEN id = 'youtube' THEN 'يوتيوب'
        WHEN id = 'linkedin' THEN 'لينكد إن'
        WHEN id = 'website' THEN 'موقع إلكتروني'
        WHEN id = 'phone' THEN 'هاتف'
        WHEN id = 'email' THEN 'بريد إلكتروني'
        WHEN id = 'snapchat' THEN 'سناب شات'
        ELSE name
    END,
    name_en = name;

-- 3. Update existing names if needed
UPDATE code_services SET name_en = 'X (Twitter)' WHERE id = 'twitter';

-- 4. Notify schema reload
NOTIFY pgrst, 'reload schema';
