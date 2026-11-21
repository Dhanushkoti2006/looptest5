import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const cookieStore = cookies();
    const adminCookie = cookieStore.get('loop_admin_auth')?.value;

    let isAuthorized = adminCookie === 'true';

    if (!isAuthorized) {
      try {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          if (user.email?.toLowerCase() === 'callmedhanush777@gmail.com') {
            isAuthorized = true;
          } else {
            const { data: profile } = await (supabase.from('profiles') as any)
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.role === 'admin') {
              isAuthorized = true;
            }
          }
        }
      } catch (authErr) {
        console.warn('Customer API auth check warning:', authErr);
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Admin role required.' },
        { status: 403 }
      );
    }

    // Service role client - runs server-side only, never exposed to client
    const adminSupabase = createAdminClient();

    // 1. Fetch all profiles
    const { data: profiles, error: profilesError } = await (adminSupabase.from('profiles') as any)
      .select('id, full_name, phone, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching customer profiles:', profilesError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch customer profiles.' },
        { status: 500 }
      );
    }

    // 2. Fetch orders to aggregate order metrics
    const { data: orders } = await (adminSupabase.from('orders') as any)
      .select('id, user_id, total, status, payment_status, created_at, customer_email, shipping_phone, shipping_full_name');

    // Build metric maps
    const orderCountMap: Record<string, number> = {};
    const totalSpendMap: Record<string, number> = {};
    const lastOrderDateMap: Record<string, string> = {};
    const userEmailMap: Record<string, string> = {};

    if (orders && Array.isArray(orders)) {
      for (const ord of orders) {
        if (ord.user_id) {
          orderCountMap[ord.user_id] = (orderCountMap[ord.user_id] || 0) + 1;

          if (ord.payment_status === 'paid' || ord.status !== 'cancelled') {
            totalSpendMap[ord.user_id] = (totalSpendMap[ord.user_id] || 0) + (Number(ord.total) || 0);
          }

          if (
            !lastOrderDateMap[ord.user_id] ||
            new Date(ord.created_at) > new Date(lastOrderDateMap[ord.user_id])
          ) {
            lastOrderDateMap[ord.user_id] = ord.created_at;
          }

          if (ord.customer_email && !userEmailMap[ord.user_id]) {
            userEmailMap[ord.user_id] = ord.customer_email;
          }
        }
      }
    }

    // 3. Assemble customer list
    const customers = (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Customer',
      email: userEmailMap[p.id] || (p.role === 'admin' ? 'callmedhanush777@gmail.com' : 'Verified Customer'),
      phone: p.phone || '',
      role: p.role || 'customer',
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      orderCount: orderCountMap[p.id] || 0,
      totalSpend: totalSpendMap[p.id] || 0,
      lastOrderDate: lastOrderDateMap[p.id] || null,
    }));

    return NextResponse.json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error('Customer API exception:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error processing customer directory.' },
      { status: 500 }
    );
  }
}
