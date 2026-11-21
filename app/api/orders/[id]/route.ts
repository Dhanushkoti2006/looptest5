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

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch order' }, { status: 500 });
  }
}
