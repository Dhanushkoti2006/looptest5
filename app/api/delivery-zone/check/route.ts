import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pincode = searchParams.get('pincode')?.trim().replace(/\D/g, '');

    if (!pincode || pincode.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 6-digit Indian PIN code.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: zone, error } = await (supabase.from('delivery_zones') as any)
      .select('*')
      .eq('pincode', pincode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Delivery zone check error:', error);
      return NextResponse.json({ success: false, message: 'Unable to verify pincode at this time.' }, { status: 500 });
    }

    if (!zone) {
      return NextResponse.json({
        success: true,
        served: false,
        message: 'Sorry, we do not currently deliver to this pincode. Enter your email to be notified when delivery opens here!',
      });
    }

    return NextResponse.json({
      success: true,
      served: true,
      zone: {
        zoneName: zone.zone_name,
        pincode: zone.pincode,
        deliveryMethod: zone.delivery_method, // 'local_own' | 'courier_manual'
        deliveryFee: Number(zone.delivery_fee),
        freeAbove: zone.free_above ? Number(zone.free_above) : null,
        estimatedDaysMin: zone.estimated_days_min,
        estimatedDaysMax: zone.estimated_days_max,
      },
    });
  } catch (error) {
    console.error('Pincode check exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
