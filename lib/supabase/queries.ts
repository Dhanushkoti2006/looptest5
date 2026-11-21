import { createClient } from './server';
import { Product, Category } from '@/lib/types';

export async function getActiveCategories(): Promise<Category[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase.from('categories') as any)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data) {
      console.error('Error fetching categories from Supabase:', error);
      return [];
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
    console.error('Category query exception:', err);
    return [];
  }
}

export async function getActiveProducts(options?: {
  categorySlug?: string;
  isFeatured?: boolean;
  limit?: number;
}): Promise<Product[]> {
  try {
    const supabase = await createClient();

    let query = (supabase.from('products') as any)
      .select(`
        *,
        product_images (url, image_url, sort_order, display_order),
        categories (id, name, slug)
      `)
      .eq('is_active', true);

    if (options?.isFeatured) {
      query = query.eq('is_featured', true);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching products from Supabase:', error);
      return [];
    }

    let products: Product[] = data.map((p: any) => {
      const sortedImages = (p.product_images || [])
        .sort((a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0))
        .map((img: any) => img.url || img.image_url)
        .filter(Boolean);

      const images = sortedImages.length > 0 ? sortedImages : ['/images/loop-and-love-logo.jpg'];
      const categoryName = p.categories?.name || 'Handmade Crochet';
      const categorySlug = p.categories?.slug || 'all';

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
    const supabase = await createClient();

    const { data: p, error } = await (supabase.from('products') as any)
      .select(`
        *,
        product_images (url, image_url, sort_order, display_order),
        categories (id, name, slug)
      `)
      .eq('is_active', true)
      .or(`slug.eq.${cleanSlug},id.eq.${cleanSlug}`)
      .maybeSingle();

    if (error || !p) {
      return null;
    }

    const sortedImages = (p.product_images || [])
      .sort((a: any, b: any) => (a.sort_order ?? a.display_order ?? 0) - (b.sort_order ?? b.display_order ?? 0))
      .map((img: any) => img.url || img.image_url)
      .filter(Boolean);

    const images = sortedImages.length > 0 ? sortedImages : ['/images/loop-and-love-logo.jpg'];
    const categoryName = p.categories?.name || 'Handmade Crochet';
    const categorySlug = p.categories?.slug || 'all';

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
