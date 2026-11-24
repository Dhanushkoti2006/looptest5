import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
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
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as 'today' | '7days' | '30days' | 'all') || 'all';

    const supabase = createAdminClient();

    // 1. Fetch live orders and order_items
    const [ordersRes, itemsRes, productsRes, categoriesRes] = await Promise.all([
      (supabase.from('orders') as any)
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      (supabase.from('order_items') as any).select('*'),
      (supabase.from('products') as any).select('id, name, is_active, stock').is('deleted_at', null),
      (supabase.from('categories') as any).select('id, name, is_active').is('deleted_at', null),
    ]);

    const allOrders = ordersRes.data || [];
    const allItems = itemsRes.data || [];
    const products = productsRes.data || [];
    const categories = categoriesRes.data || [];

    // Filter orders by period
    const now = Date.now();
    const filteredOrders = allOrders.filter((order: any) => {
      if (period === 'all') return true;
      const orderTime = new Date(order.created_at).getTime();
      const diffMs = now - orderTime;
      if (period === 'today') {
        return diffMs <= 24 * 60 * 60 * 1000;
      }
      if (period === '7days') {
        return diffMs <= 7 * 24 * 60 * 60 * 1000;
      }
      if (period === '30days') {
        return diffMs <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });

    // Compute key metrics
    const paidOrders = filteredOrders.filter(
      (o: any) => o.payment_status === 'paid' || o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped' || o.status === 'packed' || o.status === 'making'
    );

    const totalRevenue = paidOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    const pendingOrders = allOrders.filter((o: any) =>
      ['paid', 'making', 'packed', 'out_for_delivery'].includes(o.status)
    ).length;

    // Items mapped by order ID
    const itemsByOrder: Record<string, any[]> = {};
    for (const it of allItems) {
      if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
      itemsByOrder[it.order_id].push({
        id: it.id,
        productId: it.product_id,
        productName: it.product_name,
        unitPrice: Number(it.unit_price),
        quantity: it.quantity,
        totalPrice: Number(it.unit_price) * Number(it.quantity),
        imageUrl: it.image_url,
      });
    }

    // Recent orders formatted for admin dashboard
    const recentOrders = allOrders.slice(0, 10).map((o: any) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.shipping_full_name || 'Valued Customer',
      customerEmail: o.customer_email || '—',
      shippingPhone: o.shipping_phone || '',
      shippingCity: o.shipping_city || '',
      totalAmount: Number(o.total || 0),
      status: o.status,
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
      items: itemsByOrder[o.id] || [],
    }));

    // Calculate Best Sellers
    const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const order of paidOrders) {
      const orderItems = itemsByOrder[order.id] || [];
      for (const item of orderItems) {
        const key = item.productId || item.productName;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name: item.productName, count: 0, revenue: 0 };
        }
        productSalesMap[key].count += item.quantity;
        productSalesMap[key].revenue += item.totalPrice;
      }
    }
    const bestSellers = Object.values(productSalesMap).sort((a, b) => b.count - a.count);

    // Calculate 7-Day Revenue Trend
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayOrders = allOrders.filter((o: any) => {
        const isPaid = o.payment_status === 'paid' || o.status === 'paid' || o.status === 'delivered';
        return o.created_at.startsWith(dateStr) && isPaid;
      });

      const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      last7Days.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: Math.round(dayRevenue),
        orders: dayOrders.length,
      });
    }

    // Customer analytics
    const customerOrdersCount: Record<string, number> = {};
    for (const o of allOrders) {
      if (o.customer_email) {
        customerOrdersCount[o.customer_email] = (customerOrdersCount[o.customer_email] || 0) + 1;
      }
    }
    const repeatCustomerEmails = Object.keys(customerOrdersCount).filter(
      (email) => customerOrdersCount[email] > 1
    );

    return NextResponse.json(
      {
        success: true,
        period,
        metrics: {
          totalRevenue: Math.round(totalRevenue),
          totalOrders,
          averageOrderValue,
          pendingOrders,
          pendingCustomOrders: 0,
          totalProducts: products.length,
          totalCategories: categories.length,
          repeatCustomersCount: repeatCustomerEmails.length,
          bestSellers,
          revenueTrend: last7Days,
          recentOrders,
        },
      },
      { headers: noCacheHeaders }
    );
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, message: 'Failed to compute live analytics' }, { status: 500 });
  }
}
