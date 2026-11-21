import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: dbCategories, error } = await (supabase.from('categories') as any)
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && dbCategories && dbCategories.length > 0) {
      const categories = dbCategories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description || '',
        imageUrl: c.image_url || '',
        displayOrder: c.display_order,
      }));
      return NextResponse.json({ success: true, categories }, { headers: noCacheHeaders });
    }

    // Fallback to seed data if database table not yet populated
    return NextResponse.json({ success: true, categories: INITIAL_CATEGORIES }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: true, categories: INITIAL_CATEGORIES }, { headers: noCacheHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ success: false, message: 'Category name is required' }, { status: 400 });
    }

    const name = body.name.trim();
    const slug = body.slug?.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const description = body.description || '';
    const imageUrl = body.imageUrl || '';
    const displayOrder = Number(body.displayOrder) || 0;

    const adminSupabase = createAdminClient();
    const { data: newCat, error } = await (adminSupabase.from('categories') as any)
      .insert({
        name,
        slug,
        description,
        image_url: imageUrl,
        display_order: displayOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Category insert error:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    // Instant storefront revalidation
    revalidatePath('/');
    revalidatePath('/shop');

    return NextResponse.json({
      success: true,
      category: {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        description: newCat.description,
        imageUrl: newCat.image_url,
        displayOrder: newCat.display_order,
      },
    });
  } catch (error) {
    console.error('Category creation exception:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    // Soft delete: sets is_active = false and deleted_at
    const adminSupabase = createAdminClient();
    const { error } = await (adminSupabase.from('categories') as any)
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    revalidatePath('/');
    revalidatePath('/shop');

    return NextResponse.json({ success: true, message: 'Category deactivated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to delete category' }, { status: 500 });
  }
}
