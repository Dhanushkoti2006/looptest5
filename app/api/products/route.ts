import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

    // Query active products with their images and categories
    let query = (supabase.from('products') as any)
      .select(`
        *,
        product_images (image_url, display_order),
        categories (id, name, slug)
      `)
      .eq('is_active', true);

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data: dbProducts, error } = await query.order('created_at', { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      let mapped = dbProducts.map((p: any) => {
        const sortedImages = (p.product_images || [])
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .map((img: any) => img.image_url)
          .filter(Boolean);

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: Number(p.price),
          discountPrice: undefined,
          category: p.categories?.name || 'Handmade Crochet',
          categoryId: p.categories?.slug || p.category_id || 'all',
          images: sortedImages.length > 0 ? sortedImages : ['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80'],
          materials: p.materials || '100% Milk Cotton Yarn',
          dimensions: p.dimensions || '',
          stock: p.stock ?? 10,
          sku: `LOOP-${p.slug}`,
          prepTimeDays: p.prep_time_days || 2,
          careInstructions: p.care_instructions || 'Hand wash gently in cold water with mild detergent. Lay flat to dry.',
          tags: ['handmade', 'crochet', p.categories?.slug || 'artisan'],
          status: p.stock > 0 ? 'AVAILABLE' : 'SOLD_OUT',
          isFeatured: Boolean(p.is_featured),
          isBestseller: false,
          isNewArrival: true,
          variants: [],
          averageRating: 5.0,
          reviewCount: 0,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });

      // Filter by category slug if provided
      if (category && category !== 'all') {
        mapped = mapped.filter((p: any) => p.categoryId === category);
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

      // Sort
      if (sort === 'price-low') {
        mapped.sort((a: any, b: any) => a.price - b.price);
      } else if (sort === 'price-high') {
        mapped.sort((a: any, b: any) => b.price - a.price);
      }

      return NextResponse.json({ success: true, products: mapped }, { headers: noCacheHeaders });
    }

    // No products found or error occurred - return empty array (no mock data fallback)
    return NextResponse.json({ success: true, products: [] }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: true, products: [] }, { headers: noCacheHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.name || !body.price) {
      return NextResponse.json(
        { success: false, message: 'Product name and price are required.' },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const slug = (body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + `-${Date.now().toString().slice(-4)}`;
    const description = body.description?.trim() || `${name} - Handcrafted with love from premium milk cotton yarn.`;
    const price = Number(body.price);
    const stock = Number(body.stock) || 0;
    const isFeatured = Boolean(body.isFeatured);
    const materials = body.materials || '100% Milk Cotton Yarn';
    const dimensions = body.dimensions || '';
    const prepTimeDays = Number(body.prepTimeDays) || 2;
    const careInstructions = body.careInstructions || 'Hand wash gently in cold water. Lay flat to dry.';
    const imageUrls: string[] = Array.isArray(body.images) ? body.images : body.image ? [body.image] : [];

    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // 1. Resolve category ID
    let categoryId: string | null = null;
    if (body.category || body.categoryId) {
      const catSearch = body.categoryId || body.category;
      let { data: catData } = await (adminSupabase.from('categories') as any)
        .select('id')
        .or(`slug.eq.${catSearch},name.ilike.%${catSearch}%`)
        .limit(1)
        .maybeSingle();

      if (!catData && user) {
        const { data: userCat } = await (serverSupabase.from('categories') as any)
          .select('id')
          .or(`slug.eq.${catSearch},name.ilike.%${catSearch}%`)
          .limit(1)
          .maybeSingle();
        catData = userCat;
      }

      if (catData) {
        categoryId = catData.id;
      }
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

    // If adminSupabase encountered a permission error and user has active session, retry with session client
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
      const friendlyMsg =
        prodError?.code === '42501'
          ? 'Database permission denied for table "products". Please run the updated supabase_schema.sql in Supabase SQL Editor (which includes the GRANT permissions) and configure SUPABASE_SERVICE_ROLE_KEY in .env.local.'
          : prodError?.message || 'Failed to insert product';
      return NextResponse.json({ success: false, message: friendlyMsg }, { status: 500 });
    }

    // 3. Insert images into product_images table
    if (imageUrls.length > 0) {
      const imageRecords = imageUrls.map((url, idx) => ({
        product_id: newProd.id,
        image_url: url,
        alt_text: `${name} photo ${idx + 1}`,
        display_order: idx,
      }));

      const imgInsertRes = await (adminSupabase.from('product_images') as any).insert(imageRecords);
      if (imgInsertRes.error && imgInsertRes.error.code === '42501' && user) {
        await (serverSupabase.from('product_images') as any).insert(imageRecords);
      }
    }

    // 4. Instant revalidation of storefront pages
    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath(`/product/${slug}`);

    return NextResponse.json({
      success: true,
      product: {
        id: newProd.id,
        name: newProd.name,
        slug: newProd.slug,
        price: newProd.price,
        stock: newProd.stock,
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

    if (updateError || !updated) {
      const friendlyMsg =
        updateError?.code === '42501'
          ? 'Database permission denied for updating products. Please execute the updated supabase_schema.sql in Supabase SQL Editor.'
          : updateError?.message || 'Failed to update product';
      return NextResponse.json({ success: false, message: friendlyMsg }, { status: 500 });
    }

    // If new images provided, sync product_images
    if (Array.isArray(body.images) && body.images.length > 0) {
      await (adminSupabase.from('product_images') as any).delete().eq('product_id', body.id);
      const imageRecords = body.images.map((url: string, idx: number) => ({
        product_id: body.id,
        image_url: url,
        alt_text: `${updated.name} photo ${idx + 1}`,
        display_order: idx,
      }));
      await (adminSupabase.from('product_images') as any).insert(imageRecords);
    }

    revalidatePath('/');
    revalidatePath('/shop');
    revalidatePath(`/product/${updated.slug}`);

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Product update exception:', error);
    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Product ID is required.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const serverSupabase = await createClient();
    const { data: { user } } = await serverSupabase.auth.getUser();

    // Soft delete: set is_active = false and deleted_at
    const deletePayload = {
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { data: softDeleted, error } = await (adminSupabase.from('products') as any)
      .update(deletePayload)
      .eq('id', id)
      .select('slug')
      .single();

    if (error && error.code === '42501' && user) {
      const retryRes = await (serverSupabase.from('products') as any)
        .update(deletePayload)
        .eq('id', id)
        .select('slug')
        .single();
      if (!retryRes.error) {
        softDeleted = retryRes.data;
        error = null;
      }
    }

    if (error) {
      const friendlyMsg =
        error.code === '42501'
          ? 'Database permission denied for deleting products. Please execute the updated supabase_schema.sql in Supabase SQL Editor.'
          : error.message || 'Failed to delete product.';
      return NextResponse.json({ success: false, message: friendlyMsg }, { status: 500 });
    }

    revalidatePath('/');
    revalidatePath('/shop');
    if (softDeleted?.slug) {
      revalidatePath(`/product/${softDeleted.slug}`);
    }

    return NextResponse.json({ success: true, message: 'Product soft-deleted successfully.' });
  } catch (error) {
    console.error('Delete product exception:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete product.' }, { status: 500 });
  }
}
