import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderNumber = searchParams.get('orderNumber');

    const supabase = await createClient();

    if (orderNumber) {
      const { data: order, error } = await (supabase.from('orders') as any)
        .select('*, order_items(*)')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (error || !order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404, headers: noCacheHeaders });
      }
      return NextResponse.json({ success: true, order }, { headers: noCacheHeaders });
    }

    if (userId) {
      const { data: orders, error } = await (supabase.from('orders') as any)
        .select('*, order_items(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500, headers: noCacheHeaders });
      }
      return NextResponse.json({ success: true, count: orders?.length || 0, orders }, { headers: noCacheHeaders });
    }

    // Admin query
    const adminSupabase = createAdminClient();
    const { data: allOrders, error } = await (adminSupabase.from('orders') as any)
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500, headers: noCacheHeaders });
    }

    return NextResponse.json({ success: true, count: allOrders?.length || 0, orders: allOrders }, { headers: noCacheHeaders });
  } catch (error) {
    console.error('Orders GET exception:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500, headers: noCacheHeaders });
  }
}

// TODO: Official Razorpay order creation integration stub
async function createRazorpayOrderStub(amountInPaise: number, orderNumber: string) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId === 'rzp_test_placeholder') {
    // Keys not yet configured: return null so payment status stays pending
    return null;
  }

  try {
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amountInPaise),
        currency: 'INR',
        receipt: orderNumber,
        notes: { store: 'Loop & Love Crochet' },
      }),
    });
    const data = await res.json();
    return data?.id || null;
  } catch (e) {
    console.warn('Razorpay order creation stub warning:', e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      items,
      shippingAddress,
      customerNote,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart items are required' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.pincode) {
      return NextResponse.json({ success: false, message: 'Complete delivery address is required' }, { status: 400 });
    }

    const cleanPincode = String(shippingAddress.pincode).trim().replace(/\D/g, '');
    const adminSupabase = createAdminClient();

    // 1. PINCODE & DELIVERY ZONE VALIDATION (Server-side)
    const { data: zone, error: zoneError } = await (adminSupabase.from('delivery_zones') as any)
      .select('*')
      .eq('pincode', cleanPincode)
      .eq('is_active', true)
      .maybeSingle();

    if (zoneError || !zone) {
      return NextResponse.json(
        {
          success: false,
          unservedPincode: true,
          message: `Delivery is currently not available for PIN code ${cleanPincode}. We are expanding soon!`,
        },
        { status: 400 }
      );
    }

    // 2. SERVER-SIDE PRICE & INVENTORY RECALCULATION (Never trust client prices)
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      imageUrl: string;
    }> = [];

    for (const item of items) {
      const { data: product, error: prodErr } = await (adminSupabase.from('products') as any)
        .select(`
          id,
          name,
          price,
          stock,
          is_active,
          product_images (image_url, display_order)
        `)
        .eq('id', item.productId)
        .eq('is_active', true)
        .maybeSingle();

      if (prodErr || !product) {
        return NextResponse.json(
          { success: false, message: `Product "${item.productName || 'item'}" is no longer available.` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.price);
      const qty = Math.max(1, Number(item.quantity) || 1);
      calculatedSubtotal += unitPrice * qty;

      const firstImage = product.product_images?.[0]?.image_url || item.image || '';

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: qty,
        imageUrl: firstImage,
      });
    }

    // 3. SERVER-SIDE DELIVERY FEE CALCULATION
    let calculatedDeliveryFee = Number(zone.delivery_fee) || 0;
    if (zone.free_above && calculatedSubtotal >= Number(zone.free_above)) {
      calculatedDeliveryFee = 0;
    }

    const calculatedTotal = calculatedSubtotal + calculatedDeliveryFee;

    // 4. GENERATE ORDER NUMBER
    const orderNumber = `LL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // 5. RAZORPAY INTEGRATION STUB
    const razorpayOrderId = await createRazorpayOrderStub(calculatedTotal * 100, orderNumber);

    // 6. INSERT ORDER RECORD (Admin client / Service role)
    const { data: newOrder, error: orderInsertErr } = await (adminSupabase.from('orders') as any)
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        status: 'paid',
        payment_status: razorpayOrderId ? 'pending' : 'paid',
        razorpay_order_id: razorpayOrderId,
        subtotal: calculatedSubtotal,
        delivery_fee: calculatedDeliveryFee,
        total: calculatedTotal,
        delivery_method: zone.delivery_method, // 'local_own' | 'courier_manual'
        shipping_full_name: customerName || shippingAddress.name,
        shipping_phone: customerPhone || shippingAddress.phone,
        shipping_street_address: shippingAddress.street,
        shipping_apartment: shippingAddress.apartment || shippingAddress.landmark || '',
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_pincode: cleanPincode,
        customer_note: customerNote || '',
      })
      .select()
      .single();

    if (orderInsertErr || !newOrder) {
      console.error('Order creation insert error:', orderInsertErr);
      return NextResponse.json({ success: false, message: 'Failed to create order record' }, { status: 500 });
    }

    // 7. INSERT ORDER ITEMS SNAPSHOTS
    const itemRecords = validatedItems.map((vi) => ({
      order_id: newOrder.id,
      product_id: vi.productId,
      product_name: vi.productName,
      unit_price: vi.unitPrice,
      quantity: vi.quantity,
      image_url: vi.imageUrl,
    }));

    await (adminSupabase.from('order_items') as any).insert(itemRecords);

    // 8. LOG IN ORDER STATUS HISTORY
    await (adminSupabase.from('order_status_history') as any).insert({
      order_id: newOrder.id,
      status: 'paid',
      notes: `Order created and confirmed. Delivery method: ${zone.delivery_method === 'local_own' ? 'Local Hand Delivery' : 'Courier'}`,
      changed_by: userId || null,
    });

    // 9. DEDUCT PRODUCT STOCK
    for (const vi of validatedItems) {
      const { data: curProd } = await (adminSupabase.from('products') as any)
        .select('stock')
        .eq('id', vi.productId)
        .single();

      if (curProd) {
        const remaining = Math.max(0, (curProd.stock || 0) - vi.quantity);
        await (adminSupabase.from('products') as any)
          .update({ stock: remaining })
          .eq('id', vi.productId);
      }
    }

    // 10. CLEAR USER CART IN SUPABASE
    if (userId) {
      try {
        const { data: cartData } = await (adminSupabase.from('carts') as any)
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (cartData) {
          await (adminSupabase.from('cart_items') as any).delete().eq('cart_id', cartData.id);
        }
      } catch (cartErr) {
        console.warn('Error clearing user cart:', cartErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order created successfully.',
      order: {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        total: calculatedTotal,
        subtotal: calculatedSubtotal,
        deliveryFee: calculatedDeliveryFee,
        deliveryMethod: newOrder.delivery_method,
        status: newOrder.status,
        paymentStatus: newOrder.payment_status,
        razorpayOrderId,
      },
    });
  } catch (error) {
    console.error('Order creation exception:', error);
    return NextResponse.json({ success: false, message: 'Server error processing order' }, { status: 500 });
  }
}

const STATUS_MAP: Record<string, string> = {
  'order placed': 'paid',
  'payment verified': 'paid',
  'order confirmed': 'paid',
  'paid': 'paid',
  'processing': 'making',
  'making your crochet product': 'making',
  'making': 'making',
  'quality check': 'packed',
  'packed': 'packed',
  'out for delivery': 'out_for_delivery',
  'out_for_delivery': 'out_for_delivery',
  'shipped': 'shipped',
  'delivered': 'delivered',
  'cancelled': 'cancelled',
};

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      orderId,
      status,
      note,
      deliveryPersonName,
      deliveryPersonPhone,
      courierPartner,
      courierName,
      trackingNumber,
      trackingUrl,
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Check existing order
    const { data: existingOrder, error: fetchErr } = await (adminSupabase.from('orders') as any)
      .select('id, status, delivery_method, order_number')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    const updatePayload: Record<string, any> = {};

    let targetDbStatus = existingOrder.status;
    if (status) {
      const lower = String(status).toLowerCase().trim();
      targetDbStatus = STATUS_MAP[lower] || lower;
      updatePayload.status = targetDbStatus;
    }

    if (deliveryPersonName !== undefined) updatePayload.delivery_person_name = deliveryPersonName;
    if (deliveryPersonPhone !== undefined) updatePayload.delivery_person_phone = deliveryPersonPhone;
    if (courierPartner !== undefined || courierName !== undefined) {
      updatePayload.courier_name = courierPartner || courierName;
    }
    if (trackingNumber !== undefined) updatePayload.tracking_number = trackingNumber;
    if (trackingUrl !== undefined) updatePayload.tracking_url = trackingUrl;

    const { data: updatedOrder, error: updateErr } = await (adminSupabase.from('orders') as any)
      .update(updatePayload)
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single();

    if (updateErr) {
      console.error('Order PATCH error:', updateErr);
      return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
    }

    // Insert into order_status_history
    await (adminSupabase.from('order_status_history') as any).insert({
      order_id: orderId,
      status: targetDbStatus,
      notes: note || `Order updated to ${targetDbStatus} by admin`,
    });

    // If status changed to cancelled and previously wasn't cancelled, restock inventory
    if (targetDbStatus === 'cancelled' && existingOrder.status !== 'cancelled') {
      const { data: items } = await (adminSupabase.from('order_items') as any)
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.product_id) {
            const { data: p } = await (adminSupabase.from('products') as any)
              .select('stock')
              .eq('id', item.product_id)
              .single();
            if (p) {
              await (adminSupabase.from('products') as any)
                .update({ stock: (p.stock || 0) + item.quantity })
                .eq('id', item.product_id);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Order PATCH exception:', error);
    return NextResponse.json({ success: false, message: 'Server error updating order' }, { status: 500 });
  }
}
