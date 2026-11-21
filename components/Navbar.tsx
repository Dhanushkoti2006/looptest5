'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  LogOut,
  Package,
  Wand2,
} from 'lucide-react';

export default function Navbar() {
  const { cart, wishlist } = useCart();
  const { user, isAdmin, logout, loginAsAdmin, loginAsCustomer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-brand-900 text-cream-200 text-xs font-medium py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-1">
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-cream-400 animate-pulse" />
            <span>🌸 <strong>Free Handcrafted Gift Box</strong> on orders above ₹999 • All India Express Delivery</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-cream-300">
            <span>✨ 100% Handcrafted with Milk Cotton</span>
            <span className="hidden md:inline">•</span>
            <Link href="/custom-orders" className="hover:text-white underline underline-offset-2 hidden md:inline">
              Request Custom Crochet
            </Link>
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-canvas-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-brand-900 hover:text-brand-600 focus:outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* BRAND LOGO */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative w-12 h-12 rounded-full overflow-hidden shadow-sm border border-brand-200 group-hover:scale-105 transition-transform">
                  <Image
                    src="/images/loop-and-love-logo.jpg"
                    alt="Loop & Love Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-2xl font-bold tracking-tight text-brand-900 group-hover:text-brand-600 transition-colors">
                    LOOP & LOVE
                  </span>
                  <span className="text-[10px] tracking-widest text-brand-500 uppercase font-medium">
                    Handmade Crochet Boutique
                  </span>
                </div>
              </Link>
            </div>

            {/* DESKTOP NAV LINKS */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                Home
              </Link>
              <Link href="/shop" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                Shop All
              </Link>
              <Link href="/shop?category=flowers-and-bouquets" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                Flowers & Bouquets
              </Link>
              <Link href="/shop?category=bags-and-totes" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                Bags
              </Link>
              <Link href="/custom-orders" className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-full hover:bg-brand-100 transition-all border border-brand-200">
                <Wand2 className="w-3.5 h-3.5 text-brand-500" />
                Custom Orders
              </Link>
              <Link href="/about" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                About Us
              </Link>
              <Link href="/contact" className="text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors">
                Contact
              </Link>
            </nav>

            {/* RIGHT ICONS & SEARCH */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="hidden md:flex relative items-center">
                <input
                  type="text"
                  placeholder="Search bouquets, bags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 lg:w-60 pl-9 pr-4 py-1.5 text-xs bg-canvas-subtle border border-canvas-border rounded-full focus:outline-none focus:border-brand-400 focus:bg-white transition-all text-brand-900"
                />
                <Search className="w-4 h-4 text-brand-400 absolute left-3 pointer-events-none" />
              </form>

              {/* Wishlist Icon */}
              <Link
                href="/shop?wishlist=true"
                className="relative p-2 text-brand-900 hover:text-rose-500 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link
                href="/cart"
                className="relative p-2 text-brand-900 hover:text-brand-600 transition-colors"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-full hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-semibold text-xs border border-brand-200">
                    {user ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-brand-600 hidden sm:block" />
                </button>

                {accountDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-cozy-lg border border-brand-100 py-3 px-2 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setAccountDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-canvas-border mb-2">
                      <p className="font-semibold text-brand-900 text-sm">{user ? user.name : 'Welcome, Guest!'}</p>
                      <p className="text-gray-500 truncate">{user ? user.email : 'Sign in to access your orders'}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" /> Store Admin
                        </span>
                      )}
                    </div>

                    {user ? (
                      <>
                        <Link
                          href="/account"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-brand-50 text-brand-900"
                        >
                          <User className="w-4 h-4 text-brand-500" /> My Profile & Orders
                        </Link>
                        <Link
                          href="/track-order"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-brand-50 text-brand-900"
                        >
                          <Package className="w-4 h-4 text-brand-500" /> Track My Order
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setAccountDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-brand-50 text-brand-800 font-semibold my-1 hover:bg-brand-100"
                          >
                            <ShieldCheck className="w-4 h-4 text-brand-600" /> Admin Dashboard
                          </Link>
                        )}
                        <div className="border-t border-canvas-border my-2 pt-2">
                          <button
                            onClick={() => {
                              logout();
                              setAccountDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <LogOut className="w-4 h-4" /> Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <Link
                        href="/login"
                        onClick={() => setAccountDropdownOpen(false)}
                        className="block w-full text-center bg-brand-800 text-white font-medium py-2 rounded-xl hover:bg-brand-900 transition-colors"
                      >
                        Login with Email OTP
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-canvas-border bg-white px-4 pt-3 pb-6 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative mb-3">
              <input
                type="text"
                placeholder="Search bouquets, bags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
              />
              <Search className="w-4 h-4 text-brand-400 absolute left-3 top-3" />
            </form>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                🏠 Home
              </Link>
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                🛍️ Shop All
              </Link>
              <Link
                href="/shop?category=flowers-and-bouquets"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                💐 Flowers
              </Link>
              <Link
                href="/shop?category=bags-and-totes"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                👜 Bags
              </Link>
              <Link
                href="/custom-orders"
                onClick={() => setMobileMenuOpen(false)}
                className="col-span-2 p-2.5 rounded-xl bg-brand-100 text-brand-900 font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-600" /> Request Custom Crochet
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                📦 Track Order
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-canvas-subtle text-brand-900 font-medium"
              >
                👤 My Account
              </Link>
            </div>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center p-3 rounded-xl bg-purple-700 text-white font-semibold"
              >
                🛡️ Open Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
