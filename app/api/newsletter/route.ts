import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    const { error } = await (adminSupabase.from('newsletter_subscribers') as any).insert({
      email,
      is_active: true,
    });

    if (error) {
      // Postgres unique constraint violation error code 23505
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        return NextResponse.json({
          success: true,
          message: 'You are already subscribed to our newsletter!',
        });
      }
      console.error('Newsletter insert error:', error);
      return NextResponse.json({ success: false, message: 'Could not subscribe at this time.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing to Loop & Love!',
    });
  } catch (error) {
    console.error('Newsletter subscription exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
