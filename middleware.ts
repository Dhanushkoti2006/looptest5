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

  const { pathname } = request.nextUrl;

  // Protected customer routes: /account/* (excluding auth pages), /checkout
  const isAuthRoute =
    pathname.startsWith('/account/auth') ||
    pathname.startsWith('/login');
  const isAccountRoute = pathname.startsWith('/account') && !isAuthRoute;
  const isCheckoutRoute = pathname === '/checkout' || pathname.startsWith('/checkout/');

  // Protected admin routes: /admin/* (excluding /admin/login)
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');

  // Fast path: If route is public, bypass immediately without any expensive auth network call
  if (!isAccountRoute && !isCheckoutRoute && !isAdminRoute) {
    return supabaseResponse;
  }

  // IMPORTANT: getUser() refreshes the auth token and validates it against Supabase
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (isAccountRoute || isCheckoutRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAdminRoute) {
    // If user is completely unauthenticated, redirect to /admin/login
    if (!user) {
      if (pathname === '/admin/login') {
        return supabaseResponse;
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/admin/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Authenticated user: Let request pass to /admin layout.
    // If user profile role !== 'admin', /admin/layout renders the "This account is not an admin" page
    // with "Sign out and switch account" button (avoids redirect loops and silent cookie drops).
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/checkout',
    '/checkout/:path*',
  ],
};
