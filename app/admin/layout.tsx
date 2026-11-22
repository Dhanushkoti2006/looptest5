'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wand2,
  Database,
  ArrowLeft,
  ShieldCheck,
  Bell,
  LogOut,
  ExternalLink,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [checkedAuth, setCheckedAuth] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem('loop_admin_auth') === 'true' ||
        document.cookie.includes('loop_admin_auth=true')
      );
    }
    return false;
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuth =
        localStorage.getItem('loop_admin_auth') === 'true' ||
        document.cookie.includes('loop_admin_auth=true');
      setCheckedAuth(isAuth);
    }
  }, []);

  // Strict authorization:
  // If a user session is active, they MUST be the master admin or have role='admin'.
  // If NO user is logged in, allow the master password admin session (checkedAuth).
  const isAuthorized = user
    ? user.role === 'admin' || user.email?.toLowerCase() === 'callmedhanush777@gmail.com'
    : checkedAuth;

  // Redirect unauthenticated / non-admin users to /admin/login (only if not already on /admin/login)
  React.useEffect(() => {
    if (pathname === '/admin/login') return;
    if (!isLoading && !isAuthorized) {
      router.replace('/admin/login');
    }
  }, [pathname, isLoading, isAuthorized, router]);

  // If on login page, render children directly without admin chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // If loading or not admin, show secure access checkpoint
  if (isLoading && !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4 text-white shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif">Verifying Administrator Access...</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please wait while we verify your admin credentials.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 text-center space-y-4 text-white shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-900/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold font-serif">Restricted Admin Area</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Authentication required. This area is restricted to authorized store administrators only.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" /> Go to Admin Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview & Analytics', href: '/admin', icon: LayoutDashboard },
    { label: 'Hero Banners & Theme', href: '/admin/hero', icon: Sparkles },
    { label: 'Product & Stock', href: '/admin/products', icon: Package },
    { label: 'Orders & Fulfillment', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers & CRM', href: '/admin/customers', icon: Users },
    { label: 'Custom Order Studio', href: '/admin/custom-orders', icon: Wand2 },
    { label: 'Database Visibility', href: '/admin/database', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ADMIN TOPBAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-purple-400">
              <Image src="/images/loop-and-love-logo.jpg" alt="Logo" fill className="object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-white">LOOP & LOVE</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-600 text-[10px] font-bold uppercase tracking-wider text-white">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 text-xs">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <span className="hidden sm:inline font-medium text-slate-200">{user?.name || 'Admin'}</span>
              <button
                onClick={() => {
                  logout();
                  router.push('/admin/login');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-1"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* SUB-NAV BAR */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-2 py-2.5 text-xs font-semibold">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${isActive
                  ? 'bg-purple-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* MAIN ADMIN CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
