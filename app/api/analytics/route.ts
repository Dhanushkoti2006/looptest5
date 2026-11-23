import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }
    const { searchParams } = new URL(req.url);
    const period = (searchParams.get('period') as 'today' | '7days' | '30days' | 'all') || 'all';
    const viewRawTable = searchParams.get('table');

    // If admin requested raw database table inspection
    if (viewRawTable) {
      if (viewRawTable === 'users') {
        return NextResponse.json({ success: true, table: 'users', records: db.getUsers() });
      }
      if (viewRawTable === 'products') {
        return NextResponse.json({ success: true, table: 'products', records: db.getProducts() });
      }
      if (viewRawTable === 'orders') {
        return NextResponse.json({ success: true, table: 'orders', records: db.getOrders() });
      }
      if (viewRawTable === 'customOrders') {
        return NextResponse.json({ success: true, table: 'customOrders', records: db.getCustomOrders() });
      }
      if (viewRawTable === 'coupons') {
        return NextResponse.json({ success: true, table: 'coupons', records: db.getCoupons() });
      }
      if (viewRawTable === 'notifications') {
        return NextResponse.json({ success: true, table: 'notifications', records: db.getNotifications() });
      }
    }

    const analytics = db.getAnalytics(period);
    const products = db.getProducts();
    const orders = db.getOrders();
    const categories = db.getCategories();
    const users = db.getUsers();

    // Calculate product sales rank
    const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const order of orders) {
      if (order.paymentStatus === 'SUCCESS') {
        for (const item of order.items) {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = { name: item.productName, count: 0, revenue: 0 };
          }
          productSalesMap[item.productId].count += item.quantity;
          productSalesMap[item.productId].revenue += item.totalPrice;
        }
      }
    }

    const bestSellers = Object.values(productSalesMap).sort((a, b) => b.count - a.count);

    // Calculate daily revenue trend (last 7 days)
    const last7Days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter(
        (o) => o.createdAt.startsWith(dateStr) && o.paymentStatus === 'SUCCESS'
      );
      const dayRev = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      last7Days.push({
        date: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        revenue: Math.round(dayRev),
        orders: dayOrders.length,
      });
    }

    // Customer analytics
    const customerOrdersCount: Record<string, number> = {};
    for (const order of orders) {
      customerOrdersCount[order.customerEmail] = (customerOrdersCount[order.customerEmail] || 0) + 1;
    }
    const repeatCustomerEmails = Object.keys(customerOrdersCount).filter(
      (email) => customerOrdersCount[email] > 1
    );

    return NextResponse.json({
      success: true,
      period,
      metrics: {
        ...analytics,
        totalProducts: products.length,
        totalCategories: categories.length,
        repeatCustomersCount: repeatCustomerEmails.length,
        bestSellers,
        revenueTrend: last7Days,
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ success: false, message: 'Failed to compute analytics' }, { status: 500 });
  }
}
