-- ====================================================================
-- 0005: HERO SLIDESHOW (TABLE, STORAGE BUCKET, RLS & MIGRATION)
-- ====================================================================

-- 1. Create dedicated hero_slides table
CREATE TABLE IF NOT EXISTS public.hero_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    button_text TEXT NOT NULL DEFAULT 'Explore Collection',
    button_link TEXT NOT NULL DEFAULT '/shop',
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS set_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER set_hero_slides_updated_at
    BEFORE UPDATE ON public.hero_slides
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for ordering active slides
CREATE INDEX IF NOT EXISTS idx_hero_slides_active_sort ON public.hero_slides(is_active, sort_order);

-- 2. Row Level Security (RLS)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can view active slides; admins can view all
DROP POLICY IF EXISTS "Public can view active hero slides" ON public.hero_slides;
CREATE POLICY "Public can view active hero slides"
    ON public.hero_slides FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Only admins have full access (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Admins have full access to hero slides" ON public.hero_slides;
CREATE POLICY "Admins have full access to hero slides"
    ON public.hero_slides FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Storage Bucket: hero-images (public read, admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'hero-images',
    'hero-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage RLS Policies for hero-images
DROP POLICY IF EXISTS "Public can view hero images" ON storage.objects;
CREATE POLICY "Public can view hero images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'hero-images');

DROP POLICY IF EXISTS "Admins can upload hero images" ON storage.objects;
CREATE POLICY "Admins can upload hero images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'hero-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update hero images" ON storage.objects;
CREATE POLICY "Admins can update hero images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'hero-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete hero images" ON storage.objects;
CREATE POLICY "Admins can delete hero images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'hero-images' AND public.is_admin());

-- 4. Migrate existing slides from categories._site_hero_slides into hero_slides
DO $$
DECLARE
    dummy_desc TEXT;
    slide_rec JSONB;
    idx INT := 0;
BEGIN
    SELECT description INTO dummy_desc FROM public.categories WHERE slug = '_site_hero_slides';
    IF dummy_desc IS NOT NULL AND dummy_desc != '' THEN
        FOR slide_rec IN SELECT * FROM jsonb_array_elements(dummy_desc::jsonb)
        LOOP
            INSERT INTO public.hero_slides (
                image_url,
                title,
                subtitle,
                button_text,
                button_link,
                sort_order,
                is_active
            ) VALUES (
                slide_rec->>'image',
                slide_rec->>'title',
                COALESCE(slide_rec->>'subtitle', ''),
                COALESCE(slide_rec->>'ctaText', 'Explore Collection'),
                COALESCE(slide_rec->>'ctaLink', '/shop'),
                idx,
                true
            );
            idx := idx + 1;
        END LOOP;
    END IF;
END $$;

-- 5. Delete the legacy dummy category row
DELETE FROM public.categories WHERE slug = '_site_hero_slides';
