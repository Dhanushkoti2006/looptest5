import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET() {
  try {
    const categories = db.getCategories();
    return NextResponse.json({ success: true, categories }, { headers: noCacheHeaders });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve categories' },
      { status: 500, headers: noCacheHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'Category name is required' },
        { status: 400 }
      );
    }
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const category = db.createCategory({
      name: body.name,
      slug,
      description: body.description || '',
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
      displayOrder: body.displayOrder || 1,
    });
    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to create category' },
      { status: 500 }
    );
  }
}
