import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getHeroSlidesFromDB, DEFAULT_HERO_SLIDES } from '@/lib/supabase/queries';

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
      { success: true, hero: { slides: DEFAULT_HERO_SLIDES } },
      { headers: noCacheHeaders }
    );
  }
}

async function handleSaveHero(req: Request) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON in request body' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    if (!body || !Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one slide is required in hero banner' },
        { status: 400, headers: noCacheHeaders }
      );
    }

    const data = { slides: body.slides };

    // 1. Persist to Supabase database
    try {
      const supabase = createAdminClient();
      await (supabase.from('categories') as any).upsert(
        {
          name: '_Hero_Slides_Config_',
          slug: '_site_hero_slides',
          description: JSON.stringify(body.slides),
          is_active: false,
          display_order: 9999,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      );
    } catch (dbErr) {
      console.warn('Failed to persist hero to Supabase:', dbErr);
    }

    // 2. Local file backup
    try {
      const fs = require('fs');
      const path = require('path');
      const heroFilePath = path.join(process.cwd(), 'data', 'hero.json');
      const dir = path.dirname(heroFilePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(heroFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (_) {}

    // 3. Revalidate home page cache
    try {
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json(
      {
        success: true,
        message: 'Hero banner updated and synced successfully',
        hero: data,
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
