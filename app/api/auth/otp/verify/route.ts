import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { target, code, type = 'LOGIN', name, phone } = await req.json();

    // Normalise target (trim spaces and collapse internal whitespace)
    const cleanTarget = target.trim().replace(/\s+/g, '');
    if (!cleanTarget || !code) {
      return NextResponse.json(
        { success: false, message: 'Target and OTP are required.' },
        { status: 400 }
      );
    }

    const verification = db.verifyOTP(cleanTarget, code.trim(), type);
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, message: verification.message },
        { status: 400 }
      );
    }

    // Auto‑register if user does not exist
    let user =
      db.getUserByEmail(cleanTarget) || db.getUserByPhone(cleanTarget);
    if (!user) {
      const isEmail = cleanTarget.includes('@');
      user = db.createUser({
        name:
          name || (isEmail ? cleanTarget.split('@')[0] : 'Handmade Lover'),
        email: isEmail
          ? cleanTarget
          : `${cleanTarget.replace(/\D/g, '')}@loopandlove.customer`,
        phone: !isEmail ? cleanTarget : phone || '+91 99999 00000',
        role:
          cleanTarget.toLowerCase() === 'admin@loopandlove.com'
            ? 'SUPER_ADMIN'
            : 'CUSTOMER',
        isEmailVerified: isEmail,
        isPhoneVerified: !isEmail,
      });
    }

    // Create a simple session token (replace with JWT in prod)
    const token = db.createSessionToken(user.id);

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
      user,
    });
    // HttpOnly cookie for auth
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return response;
  } catch (error) {
    console.error('OTP Verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Verification processing error.' },
      { status: 500 }
    );
  }
}

