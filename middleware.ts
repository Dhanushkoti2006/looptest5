import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // If Supabase environment variables are missing, proceed without crashing
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: getUser() refreshes the auth token and validates it against Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Protected customer routes: /account/* (excluding auth pages), /checkout
  const isAuthRoute =
    pathname.startsWith('/account/auth') ||
    pathname.startsWith('/login');
  const isAccountRoute = pathname.startsWith('/account') && !isAuthRoute;
  const isCheckoutRoute = pathname === '/checkout' || pathname.startsWith('/checkout/');

  if (!user && (isAccountRoute || isCheckoutRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Protected admin routes: /admin/* (excluding /admin/login)
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  if (isAdminRoute) {
    // 1. If a user is logged in via Supabase, strictly verify their admin authorization
    if (user) {
      const userEmail = (user.email || '').toLowerCase();
      if (userEmail === 'callmedhanush777@gmail.com') {
        return supabaseResponse;
      }

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'admin') {
          return supabaseResponse;
        }
      } catch (err) {
        console.error('Middleware profile check error:', err);
      }

      // Logged in user is a customer, NOT an admin!
      // Deny access, wipe any lingering admin cookie, and redirect to login
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('error', 'customer_access_denied');
      const deniedResponse = NextResponse.redirect(redirectUrl);
      deniedResponse.cookies.delete('loop_admin_auth');
      return deniedResponse;
    }

    // 2. If NO Supabase user is logged in, allow standalone master password admin session
    const adminCookie = request.cookies.get('loop_admin_auth')?.value;
    if (adminCookie === 'true') {
      return supabaseResponse;
    }

    // 3. Not authorized - redirect to admin login
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/admin/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image and asset files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
