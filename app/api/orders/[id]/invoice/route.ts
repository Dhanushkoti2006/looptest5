import { NextResponse } from 'next/server';
import { siteConfig } from '@/src/config/site';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateInvoicePDF } from '@/lib/invoice';
import { Order, OrderItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let orderQuery = (adminSupabase.from('orders') as any)
      .select(`
        *,
        order_items (*),
        order_status_history (*)
      `);

    orderQuery = isUuid
      ? orderQuery.or(`id.eq.${id},order_number.eq.${id}`)
      : orderQuery.eq('order_number', id);

    const { data: dbOrder, error } = await orderQuery.maybeSingle();

    if (error || !dbOrder) {
      return NextResponse.json({ success: false, message: 'Order not found in database' }, { status: 404 });
    }

    const items: OrderItem[] = (dbOrder.order_items || []).map((it: any) => ({
      id: it.id,
      productId: it.product_id || '',
      productName: it.product_name,
      image: it.image_url || '/images/photo-coming-soon.svg',
      color: 'Standard',
      size: 'Standard',
      unitPrice: Number(it.unit_price),
      quantity: Number(it.quantity),
      totalPrice: Number(it.unit_price) * Number(it.quantity),
    }));

    const mappedOrder: Order = {
      id: dbOrder.id,
      orderNumber: dbOrder.order_number,
      userId: dbOrder.user_id || 'guest',
      customerName: dbOrder.shipping_full_name || 'Valued Customer',
      customerEmail: dbOrder.customer_email || siteConfig.contactEmail,
      customerPhone: dbOrder.shipping_phone || '',
      items,
      shippingAddress: {
        id: `addr-${dbOrder.id}`,
        userId: dbOrder.user_id || 'guest',
        name: dbOrder.shipping_full_name || 'Valued Customer',
        phone: dbOrder.shipping_phone || '',
        street: dbOrder.shipping_street_address || dbOrder.shipping_line1 || '',
        landmark: dbOrder.shipping_apartment || dbOrder.shipping_line2 || '',
        city: dbOrder.shipping_city || '',
        state: dbOrder.shipping_state || '',
        pincode: dbOrder.shipping_pincode || '',
        isDefault: true,
        createdAt: dbOrder.created_at,
      },
      subtotal: Number(dbOrder.subtotal),
      shippingCharge: Number(dbOrder.delivery_fee),
      taxAmount: Math.round(Number(dbOrder.subtotal) * 0.05 * 100) / 100,
      discountAmount: 0,
      totalAmount: Number(dbOrder.total),
      paymentStatus: (['paid', 'success', 'captured'].includes((dbOrder.payment_status || '').toLowerCase()) ? 'SUCCESS' : (dbOrder.payment_status?.toUpperCase() || 'SUCCESS')) as any,
      paymentMethod: dbOrder.payment_method || 'Razorpay Online',
      deliveryMethod: dbOrder.delivery_method || 'courier_manual',
      razorpayOrderId: dbOrder.razorpay_order_id || '',
      razorpayPaymentId: dbOrder.razorpay_payment_id || '',
      orderStatus: 'Order Confirmed',
      statusHistory: [],
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at || dbOrder.created_at,
    };

    const pdfDoc = generateInvoicePDF(mappedOrder);
    const pdfBuffer = Buffer.from(pdfDoc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${mappedOrder.orderNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ success: false, message: 'Invoice generation failed' }, { status: 500 });
  }
}
