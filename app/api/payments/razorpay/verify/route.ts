import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If no secret configured (development/sandbox mode), permit simulation
    return true;
  }
  try {
    const text = `${orderId}|${paymentId}`;
    const generated = crypto.createHmac('sha256', secret).update(text).digest('hex');
    return generated === signature;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, message: 'Missing payment details.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 1. Locate order in Supabase
    const { data: order, error: orderErr } = await (adminSupabase.from('orders') as any)
      .select('*, order_items(*)')
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json(
        { success: false, message: 'Order record not found.' },
        { status: 404 }
      );
    }

    // 2. Verify signature
    const isValid = verifyRazorpaySignature(
      razorpayOrderId || order.razorpay_order_id || '',
      razorpayPaymentId,
      razorpaySignature || ''
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Payment verification failed: invalid signature.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 3. Update order payment status in Supabase
    const { data: updatedOrder, error: updateErr } = await (adminSupabase.from('orders') as any)
      .update({
        payment_status: 'paid',
        status: 'paid',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_order_id: razorpayOrderId || order.razorpay_order_id,
        updated_at: now,
      })
      .eq('id', order.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Failed to update order payment in Supabase:', updateErr);
      return NextResponse.json({ success: false, message: 'Database update failed.' }, { status: 500 });
    }

    // 4. Record in order_status_history
    await (adminSupabase.from('order_status_history') as any).insert({
      order_id: order.id,
      status: 'paid',
      notes: `Payment verified via Razorpay ID: ${razorpayPaymentId}`,
      created_at: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment successfully verified!',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Payment verification exception:', error);
    return NextResponse.json({ success: false, message: 'Payment verification failed' }, { status: 500 });
  }
}
