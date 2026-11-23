import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import { heroSlidesBatchSchema } from '@/lib/validations/hero';
import { getHeroSlidesFromDB, invalidateHeroSlidesCache } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const heroData = await getHeroSlidesFromDB();
    return NextResponse.json(
      { success: true, hero: heroData },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Failed to get hero banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve hero banner slides', hero: { slides: [] } },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

async function handleSaveHero(req: Request) {
  try {
    // 1. Strict Server-Side Administrator Authentication Guard
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload in request body' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!body || !Array.isArray(body.slides)) {
      return NextResponse.json(
        { success: false, message: 'Invalid format. Array of slides required.' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    // 2. Validate with Zod schema (title, subtitle limits, URL check, max 6 active slides)
    const validationResult = heroSlidesBatchSchema.safeParse(body.slides);
    if (!validationResult.success) {
      const errorMsg = validationResult.error.issues.map((e) => e.message).join(', ');
      return NextResponse.json(
        { success: false, message: `Validation error: ${errorMsg}` },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const validatedSlides = validationResult.data;
    const adminSupabase = createAdminClient();

    // 3. Persist to dedicated public.hero_slides table
    // Delete existing slides and insert the validated updated list in order
    const { error: deleteError } = await (adminSupabase as any)
      .from('hero_slides')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error clearing old hero slides:', deleteError);
    }

    const insertPayload = validatedSlides.map((slide, index) => ({
      image_url: slide.image_url,
      title: slide.title,
      subtitle: slide.subtitle || '',
      button_text: slide.button_text || 'Explore Collection',
      button_link: slide.button_link || '/shop',
      sort_order: index,
      is_active: slide.is_active ?? true,
      updated_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await (adminSupabase as any)
      .from('hero_slides')
      .insert(insertPayload)
      .select('*');

    if (insertError) {
      console.error('Failed to insert hero slides:', insertError);
      return NextResponse.json(
        { success: false, message: `Database error: ${insertError.message}` },
        { status: 500, headers: noCacheHeaders }
      );
    }

    // 4. Invalidate memory cache & trigger instant page revalidation
    invalidateHeroSlidesCache();
    try {
      revalidatePath('/', 'page');
    } catch (_) {}

    return NextResponse.json(
      {
        success: true,
        message: 'Hero banner updated and synced successfully',
        hero: { slides: inserted || insertPayload },
      },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Failed to update hero banner:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to update hero banner configuration' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: Request) {
  return handleSaveHero(req);
}

export async function PUT(req: Request) {
  return handleSaveHero(req);
}
