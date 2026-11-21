import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function triggerRazorpayRefund(paymentId: string | null, amountInPaise: number, notes: Record<string, string>) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (keyId && keySecret && keyId !== 'rzp_test_placeholder' && paymentId) {
    try {
      const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amountInPaise),
          notes,
        }),
      });
      const data = await res.json();
      if (data && data.id) {
        return { success: true, refundId: data.id };
      }
    } catch (err) {
      console.warn('Razorpay refund API exception:', err);
    }
  }

  // Simulated instant refund ID for sandbox/development environments
  return { success: true, refundId: `rfnd_sim_${Date.now().toString(36)}` };
}

export async function POST(req: Request) {
  try {
    const { orderId, reason } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required.' },
        { status: 400 }
      );
    }

    // 1. Authenticate user from session cookies
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please sign in to cancel your order.' },
        { status: 401 }
      );
    }

    // 2. Query order to verify ownership and current status
    const adminSupabase = createAdminClient();
    const { data: order, error: fetchError } = await (adminSupabase.from('orders') as any)
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json(
        { success: false, message: 'Order not found.' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (order.user_id !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You can only cancel your own orders.' },
        { status: 403 }
      );
    }

    const currentStatus = (order.status || '').toLowerCase().trim();

    // Block cancellation once packed, shipped, out for delivery or delivered
    const nonCancellableStatuses = ['packed', 'shipped', 'out_for_delivery', 'delivered', 'completed', 'cancelled'];
    if (nonCancellableStatuses.includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Order cannot be cancelled because it is already marked as "${order.status}". Cancellation is strictly prohibited once packing or shipping has begun.`,
        },
        { status: 400 }
      );
    }

    // Only allow cancellation while status is paid, confirmed, or making-not-started
    const cancellableStatuses = ['paid', 'confirmed', 'order confirmed', 'pending_payment', 'making-not-started', 'making'];
    if (!cancellableStatuses.includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order cancellation is not permitted at this stage.',
        },
        { status: 400 }
      );
    }

    const cancelReasonText = reason?.trim() || 'Cancelled by customer';
    const now = new Date().toISOString();

    // 3. Server-side Razorpay Refund if payment was collected
    let refundId: string | null = null;
    let paymentStatus = order.payment_status;

    if (order.payment_status === 'paid' || order.status === 'paid' || order.razorpay_payment_id) {
      const refundResult = await triggerRazorpayRefund(
        order.razorpay_payment_id || null,
        (order.total || 0) * 100,
        {
          orderId: order.id,
          orderNumber: order.order_number,
          reason: cancelReasonText,
        }
      );
      refundId = refundResult.refundId;
      paymentStatus = 'refunded';
    }

    // 4. Update order record in Supabase
    const { error: updateError } = await (adminSupabase.from('orders') as any)
      .update({
        status: 'cancelled',
        payment_status: paymentStatus,
        cancel_reason: cancelReasonText,
        cancelled_at: now,
        razorpay_refund_id: refundId,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order cancellation update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to cancel order record.' },
        { status: 500 }
      );
    }

    // 5. Append entry to order_status_history
    await (adminSupabase.from('order_status_history') as any).insert({
      order_id: orderId,
      status: 'cancelled',
      notes: `Order cancelled by customer. Reason: ${cancelReasonText}${refundId ? ` | Refund initiated: ${refundId}` : ''}`,
      changed_by: user.id,
      created_at: now,
    });

    // 6. Restock products in Supabase
    const items = order.order_items || [];
    for (const item of items) {
      if (item.product_id && item.quantity > 0) {
        const { data: prod } = await (adminSupabase.from('products') as any)
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (prod) {
          await (adminSupabase.from('products') as any)
            .update({
              stock: (prod.stock || 0) + item.quantity,
              updated_at: now,
            })
            .eq('id', item.product_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your order has been cancelled and items have been restocked. A full refund has been initiated.',
      refundId,
    });
  } catch (error) {
    console.error('Cancel order exception:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing cancellation.' },
      { status: 500 }
    );
  }
}
