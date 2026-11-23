import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      const coupons = db.getCoupons();
      return NextResponse.json({ success: true, coupons });
    }

    const coupon = db.getCouponByCode(code);
    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired coupon code.' }, { status: 404 });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json({ valid: false, message: 'This coupon code has expired.' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, coupon });
  } catch (error) {
    return NextResponse.json({ valid: false, message: 'Coupon validation failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.errorResponse!;
    }

    const body = await req.json();
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate } = body;

    if (!code || !discountValue) {
      return NextResponse.json({ success: false, message: 'Code and discount value required' }, { status: 400 });
    }

    const coupon = db.createCoupon({
      code: code.trim().toUpperCase(),
      discountType: discountType || 'PERCENTAGE',
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiryDate: expiryDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to create coupon' }, { status: 500 });
  }
}
