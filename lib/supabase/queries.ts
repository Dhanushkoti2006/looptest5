import { cache } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Product, Category } from '../types';
import { INITIAL_CATEGORIES } from '../seedData';

// Standalone public client for high-performance server component reads without cookie dependency
function getPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://okbgrlzknzautiotbcrm.supabase.co';
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    'sb_publishable_xtsI38nSJY499FXIaw2_6w_iN-sZxrB';

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getActiveCategories(): Promise<Category[]> {
  try {
    const supabase = getPublicClient();
    const { data, error } = await (supabase.from('categories') as any)
      .select('id, name, slug, description, image_url, display_order')
      .eq('is_active', true)
      .neq('slug', '_site_hero_slides')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return INITIAL_CATEGORIES;
    }

    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      imageUrl: c.image_url || '',
      displayOrder: c.display_order,
    }));
  } catch (err) {
    console.warn('Category query exception, using seed categories:', err);
    return INITIAL_CATEGORIES;
  }
}

export async function getActiveProducts(options?: {
  categorySlug?: string;
  categoryId?: string;
  isFeatured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  try {
    const supabase = getPublicClient();
    const limit = options?.limit || 36;

    // 1. Fetch active products
    let query = (supabase.from('products') as any)
      .select('*')
      .eq('is_active', true);

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    if (options?.isFeatured) {
      query = query.eq('is_featured', true);
    }

    const { data: prods, error: pErr } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (pErr || !prods || prods.length === 0) {
      if (options?.isFeatured) {
        return getActiveProducts({ limit: options.limit });
      }
      return [];
    }

    // 2. Fetch related images and categories in parallel
    const pIds = prods.map((p: any) => p.id);
    const [imagesRes, catsRes] = await Promise.all([
      (supabase.from('product_images') as any)
        .select('product_id, url, image_url, sort_order, display_order')
        .in('product_id', pIds)
        .order('display_order', { ascending: true }),
      (supabase.from('categories') as any)
        .select('id, name, slug'),
    ]);

    const imagesByProduct: Record<string, string[]> = {};
    for (const img of (imagesRes.data || [])) {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      let url = img.url || img.image_url;
      // Sanitize oversized base64 to avoid transferring megabytes in HTML SSR
      if (url && url.startsWith('data:') && url.length > 50000) {
        url = '/images/photo-coming-soon.svg';
      }
      if (url) imagesByProduct[img.product_id].push(url);
    }

    const catsById: Record<string, { id: string; name: string; slug: string }> = {};
    for (const cat of (catsRes.data || [])) {
      catsById[cat.id] = cat;
    }

    // Map each product
    let products: Product[] = prods.map((p: any) => {
      const productImages = imagesByProduct[p.id];
      const images = productImages && productImages.length > 0
        ? productImages
        : ['/images/photo-coming-soon.svg'];

      const catInfo = catsById[p.category_id];
      const categoryName = catInfo?.name || 'Handmade Crochet';
      const categorySlug = catInfo?.slug || 'all';

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
        category: categoryName,
        categoryId: categorySlug,
        images,
        materials: p.materials || '100% Premium Milk Cotton Yarn',
        dimensions: p.dimensions || 'Custom artisanal size',
        stock: p.stock ?? 0,
        sku: `SKU-${p.id.slice(0, 6)}`,
        prepTimeDays: p.prep_time_days || 2,
        careInstructions: p.care_instructions || 'Hand wash gently in cold water. Lay flat to dry.',
        tags: [categoryName, 'Handmade', 'Crochet'],
        status: p.stock <= 0 ? 'SOLD_OUT' : 'AVAILABLE',
        isFeatured: Boolean(p.is_featured),
        isBestseller: Boolean(p.is_featured || p.is_bestseller),
        isNewArrival: p.created_at
          ? Date.now() - new Date(p.created_at).getTime() <= 14 * 24 * 60 * 60 * 1000
          : false,
        isMadeToOrder: Boolean(p.is_made_to_order),
        variants: [
          {
            id: `var-${p.id}-1`,
            productId: p.id,
            colorName: 'Standard',
            colorHex: '#9D7BB0',
            sizeName: 'Standard',
            priceModifier: 0,
            stock: p.stock ?? 0,
            sku: `SKU-${p.id.slice(0, 6)}`,
          },
        ],
        highlights: p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0
          ? p.highlights
          : [
              '100% Hand-stitched with love by women artisans',
              'Ultra-soft, colorfast, hypoallergenic milk cotton yarn',
              'Gift-ready packaging with satin ribbon and note card',
            ],
        averageRating: p.average_rating ? Number(p.average_rating) : 0,
        reviewCount: p.review_count ? Number(p.review_count) : 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    if (options?.categorySlug && options.categorySlug !== 'all') {
      products = products.filter(
        (p) =>
          p.categoryId === options.categorySlug ||
          p.category.toLowerCase().replace(/[^a-z0-9]/g, '-') === options.categorySlug
      );
    }

    return products;
  } catch (err) {
    console.error('Products query exception:', err);
    return [];
  }
}

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  try {
    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();
    const supabase = getPublicClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanSlug);

    let query = (supabase.from('products') as any)
      .select('*')
      .eq('is_active', true);

    if (isUuid) {
      query = query.or(`slug.eq.${cleanSlug},id.eq.${cleanSlug}`);
    } else {
      query = query.eq('slug', cleanSlug);
    }

    let { data: p, error } = await query.maybeSingle();

    // Fallback: in case product is accessed by case-insensitive slug or without is_active filter
    if (!p) {
      const fallbackQuery = (supabase.from('products') as any).select('*');
      const { data: fallbackProduct } = isUuid
        ? await fallbackQuery.eq('id', cleanSlug).maybeSingle()
        : await fallbackQuery.ilike('slug', cleanSlug).maybeSingle();

      if (!fallbackProduct) {
        return null;
      }
      p = fallbackProduct;
    }

    if (!p) {
      return null;
    }

    // Fetch images and category in parallel
    const [imagesRes, catRes] = await Promise.all([
      (supabase.from('product_images') as any)
        .select('url, image_url, sort_order, display_order')
        .eq('product_id', p.id)
        .order('display_order', { ascending: true }),
      p.category_id
        ? (supabase.from('categories') as any).select('id, name, slug').eq('id', p.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const sortedImages = (imagesRes.data || [])
      .map((img: any) => img.url || img.image_url)
      .filter(Boolean);

    const images = sortedImages.length > 0 ? sortedImages : ['/images/photo-coming-soon.svg'];
    const categoryName = catRes.data?.name || 'Handmade Crochet';
    const categorySlug = catRes.data?.slug || 'all';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
      category: categoryName,
      categoryId: categorySlug,
      images,
      materials: p.materials || '100% Premium Milk Cotton Yarn',
      dimensions: p.dimensions || 'Custom artisanal size',
      stock: p.stock ?? 0,
      sku: `SKU-${p.id.slice(0, 6)}`,
      prepTimeDays: p.prep_time_days || 2,
      careInstructions: p.care_instructions || 'Hand wash gently in cold water. Lay flat to dry.',
      tags: [categoryName, 'Handmade', 'Crochet'],
      status: p.stock <= 0 ? 'SOLD_OUT' : 'AVAILABLE',
      isFeatured: Boolean(p.is_featured),
      isBestseller: Boolean(p.is_featured || p.is_bestseller),
      isNewArrival: p.created_at
        ? Date.now() - new Date(p.created_at).getTime() <= 14 * 24 * 60 * 60 * 1000
        : false,
      isMadeToOrder: Boolean(p.is_made_to_order),
      variants: [
        {
          id: `var-${p.id}-1`,
          productId: p.id,
          colorName: 'Standard',
          colorHex: '#9D7BB0',
          sizeName: 'Standard',
          priceModifier: 0,
          stock: p.stock ?? 0,
          sku: `SKU-${p.id.slice(0, 6)}`,
        },
      ],
      highlights: p.highlights && Array.isArray(p.highlights) && p.highlights.length > 0
        ? p.highlights
        : [
            '100% Hand-stitched with love by women artisans',
            'Ultra-soft, colorfast, hypoallergenic milk cotton yarn',
            'Gift-ready packaging with satin ribbon and note card',
          ],
      averageRating: p.average_rating ? Number(p.average_rating) : 0,
      reviewCount: p.review_count ? Number(p.review_count) : 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  } catch (err) {
    console.error('Product query exception:', err);
    return null;
  }
});

let heroSlidesCache: { slides: any[] } | null = null;

export function invalidateHeroSlidesCache() {
  heroSlidesCache = null;
}

export async function getHeroSlidesFromDB(): Promise<{ slides: any[] }> {
  if (heroSlidesCache) return heroSlidesCache;

  try {
    const supabase = getPublicClient();
    const { data, error } = await (supabase as any)
      .from('hero_slides')
      .select('id, image_url, title, subtitle, button_text, button_link, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Failed to query hero_slides from Supabase:', error.message);
      return { slides: [] };
    }

    if (data && Array.isArray(data)) {
      const slides = data.map((s: any) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle || '',
        badge: '✨ Artisanal Crochet Collection',
        ctaText: s.button_text || 'Explore Collection',
        ctaLink: s.button_link || '/shop',
        image: s.image_url,
        accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
      }));

      heroSlidesCache = { slides };
      return heroSlidesCache;
    }
  } catch (err: any) {
    console.error('Exception fetching hero slides from Supabase:', err);
  }

  // Never fall back to stock Unsplash images. Return empty array so neutral branded banner renders.
  heroSlidesCache = { slides: [] };
  return heroSlidesCache;
}
