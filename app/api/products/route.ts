import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_PRODUCTS } from '@/lib/seedData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');

    const supabase = await createClient();

    // 1. Fetch products without slow PostgREST nested joins for maximum speed (<50ms)
    let query = (supabase.from('products') as any)
      .select('*')
      .eq('is_active', true);

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: dbProducts, error } = await query.order('created_at', { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      const pIds = dbProducts.map((p: any) => p.id);

      // 2. Fetch images and categories in parallel
      const [imagesRes, catsRes] = await Promise.all([
        (supabase.from('product_images') as any)
          .select('product_id, url, image_url, display_order, sort_order')
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

      let mapped = dbProducts.map((p: any) => {
        const sortedImages = imagesByProduct[p.id] || [];
        const catInfo = catsById[p.category_id];

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          discountPrice: undefined,
          category: catInfo?.name || 'Handmade Crochet',
          categoryId: catInfo?.slug || p.category_id || 'all',
          images: sortedImages.length > 0 ? sortedImages : ['/images/photo-coming-soon.svg'],
          materials: p.materials || '100% Milk Cotton Yarn',
          dimensions: p.dimensions || '',
          stock: p.stock ?? 10,
          sku: `LOOP-${p.slug}`,
          prepTimeDays: p.prep_time_days || 2,
          careInstructions: p.care_instructions || 'Hand wash gently in cold water with mild detergent. Lay flat to dry.',
          tags: ['handmade', 'crochet', catInfo?.slug || 'artisan'],
          status: p.stock > 0 ? 'AVAILABLE' : 'SOLD_OUT',
          isFeatured: Boolean(p.is_featured),
          isBestseller: Boolean(p.is_featured || p.is_bestseller),
          isNewArrival: p.created_at
            ? Date.now() - new Date(p.created_at).getTime() <= 14 * 24 * 60 * 60 * 1000
            : false,
          variants: [],
          averageRating: p.average_rating ? Number(p.average_rating) : 0,
          reviewCount: p.review_count ? Number(p.review_count) : 0,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });

      // Filter by category slug if provided
      if (category && category !== 'all') {
        const catTarget = category.toLowerCase().trim();
        mapped = mapped.filter((p: any) => {
          const cId = (p.categoryId || '').toLowerCase();
          const cName = (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return cId === catTarget || cName === catTarget || cName.includes(catTarget) || catTarget.includes(cName);
        });
      }

      // Filter by search term
      if (search && search.trim().length > 0) {
        const q = search.toLowerCase();
        mapped = mapped.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }

      // Filter by price range
      if (minPrice) {
        mapped = mapped.filter((p: any) => p.price >= Number(minPrice));
      }
      if (maxPrice) {
        mapped = mapped.filter((p: any) => p.price <= Number(maxPrice));
      }

      // Filter by stock status
      if (status === 'AVAILABLE') {
        mapped = mapped.filter((p: any) => p.stock > 0);
      } else if (status === 'SOLD_OUT') {
        mapped = mapped.filter((p: any) => p.stock <= 0);
      }

      // Sort
      if (sort === 'price-low') {
        mapped.sort((a: any, b: any) => a.price - b.price);
      } else if (sort === 'price-high') {
        mapped.sort((a: any, b: any) => b.price - a.price);
      } else if (sort === 'oldest') {
        mapped.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else {
        // Default: newest first
        mapped.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      return NextResponse.json({ success: true, products: mapped, total: mapped.length }, { headers: noCacheHeaders });
    }

    // Fallback to static seed data if database is empty
    return NextResponse.json(
      { success: true, products: INITIAL_PRODUCTS, total: INITIAL_PRODUCTS.length },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: true, products: INITIAL_PRODUCTS, total: INITIAL_PRODUCTS.length },
      { headers: noCacheHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();

    const name = body.name?.trim();
    const slug = body.slug?.trim() || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const description = body.description?.trim() || '';
    const price = Number(body.price);
    const stock = Number(body.stock ?? 10);
    const isFeatured = Boolean(body.isFeatured);
    const materials = body.materials || '100% Milk Cotton Yarn';
    const dimensions = body.dimensions || '';
    const prepTimeDays = Number(body.prepTimeDays || 2);
    const careInstructions = body.careInstructions || 'Hand wash gently in cold water. Lay flat to dry.';
    const imageUrls = Array.isArray(body.images) ? body.images.filter(Boolean) : [];

    if (!name || isNaN(price)) {
      return NextResponse.json({ success: false, message: 'Title and valid price are required.' }, { status: 400 });
    }

    if (imageUrls.length === 0) {
      return NextResponse.json({ success: false, message: 'At least one product photo is required to publish a product.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // 1. Resolve category ID
    let categoryId: string | null = null;
    const catSearch = (body.categoryId || body.category || '').trim();

    if (catSearch) {
      let { data: catData } = await (adminSupabase.from('categories') as any)
        .select('id')
        .or(`id.eq.${catSearch},slug.eq.${catSearch},name.ilike.%${catSearch}%`)
        .limit(1)
        .maybeSingle();

      if (!catData && user) {
        const { data: userCat } = await (serverSupabase.from('categories') as any)
          .select('id')
          .or(`id.eq.${catSearch},slug.eq.${catSearch},name.ilike.%${catSearch}%`)
          .limit(1)
          .maybeSingle();
        catData = userCat;
      }

      if (catData) {
        categoryId = catData.id;
      }
    }

    // If category not found, default to first available category
    if (!categoryId) {
      const { data: fallbackCat } = await (adminSupabase.from('categories') as any)
        .select('id')
        .eq('is_active', true)
        .neq('slug', '_site_hero_slides')
        .order('display_order', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (fallbackCat) categoryId = fallbackCat.id;
    }

    // 2. Insert into products table
    const productPayload = {
      name,
      slug,
      description,
      price,
      stock,
      category_id: categoryId,
      is_active: true,
      is_featured: isFeatured,
      materials,
      dimensions,
      prep_time_days: prepTimeDays,
      care_instructions: careInstructions,
    };

    let { data: newProd, error: prodError } = await (adminSupabase.from('products') as any)
      .insert(productPayload)
      .select()
      .single();

    if (prodError && prodError.code === '42501' && user) {
      const retryRes = await (serverSupabase.from('products') as any)
        .insert(productPayload)
        .select()
        .single();
      if (!retryRes.error) {
        newProd = retryRes.data;
        prodError = null;
      }
    }

    if (prodError || !newProd) {
      console.error('Product insertion error:', prodError);
      return NextResponse.json({ success: false, message: prodError?.message || 'Failed to insert product' }, { status: 500 });
    }

    // 3. Insert images into product_images table
    if (imageUrls.length > 0) {
      const imageRecords = imageUrls.map((url: string, idx: number) => ({
        product_id: newProd.id,
        image_url: url,
        url: url,
        alt_text: `${name} photo ${idx + 1}`,
        display_order: idx,
        sort_order: idx,
      }));

      const imgInsertRes = await (adminSupabase.from('product_images') as any).insert(imageRecords);
      if (imgInsertRes.error && imgInsertRes.error.code === '42501' && user) {
        await (serverSupabase.from('product_images') as any).insert(imageRecords);
      }
    }

    // 4. Instant revalidation of storefront pages
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/product/${slug}`);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      product: {
        id: newProd.id,
        name: newProd.name,
        slug: newProd.slug,
        price: newProd.price,
        stock: newProd.stock,
        categoryId,
        images: imageUrls,
      },
    });
  } catch (error) {
    console.error('Product creation exception:', error);
    return NextResponse.json({ success: false, message: 'Server error creating product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Product ID is required for updating.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name) updateFields.name = body.name.trim();
    if (body.description) updateFields.description = body.description.trim();
    if (body.price !== undefined) updateFields.price = Number(body.price);
    if (body.stock !== undefined) updateFields.stock = Number(body.stock);
    if (body.isFeatured !== undefined) updateFields.is_featured = Boolean(body.isFeatured);
    if (body.materials !== undefined) updateFields.materials = body.materials;
    if (body.dimensions !== undefined) updateFields.dimensions = body.dimensions;

    // Resolve category if updated
    if (body.categoryId || body.category) {
      const catSearch = (body.categoryId || body.category || '').trim();
      const { data: catData } = await (adminSupabase.from('categories') as any)
        .select('id')
        .or(`id.eq.${catSearch},slug.eq.${catSearch},name.ilike.%${catSearch}%`)
        .limit(1)
        .maybeSingle();

      if (catData) {
        updateFields.category_id = catData.id;
      }
    }

    let { data: updated, error: updateError } = await (adminSupabase.from('products') as any)
      .update(updateFields)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError && updateError.code === '42501' && user) {
      const retryRes = await (serverSupabase.from('products') as any)
        .update(updateFields)
        .eq('id', body.id)
        .select()
        .single();
      if (!retryRes.error) {
        updated = retryRes.data;
        updateError = null;
      }
    }

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 });
    }

    // Update images if provided
    if (Array.isArray(body.images)) {
      if (body.images.length === 0) {
        return NextResponse.json({ success: false, message: 'At least one product photo is required.' }, { status: 400 });
      }
      await (adminSupabase.from('product_images') as any).delete().eq('product_id', body.id);
      const imageRecords = body.images.filter(Boolean).map((url: string, idx: number) => ({
        product_id: body.id,
        image_url: url,
        url: url,
        alt_text: `${body.name || 'Product'} photo ${idx + 1}`,
        display_order: idx,
        sort_order: idx,
      }));
      await (adminSupabase.from('product_images') as any).insert(imageRecords);
    }

    try {
      revalidatePath('/');
      revalidatePath('/shop');
      if (updated?.slug) revalidatePath(`/product/${updated.slug}`);
    } catch (_) {}

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Product update exception:', error);
    return NextResponse.json({ success: false, message: 'Server error updating product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    await (adminSupabase.from('products') as any).update({ is_active: false }).eq('id', id);

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ success: false, message: 'Server error deleting product' }, { status: 500 });
  }
}
