import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { data: addresses, error } = await (supabase.from('addresses') as any)
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Addresses fetch error:', error);
      return NextResponse.json({ success: false, message: 'Failed to fetch addresses' }, { status: 500 });
    }

    const mapped = (addresses || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      fullName: a.full_name,
      phone: a.phone,
      line1: a.line1 || a.street_address || '',
      line2: a.line2 || a.apartment || '',
      streetAddress: a.line1 || a.street_address || '',
      apartment: a.line2 || a.apartment || '',
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      isDefault: Boolean(a.is_default),
      createdAt: a.created_at,
    }));

    return NextResponse.json({ success: true, addresses: mapped });
  } catch (error) {
    console.error('Addresses GET exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fullName, phone, line1, line2, streetAddress, apartment, city, state, pincode, isDefault } = body;

    const street = line1 || streetAddress;
    const apt = line2 || apartment || '';

    if (!fullName || !phone || !street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, message: 'Full name, phone, line 1, city, state, and pincode are required.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // If setting as default, unset previous default
    if (isDefault) {
      await (adminSupabase.from('addresses') as any)
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data: newAddress, error } = await (adminSupabase.from('addresses') as any)
      .insert({
        user_id: user.id,
        full_name: fullName.trim(),
        phone: phone.trim(),
        line1: street.trim(),
        line2: apt.trim(),
        street_address: street.trim(),
        apartment: apt.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: String(pincode).trim().replace(/\D/g, ''),
        is_default: Boolean(isDefault),
      })
      .select()
      .single();

    if (error || !newAddress) {
      console.error('Address creation error:', error);
      return NextResponse.json({ success: false, message: 'Failed to save address' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Address saved successfully.',
      address: {
        id: newAddress.id,
        userId: newAddress.user_id,
        fullName: newAddress.full_name,
        phone: newAddress.phone,
        line1: newAddress.line1,
        line2: newAddress.line2,
        streetAddress: newAddress.line1,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        isDefault: newAddress.is_default,
      },
    });
  } catch (error) {
    console.error('Address POST exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get('id');

    if (!addressId) {
      return NextResponse.json({ success: false, message: 'Address ID required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Soft-delete: update is_active = false and deleted_at = NOW()
    const adminSupabase = createAdminClient();
    const { error } = await (adminSupabase.from('addresses') as any)
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', addressId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ success: false, message: 'Failed to delete address' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Address removed successfully.' });
  } catch (error) {
    console.error('Address DELETE exception:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
