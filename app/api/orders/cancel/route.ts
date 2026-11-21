import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
        { success: false, message: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    // 2. Query order to verify ownership and current status
    const adminSupabase = createAdminClient();
    const { data: order, error: fetchError } = await (adminSupabase.from('orders') as any)
      .select('id, user_id, status')
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

    // 3. Verify status: Cancellation is ONLY permitted in initial confirmed/paid stage
    const currentStatus = (order.status || '').toLowerCase();
    const cancellableStatuses = ['paid', 'confirmed', 'order confirmed', 'pending_payment'];

    if (!cancellableStatuses.includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Order cannot be cancelled because it is already in production, packed, or shipped.',
        },
        { status: 400 }
      );
    }

    const cancelReasonText = reason?.trim() || 'Cancelled by customer';
    const now = new Date().toISOString();

    // 4. Update order to cancelled
    const { error: updateError } = await (adminSupabase.from('orders') as any)
      .update({
        status: 'cancelled',
        cancel_reason: cancelReasonText,
        cancelled_at: now,
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Order cancellation update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to cancel order.' },
        { status: 500 }
      );
    }

    // 5. Log in order_status_history
    await (adminSupabase.from('order_status_history') as any).insert({
      order_id: orderId,
      status: 'cancelled',
      notes: `Order cancelled by customer: ${cancelReasonText}`,
      changed_by: user.id,
      created_at: now,
    });

    // 6. Restock products
    const { data: items } = await (adminSupabase.from('order_items') as any)
      .select('product_id, quantity')
      .eq('order_id', orderId);

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.product_id && item.quantity > 0) {
          const { data: prod } = await (adminSupabase.from('products') as any)
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (prod) {
            await (adminSupabase.from('products') as any)
              .update({ stock: (prod.stock || 0) + item.quantity })
              .eq('id', item.product_id);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Your order has been cancelled successfully and restocked.',
    });
  } catch (error) {
    console.error('Cancel order exception:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing cancellation.' },
      { status: 500 }
    );
  }
}
