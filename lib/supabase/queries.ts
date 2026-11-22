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
      .select('*')
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
  isFeatured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  try {
    const supabase = getPublicClient();

    // 1. Fetch active products
    let query = (supabase.from('products') as any)
      .select('*')
      .eq('is_active', true);

    if (options?.isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data: prods, error: pErr } = await query.order('created_at', { ascending: false });

    if (pErr || !prods || prods.length === 0) {
      // If featured filter returned 0, retry without featured filter as fallback so storefront is never empty
      if (options?.isFeatured) {
        return getActiveProducts({ limit: options.limit });
      }
      return [];
    }

    // 2. Fetch related images and categories in parallel for speed
    const pIds = prods.map((p: any) => p.id);
    const [imagesRes, catsRes] = await Promise.all([
      (supabase.from('product_images') as any)
        .select('product_id, url, image_url, sort_order, display_order')
        .in('product_id', pIds),
      (supabase.from('categories') as any)
        .select('id, name, slug'),
    ]);

    const imagesByProduct: Record<string, string[]> = {};
    for (const img of (imagesRes.data || [])) {
      if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
      const url = img.url || img.image_url;
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
        : ['/images/loop-and-love-logo.jpg'];

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
        isBestseller: Boolean(p.is_featured),
        isNewArrival: true,
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
        averageRating: 5.0,
        reviewCount: 1,
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
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

    const images = sortedImages.length > 0 ? sortedImages : ['/images/loop-and-love-logo.jpg'];
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
      isBestseller: Boolean(p.is_featured),
      isNewArrival: true,
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
      averageRating: 5.0,
      reviewCount: 1,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  } catch (err) {
    console.error('Product query exception:', err);
    return null;
  }
}

export const DEFAULT_HERO_SLIDES = [
  {
    id: 'slide-1',
    title: 'Handmade with Love, Crafted to Last.',
    subtitle: 'Everlasting flower bouquets, charming keychains, and bespoke amigurumi keepsakes stitched with utmost tenderness.',
    badge: '✨ Artisanal Crochet Collection 2026',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    id: 'slide-2',
    title: 'Bring Your Dream Crochet Idea to Life',
    subtitle: 'Custom bridal bouquets, anniversary gifts, or your favorite plush toy character crafted exactly to your vision.',
    badge: '🌸 Bespoke Custom Order Studio',
    ctaText: 'Design Custom Order',
    ctaLink: '/custom-orders',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    id: 'slide-3',
    title: 'Sweet Companions & Soft Amigurumi Toys',
    subtitle: 'Gentle, hypoallergenic milk cotton toys stitched for pure cuddles and nursery warmth.',
    badge: '🧸 Baby Safe & Handcrafted',
    ctaText: 'Shop Toys',
    ctaLink: '/shop/toys',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
];

let heroSlidesCache: any = null;

export async function getHeroSlidesFromDB(): Promise<{ slides: any[] }> {
  if (heroSlidesCache) return heroSlidesCache;

  try {
    const supabase = getPublicClient();
    const { data, error } = await (supabase.from('categories') as any)
      .select('description')
      .eq('slug', '_site_hero_slides')
      .maybeSingle();

    if (!error && data?.description) {
      const parsed = JSON.parse(data.description);
      if (Array.isArray(parsed) && parsed.length > 0) {
        heroSlidesCache = { slides: parsed };
        return heroSlidesCache;
      } else if (parsed?.slides && Array.isArray(parsed.slides)) {
        heroSlidesCache = parsed;
        return heroSlidesCache;
      }
    }
  } catch (err) {
    console.warn('Could not read hero slides from Supabase:', err);
  }

  heroSlidesCache = { slides: DEFAULT_HERO_SLIDES };
  return heroSlidesCache;
}
