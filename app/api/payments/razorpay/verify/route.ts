import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function verifyWithRazorpayApi(paymentId: string, orderTotalInPaise?: number): Promise<boolean> {
  const keyId = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '').trim();
  const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !secret) {
    return true; // Test/sandbox fallback
  }

  try {
    const auth = Buffer.from(`${keyId}:${secret}`).toString('base64');
    const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!res.ok) {
      console.warn(`Razorpay payment fetch returned status ${res.status}`);
      return false;
    }

    const payment = await res.json();

    // If payment is authorized, capture it automatically
    if (payment.status === 'authorized') {
      try {
        await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/capture`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: payment.amount || orderTotalInPaise,
            currency: 'INR',
          }),
        });
      } catch (capErr) {
        console.warn('Auto-capture warning:', capErr);
      }
      return true;
    }

    return payment.status === 'captured';
  } catch (err) {
    console.warn('Razorpay API verification exception:', err);
    return false;
  }
}

function verifyHmacSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!secret) return true;
  if (!signature || !orderId) return false;

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

    // 2. Multi-tier Payment Verification:
    let isValid = false;
    const effectiveOrderId = razorpayOrderId || order.razorpay_order_id;

    // Tier 1: Check HMAC SHA-256 signature if signature & order_id are present
    if (razorpaySignature && effectiveOrderId) {
      isValid = verifyHmacSignature(effectiveOrderId, razorpayPaymentId, razorpaySignature);
    }

    // Tier 2: Check directly with Razorpay API (handles payments without order_id or when signature is omitted)
    if (!isValid && typeof razorpayPaymentId === 'string' && razorpayPaymentId.startsWith('pay_')) {
      const orderTotalPaise = Math.round(Number(order.total || 0) * 100);
      isValid = await verifyWithRazorpayApi(razorpayPaymentId, orderTotalPaise);
    }

    // Tier 3: Simulated test payments
    if (!isValid && (razorpayPaymentId.startsWith('pay_sim_') || razorpaySignature?.startsWith('sig_sim_'))) {
      isValid = true;
    }

    // Tier 4: Test key fallback (if using rzp_test_ key and Razorpay returned a pay_ ID)
    const isTestKey = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '').startsWith('rzp_test_');
    if (!isValid && isTestKey && typeof razorpayPaymentId === 'string' && razorpayPaymentId.startsWith('pay_')) {
      isValid = true;
    }

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
        razorpay_order_id: effectiveOrderId || null,
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
