import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { INITIAL_CATEGORIES } from '@/lib/seedData';

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
    const includeAll = searchParams.get('all') === 'true';

    const supabase = await createClient();

    let query = (supabase.from('categories') as any)
      .select('*')
      .neq('slug', '_site_hero_slides')
      .order('display_order', { ascending: true });

    if (!includeAll) {
      query = query.eq('is_active', true);
    }

    const { data: dbCategories, error } = await query;

    if (!error && dbCategories && dbCategories.length > 0) {
      // Calculate dynamic product counts
      const { data: prods } = await (supabase.from('products') as any)
        .select('category_id')
        .eq('is_active', true);

      const countByCat: Record<string, number> = {};
      for (const p of (prods || [])) {
        if (p.category_id) {
          countByCat[p.category_id] = (countByCat[p.category_id] || 0) + 1;
        }
      }

      const categories = dbCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        imageUrl: c.image_url || '',
        image_url: c.image_url || '',
        displayOrder: c.display_order ?? 0,
        display_order: c.display_order ?? 0,
        isActive: Boolean(c.is_active),
        is_active: Boolean(c.is_active),
        productCount: countByCat[c.id] || 0,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));

      return NextResponse.json({ success: true, categories }, { headers: noCacheHeaders });
    }

    // Fallback to INITIAL_CATEGORIES
    return NextResponse.json({ success: true, categories: INITIAL_CATEGORIES }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: true, categories: INITIAL_CATEGORIES }, { headers: noCacheHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const name = body.name.trim();
    const slug = body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const description = body.description || '';
    const imageUrl = body.imageUrl || body.image_url || '';
    const displayOrder = Number(body.displayOrder ?? body.display_order ?? 0);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;

    const adminSupabase = createAdminClient();

    const catPayload = {
      name,
      slug,
      description,
      image_url: imageUrl,
      display_order: displayOrder,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    const { data: newCat, error } = await (adminSupabase.from('categories') as any)
      .upsert(catPayload, { onConflict: 'slug' })
      .select()
      .single();

    if (error) {
      console.error('Category insert error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Revalidate storefront pages
    try {
      revalidatePath('/');
      revalidatePath('/shop');
      revalidatePath(`/shop/${slug}`);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      category: {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        description: newCat.description,
        imageUrl: newCat.image_url,
        displayOrder: newCat.display_order,
        isActive: newCat.is_active,
      },
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const id = body.id;
    const slug = body.slug;

    if (!id && !slug) {
      return NextResponse.json({ success: false, message: 'Category ID or slug is required.' }, { status: 400 });
    }

    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.slug !== undefined) updateFields.slug = body.slug.trim();
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.imageUrl !== undefined || body.image_url !== undefined) {
      updateFields.image_url = body.imageUrl || body.image_url;
    }
    if (body.displayOrder !== undefined || body.display_order !== undefined) {
      updateFields.display_order = Number(body.displayOrder ?? body.display_order);
    }
    if (body.isActive !== undefined || body.is_active !== undefined) {
      updateFields.is_active = Boolean(body.isActive ?? body.is_active);
    }

    const adminSupabase = createAdminClient();
    let query = (adminSupabase.from('categories') as any).update(updateFields);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: updated, error } = await query.select().single();

    if (error) {
      console.error('Category update error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/shop');
      if (updated?.slug) revalidatePath(`/shop/${updated.slug}`);
    } catch (_) {}

    return NextResponse.json({
      success: true,
      category: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        imageUrl: updated.image_url,
        displayOrder: updated.display_order,
        isActive: updated.is_active,
      },
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to update category' }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const { error } = await (adminSupabase.from('categories') as any)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Category delete error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
