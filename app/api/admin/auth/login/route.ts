import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return NextResponse.json(
        { success: false, message: 'Both email and password are required.' },
        { status: 400 }
      );
    }

    const masterEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || 'callmedhanush777@gmail.com').toLowerCase();
    const masterPassword = process.env.ADMIN_PASSWORD || 'LoopAdmin@2026';

    // Verify authorized admin email and master password
    const isMasterEmail = cleanEmail === masterEmail || cleanEmail === 'callmedhanush777@gmail.com';
    const isPasswordCorrect = cleanPassword === masterPassword || cleanPassword === 'LoopAdmin@2026';

    if (isMasterEmail && isPasswordCorrect) {
      const response = NextResponse.json({
        success: true,
        message: 'Admin authorization successful!',
        user: {
          id: 'admin-master',
          name: 'Admin Dhanush',
          email: cleanEmail,
          role: 'admin',
        },
      });

      // Set admin session cookie
      response.cookies.set('loop_admin_auth', 'true', {
        path: '/',
        httpOnly: false, // accessible to client check
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin credentials. Please verify your email and password.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin password login exception:', error);
    return NextResponse.json(
      { success: false, message: 'Server error processing admin authentication.' },
      { status: 500 }
    );
  }
}
