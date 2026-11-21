import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body?.email?.trim().toLowerCase();
    const productId = body?.productId;
    const pincode = body?.pincode;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'Valid email is required.' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. If for a specific product restock
    if (productId) {
      const { error } = await (adminSupabase.from('notify_me_requests') as any).insert({
        product_id: productId,
        email,
        is_notified: false,
      });

      if (error) {
        console.error('Notify me insert error:', error);
        return NextResponse.json({ success: false, message: 'Could not record notification request.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'You have been registered for restock notification!',
      });
    }

    // 2. If for an unserved pincode notification
    if (pincode) {
      // Record subscriber in newsletter
      await (adminSupabase.from('newsletter_subscribers') as any).upsert({
        email,
        is_active: true,
      });

      return NextResponse.json({
        success: true,
        message: `We will notify you at ${email} as soon as delivery opens for PIN code ${pincode}!`,
      });
    }

    return NextResponse.json({ success: true, message: 'Request received.' });
  } catch (error) {
    console.error('Notify me exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
