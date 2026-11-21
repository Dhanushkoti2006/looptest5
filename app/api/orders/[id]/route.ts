import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const idParam = params.id;

    // Try customer query first
    let { data: order, error } = await (supabase.from('orders') as any)
      .select('*, order_items(*), order_status_history(*)')
      .or(`id.eq.${idParam},order_number.eq.${idParam}`)
      .maybeSingle();

    // If customer query returned nothing (e.g. unauthenticated or admin lookup), try admin client
    if (!order) {
      const adminSupabase = createAdminClient();
      const { data: adminOrder } = await (adminSupabase.from('orders') as any)
        .select('*, order_items(*), order_status_history(*)')
        .or(`id.eq.${idParam},order_number.eq.${idParam}`)
        .maybeSingle();

      order = adminOrder;
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const formattedOrder = {
      ...order,
      orderNumber: order.order_number,
      totalAmount: Number(order.total) || 0,
      subtotal: Number(order.subtotal) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      items: (order.order_items || []).map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        productName: i.product_name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price) || 0,
        totalPrice: (Number(i.unit_price) || 0) * (i.quantity || 1),
        imageUrl: i.image_url || '',
      })),
      shippingAddress: {
        name: order.shipping_full_name,
        phone: order.shipping_phone,
        street: order.shipping_line1 || order.shipping_street_address || '',
        apartment: order.shipping_line2 || order.shipping_apartment || '',
        city: order.shipping_city,
        state: order.shipping_state,
        pincode: order.shipping_pincode,
      },
    };

    return NextResponse.json({ success: true, order: formattedOrder });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch order' }, { status: 500 });
  }
}
