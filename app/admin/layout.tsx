'use client';

import React from 'react';
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
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout, loginAsAdmin } = useAuth();

  // If on login page, render children directly without admin chrome
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview & Analytics', href: '/admin', icon: LayoutDashboard },
    { label: 'Product & Stock', href: '/admin/products', icon: Package },
    { label: 'Orders & Fulfillment', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Custom Order Studio', href: '/admin/custom-orders', icon: Wand2 },
    { label: 'Database Visibility', href: '/admin/database', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ADMIN TOPBAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border border-brand-400">
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
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="w-7 h-7 rounded-full bg-purple-700 text-white font-bold flex items-center justify-center text-xs">
                {user?.name.charAt(0) || 'A'}
              </div>
              <span className="hidden sm:inline font-medium text-slate-200">{user?.name || 'Administrator'}</span>
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 ${
                  isActive
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
        {!isAdmin && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-900">
            <span>
              ⚠️ You are viewing as a guest or customer. Click to switch to Super Admin mode for full editing privileges:
            </span>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/login"
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-xl"
              >
                Admin Login
              </Link>
              <button
                onClick={loginAsAdmin}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
              >
                Quick Enable
              </button>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
