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

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);

    // Try customer query first
    let customerQuery = (supabase.from('orders') as any)
      .select('*, order_items(*), order_status_history(*)');

    customerQuery = isUuid
      ? customerQuery.or(`id.eq.${idParam},order_number.eq.${idParam}`)
      : customerQuery.eq('order_number', idParam);

    let { data: order, error } = await customerQuery.maybeSingle();

    // If customer query returned nothing (e.g. unauthenticated or admin lookup), try admin client
    if (!order) {
      const adminSupabase = createAdminClient();
      let adminQuery = (adminSupabase.from('orders') as any)
        .select('*, order_items(*), order_status_history(*)');

      adminQuery = isUuid
        ? adminQuery.or(`id.eq.${idParam},order_number.eq.${idParam}`)
        : adminQuery.eq('order_number', idParam);

      const { data: adminOrder } = await adminQuery.maybeSingle();
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
      paymentMethod: order.payment_method || 'Prepaid (Razorpay Online)',
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
