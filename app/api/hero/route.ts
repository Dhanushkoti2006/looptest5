import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// In-memory cache for the serverless container
let heroCache: any = null;

const DEFAULT_HERO = {
  slides: [
    {
      id: 'slide-1',
      title: 'Handmade with Love, Crafted to Last.',
      subtitle: 'Everlasting blooms, cozy artisan totes, and bespoke amigurumi keepsakes stitched with utmost tenderness.',
      badge: '✨ Artisanal Crochet Collection 2026',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
    {
      id: 'slide-2',
      title: 'Bring Your Dream Crochet Idea to Life',
      subtitle: 'Custom bridal flowers, anniversary gifts, or your favorite plush character crafted exactly to your vision.',
      badge: '🌸 Bespoke Custom Order Studio',
      ctaText: 'Design Custom Order',
      ctaLink: '/custom-orders',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
    {
      id: 'slide-3',
      title: 'Sweet Companions & Soft Amigurumi',
      subtitle: 'Gentle, hypoallergenic milk cotton toys stitched for pure cuddles and nursery warmth.',
      badge: '🧸 Baby Safe & Handcrafted',
      ctaText: 'Shop Soft Toys',
      ctaLink: '/shop?category=soft-toys-amigurumi',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
  ],
};

function getHeroData() {
  if (heroCache) return heroCache;

  try {
    const fs = require('fs');
    const path = require('path');
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (isServerless) {
      const tmpPath = path.join('/tmp', 'hero.json');
      if (fs.existsSync(tmpPath)) {
        const raw = fs.readFileSync(tmpPath, 'utf-8');
        heroCache = JSON.parse(raw);
        return heroCache;
      }
    }

    const bundledPath = path.join(process.cwd(), 'data', 'hero.json');
    if (fs.existsSync(bundledPath)) {
      const raw = fs.readFileSync(bundledPath, 'utf-8');
      heroCache = JSON.parse(raw);
      return heroCache;
    }
  } catch (err) {
    console.warn('Could not read hero banner from disk:', err);
  }

  heroCache = DEFAULT_HERO;
  return heroCache;
}

function saveHeroData(data: any) {
  heroCache = data;

  try {
    const fs = require('fs');
    const path = require('path');
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const heroFilePath = isServerless
      ? path.join('/tmp', 'hero.json')
      : path.join(process.cwd(), 'data', 'hero.json');

    const dir = path.dirname(heroFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(heroFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist hero banner to disk (using in-memory):', err);
  }
}

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const heroData = getHeroData();
    return NextResponse.json(
      { success: true, hero: heroData },
      { headers: noCacheHeaders }
    );
  } catch (error: any) {
    console.error('Failed to get hero banner:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to retrieve hero banner configuration' },
      { status: 500, headers: noCacheHeaders }
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
    saveHeroData(data);

    return NextResponse.json(
      {
        success: true,
        message: 'Hero banner updated successfully',
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
