import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/razorpay';
import { OrderStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const orderNumber = searchParams.get('orderNumber');

    if (orderNumber) {
      const order = db.getOrderById(orderNumber);
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, order });
    }

    if (userId) {
      const orders = db.getOrdersByUserId(userId);
      return NextResponse.json({ success: true, count: orders.length, orders });
    }

    const orders = db.getOrders();
    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Orders API GET error:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch orders' }, { status: 500 });
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
      couponCode,
      specialInstructions,
      paymentMethod = 'Razorpay UPI/Cards',
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Cart items are required' }, { status: 400 });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.pincode) {
      return NextResponse.json({ success: false, message: 'Complete delivery address is required' }, { status: 400 });
    }

    // SERVER-SIDE REVALIDATION: Re-calculate item prices & verify inventory
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = db.getProductById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product "${item.productName}" no longer exists.` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Sorry, "${product.name}" only has ${product.stock} pieces remaining in stock.`,
          },
          { status: 400 }
        );
      }

      const unitPrice = product.discountPrice || product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        image: product.images[0] || '/images/loop-and-love-logo.jpg',
        color: item.color || 'Standard',
        size: item.size || 'Standard',
        unitPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    // Free shipping above 999
    const shippingCharge = subtotal >= 999 ? 0 : 99;

    // Coupon verification
    let discountAmount = 0;
    if (couponCode) {
      const coupon = db.getCouponByCode(couponCode);
      if (coupon && subtotal >= coupon.minOrderValue) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount) {
            discountAmount = Math.min(coupon.maxDiscount, discountAmount);
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
    const totalAmount = Math.round((subtotal - discountAmount + shippingCharge + taxAmount) * 100) / 100;

    const isCOD = paymentMethod === 'Cash on Delivery (COD)' || paymentMethod?.includes('Cash on Delivery') || paymentMethod === 'COD';

    let rzpOrderId = `cod_${Date.now()}`;
    let rzpAmount = Math.round(totalAmount * 100);

    if (!isCOD) {
      // Create Razorpay payment order for online payments
      const rzpOrder = await createRazorpayOrder({
        amount: totalAmount * 100, // paise
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          customerName,
          customerEmail,
        },
      });
      rzpOrderId = rzpOrder.id;
      rzpAmount = rzpOrder.amount;
    }

    // Save order in database
    const initialStatus: OrderStatus = isCOD ? 'Order Confirmed' : 'Order Placed';
    const statusHistory = isCOD
      ? [
        {
          status: 'Order Placed' as OrderStatus,
          timestamp: new Date().toISOString(),
          note: 'Order placed via Cash on Delivery (COD).',
        },
        {
          status: 'Order Confirmed' as OrderStatus,
          timestamp: new Date().toISOString(),
          note: 'Cash on Delivery order confirmed! Inventory reserved for crafting.',
        },
      ]
      : [
        {
          status: 'Order Placed' as OrderStatus,
          timestamp: new Date().toISOString(),
          note: 'Order initiated, awaiting verified payment.',
        },
      ];

    const newOrder = db.createOrder({
      userId: userId || 'guest',
      customerName,
      customerEmail,
      customerPhone,
      items: validatedItems,
      shippingAddress,
      subtotal,
      shippingCharge,
      taxAmount,
      discountAmount,
      couponCode,
      totalAmount,
      paymentStatus: 'PENDING',
      paymentMethod: isCOD ? 'Cash on Delivery (COD)' : paymentMethod,
      razorpayOrderId: rzpOrderId,
      orderStatus: initialStatus,
      statusHistory,
      specialInstructions,
    });

    // If COD, reserve inventory immediately
    if (isCOD) {
      for (const item of validatedItems) {
        db.reduceStock(item.productId, item.quantity);
      }
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
      isCOD,
      razorpay: isCOD
        ? undefined
        : {
          orderId: rzpOrderId,
          amount: rzpAmount,
          currency: 'INR',
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || 'rzp_test_U24YNvPzHAbE40',
        },
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ success: false, message: 'Failed to create order' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { orderId, status, note, trackingNumber, courierPartner, paymentStatus } = body;

    if (!orderId || !status) {
      return NextResponse.json({ success: false, message: 'Order ID and status are required' }, { status: 400 });
    }

    const updated = db.updateOrderStatus(
      orderId,
      status as OrderStatus,
      note,
      trackingNumber,
      courierPartner,
      paymentStatus
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order status' }, { status: 500 });
  }
}
