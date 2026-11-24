import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  checkTamilNaduPincode,
  lookupIndiaPostPincode,
} from '@/lib/delivery/tamilNaduPincodes';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawPincode = searchParams.get('pincode') || '';
    const cleanPincode = rawPincode.trim().replace(/\D/g, '');

    if (!cleanPincode || cleanPincode.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid 6-digit Indian PIN code.' },
        { status: 400 }
      );
    }

    // 1. Initial synchronous Tamil Nadu format & Puducherry exclusion validation
    const localCheck = checkTamilNaduPincode(cleanPincode);
    if (!localCheck.served) {
      return NextResponse.json({
        success: true,
        served: false,
        message: localCheck.message,
      });
    }

    // 2. Query India Post free API for exact District & Postal Office verification
    const postLookup = await lookupIndiaPostPincode(cleanPincode);
    if (!postLookup.isTamilNadu) {
      return NextResponse.json({
        success: true,
        served: false,
        message: 'Sorry, we currently deliver only within Tamil Nadu.',
      });
    }

    // 3. Check if an explicit override exists in Supabase delivery_zones
    let customZone: any = null;
    try {
      const supabase = await createClient();
      const { data } = await (supabase.from('delivery_zones') as any)
        .select('*')
        .eq('pincode', cleanPincode)
        .eq('is_active', true)
        .maybeSingle();
      if (data) customZone = data;
    } catch (_) {}

    const resolvedDistrict = postLookup.district || localCheck.zone?.district || 'Tamil Nadu';
    const resolvedCity = postLookup.city || resolvedDistrict;

    const finalZone = customZone
      ? {
          zoneName: customZone.zone_name,
          pincode: customZone.pincode,
          district: resolvedDistrict,
          state: 'Tamil Nadu',
          city: resolvedCity,
          deliveryMethod: customZone.delivery_method, // 'local_own' | 'courier_manual'
          deliveryFee: Number(customZone.delivery_fee),
          freeAbove: customZone.free_above ? Number(customZone.free_above) : 999,
          estimatedDaysMin: customZone.estimated_days_min,
          estimatedDaysMax: customZone.estimated_days_max,
        }
      : {
          ...localCheck.zone!,
          district: resolvedDistrict,
          city: resolvedCity,
        };

    return NextResponse.json({
      success: true,
      served: true,
      city: resolvedCity,
      district: resolvedDistrict,
      state: 'Tamil Nadu',
      zone: finalZone,
      message: finalZone.deliveryMethod === 'local_own'
        ? `✓ Handcrafted Local Delivery in Chennai (${cleanPincode}) • Est. ${finalZone.estimatedDaysMin}–${finalZone.estimatedDaysMax} business days`
        : `✓ Express Delivery to ${resolvedDistrict} (${cleanPincode}) • Est. ${finalZone.estimatedDaysMin}–${finalZone.estimatedDaysMax} business days`,
    });
  } catch (error) {
    console.error('Pincode check exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
