import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  email?: string;
  errorResponse?: NextResponse;
}

/**
 * Strict server-side administrator authorization guard.
 * Requires:
 * 1. An authenticated Supabase session (validated via auth.getUser()).
 * 2. An explicit database profile with role = 'admin'.
 * 
 * Strict constraints:
 * - NO loop_admin_auth cookie fallback.
 * - NO hardcoded email bypass.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        authorized: false,
        errorResponse: NextResponse.json(
          { success: false, message: 'Authentication required. Please sign in.' },
          { status: 401 }
        ),
      };
    }

    const { data: profile, error: profileError } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError || profile?.role !== 'admin') {
      return {
        authorized: false,
        userId: user.id,
        email: user.email,
        errorResponse: NextResponse.json(
          { success: false, message: 'Unauthorized. Store administrator privileges required.' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId: user.id,
      email: user.email,
    };
  } catch (err: any) {
    console.error('requireAdmin exception:', err);
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        { success: false, message: 'Internal server error verifying administrator privileges.' },
        { status: 500 }
      ),
    };
  }
}
