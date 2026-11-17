import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const heroData = db.getHeroBanner();
    return NextResponse.json({ success: true, hero: heroData });
  } catch (error) {
    console.error('Failed to get hero banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve hero banner configuration' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    if (!body || !Array.isArray(body.slides) || body.slides.length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one slide is required in hero banner' },
        { status: 400 }
      );
    }

    const updated = db.updateHeroBanner({ slides: body.slides });
    return NextResponse.json({ success: true, message: 'Hero banner updated successfully', hero: updated });
  } catch (error) {
    console.error('Failed to update hero banner:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update hero banner configuration' },
      { status: 500 }
    );
  }
}
