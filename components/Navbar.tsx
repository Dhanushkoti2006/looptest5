'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const { user, isAdmin, logout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

  // Dynamic Announcement Bar
  const [announcement, setAnnouncement] = useState({
    text: '🧶 Fast 1–2 Day Delivery Across Tamil Nadu! Outside TN? DM us on Instagram @loop__nd__love ✨',
    secondary_text: '✨ 100% Milk Cotton',
    link_text: 'Request Custom Crochet',
    link_url: '/custom-orders',
    bg_color: '#2E1D36',
    text_color: '#FBF5E5',
    is_active: true,
  });

  useEffect(() => {
    fetch('/api/announcement', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.announcement) {
          setAnnouncement(data.announcement);
        }
      })
      .catch(() => {});
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Body scroll lock for mobile menu and search overlay
  useEffect(() => {
    if (mobileMenuOpen || searchModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, searchModalOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setMobileMenuOpen(false);
        setAccountDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchModalOpen(false);
      setMobileMenuOpen(false);
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {announcement.is_active && (
        <div
          style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
          className="text-[11px] sm:text-xs font-medium py-2 px-3 sm:px-4 transition-colors"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-4">
            <div className="flex items-center justify-center md:justify-start gap-2 w-full md:w-auto text-center md:text-left">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cream-400 shrink-0 animate-pulse" />
              <span className="leading-snug break-words">
                {announcement.text}
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-[11px] opacity-90 shrink-0">
              {announcement.secondary_text && <span>{announcement.secondary_text}</span>}
              {announcement.secondary_text && announcement.link_text && <span>•</span>}
              {announcement.link_text && (
                <Link
                  href={announcement.link_url || '/custom-orders'}
                  className="hover:opacity-100 underline underline-offset-2 whitespace-nowrap"
                >
                  {announcement.link_text}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN HEADER - Fixed height: 56px mobile, 64px tablet, 68px desktop */}
      <header className="sticky top-0 z-50 bg-white border-b border-canvas-border shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 lg:h-[68px] flex items-center justify-between gap-2 sm:gap-4">

          {/* LEFT: Mobile Menu Button + Brand Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger button (below 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 text-brand-900 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Brand Logo & Name */}
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-[40px] shrink-0">
                <Image
                  src="/images/loop-and-love-logo.jpg"
                  alt="Loop & Love"
                  fill
                  sizes="40px"
                  className="object-contain rounded-full border border-brand-100 group-hover:scale-105 transition-transform"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg lg:text-xl text-brand-900 tracking-tight whitespace-nowrap group-hover:text-brand-700 transition-colors">
                  LOOP &amp; LOVE
                </span>
                <span className="hidden xl:inline text-[11px] text-brand-500 font-medium pl-2.5 border-l border-brand-200 whitespace-nowrap">
                  Handmade with Love, Crafted to Last
                </span>
              </div>
            </Link>
          </div>

          {/* CENTER: Desktop Nav Links (1024px and up) */}
          <nav className="hidden lg:flex items-center space-x-3.5 xl:space-x-5">
            <Link
              href="/"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Shop
            </Link>
            <Link
              href="/shop/keychains-and-charms"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Keychains
            </Link>
            <Link
              href="/shop/toys"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Toys
            </Link>
            <Link
              href="/shop/flower-bouquets"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Bouquets
            </Link>
            <Link
              href="/custom-orders"
              className="inline-flex items-center gap-1 text-[12px] xl:text-xs font-semibold text-brand-800 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-full transition-all border border-brand-200 whitespace-nowrap"
            >
              <Wand2 className="w-3 h-3 text-brand-600" />
              Custom Orders
            </Link>
            <Link
              href="/about"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[13px] xl:text-sm font-medium text-brand-900 hover:text-brand-600 transition-colors whitespace-nowrap"
            >
              Contact
            </Link>
          </nav>

          {/* RIGHT: Search, Wishlist, Cart, Account */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Inline search bar (1280px and up) */}
            <form onSubmit={handleSearchSubmit} className="hidden xl:flex relative items-center">
              <input
                type="text"
                placeholder="Search creations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-40 2xl:w-52 pl-8 pr-3 py-1.5 text-xs bg-canvas-subtle border border-canvas-border rounded-full focus:outline-none focus:border-brand-400 focus:bg-white transition-all text-brand-900"
                aria-label="Search creations"
              />
              <Search className="w-3.5 h-3.5 text-brand-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Search Icon Button (below 1280px) */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="xl:hidden p-1.5 sm:p-2 text-brand-900 hover:text-brand-600 transition-colors rounded-full focus:outline-none"
              aria-label="Search creations"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <Link
              href="/shop?wishlist=true"
              className="relative p-1.5 sm:p-2 text-brand-900 hover:text-rose-500 transition-colors rounded-full"
              aria-label="View wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Link */}
            <Link
              href="/cart"
              className="relative p-1.5 sm:p-2 text-brand-900 hover:text-brand-600 transition-colors rounded-full"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account / Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                className="flex items-center gap-1 p-1 rounded-full hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-colors"
                aria-label="Account menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-800 font-semibold text-xs border border-brand-200">
                  {user ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <ChevronDown className="w-3 h-3 text-brand-600 hidden sm:block" />
              </button>

              {accountDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-cozy-lg border border-brand-100 py-3 px-2 z-50 text-xs animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setAccountDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-canvas-border mb-2">
                    <p className="font-semibold text-brand-900 text-sm truncate">
                      {user ? user.name : 'Welcome, Guest!'}
                    </p>
                    <p className="text-gray-500 truncate">
                      {user ? user.email : 'Sign in to access your orders'}
                    </p>
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
                        <User className="w-4 h-4 text-brand-500" /> My Profile &amp; Orders
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
      </header>

      {/* 3. SEARCH MODAL OVERLAY (Below 1280px or click on search icon) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          {/* Backdrop click to dismiss */}
          <div className="fixed inset-0" onClick={() => setSearchModalOpen(false)} />

          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-brand-100 p-4 sm:p-6 z-10 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between pb-3 border-b border-canvas-border">
              <div className="flex items-center gap-2 text-brand-900 font-serif font-bold text-base sm:text-lg">
                <Search className="w-5 h-5 text-brand-600" /> Search Creations
              </div>
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-brand-900 hover:bg-brand-50 rounded-full transition-colors"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="mt-4">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search keychains, toys, bouquets, coasters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-24 py-3 text-sm bg-canvas-subtle border border-canvas-border rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white text-brand-900"
                />
                <Search className="w-5 h-5 text-brand-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <button
                  type="submit"
                  className="absolute right-2 top-2 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Quick Filter Categories */}
            <div className="mt-4 pt-3 border-t border-canvas-border">
              <p className="text-[11px] font-semibold text-brand-500 uppercase tracking-wider mb-2">
                Popular Categories
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Keychains & Charms', href: '/shop/keychains-and-charms' },
                  { name: 'Handmade Toys', href: '/shop/toys' },
                  { name: 'Flower Bouquets', href: '/shop/flower-bouquets' },
                  { name: 'Bookmarks', href: '/shop/bookmarks' },
                  { name: 'Home Decor', href: '/shop/home-decor-crochets' },
                  { name: 'Coasters', href: '/shop/coasters' },
                ].map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setSearchModalOpen(false)}
                    className="text-xs px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-800 rounded-full border border-brand-100 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MOBILE HAMBURGER DRAWER (Below 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer container with safe-area insets */}
          <div className="relative w-4/5 max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] animate-in slide-in-from-left duration-200">

            {/* Drawer Header */}
            <div className="p-4 border-b border-canvas-border flex items-center justify-between">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-brand-100 shrink-0">
                  <Image
                    src="/images/loop-and-love-logo.jpg"
                    alt="Loop & Love"
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <span className="font-serif font-bold text-base text-brand-900 tracking-tight">
                  LOOP &amp; LOVE
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:text-brand-900 hover:bg-brand-50 rounded-full transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search keychains, toys, bouquets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 text-brand-900"
                />
                <Search className="w-4 h-4 text-brand-400 absolute left-3 top-2.5 pointer-events-none" />
              </form>

              {/* Navigation Links Grid */}
              <div>
                <p className="text-[11px] font-bold text-brand-400 uppercase tracking-wider mb-2">
                  Navigation
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🏠 Home
                  </Link>
                  <Link
                    href="/shop"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🛍️ Shop All
                  </Link>
                  <Link
                    href="/shop/keychains-and-charms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🔑 Keychains
                  </Link>
                  <Link
                    href="/shop/toys"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🧸 Toys
                  </Link>
                  <Link
                    href="/shop/flower-bouquets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    💐 Bouquets
                  </Link>
                  <Link
                    href="/shop/bookmarks"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🔖 Bookmarks
                  </Link>
                  <Link
                    href="/shop/home-decor-crochets"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🏡 Home Decor
                  </Link>
                  <Link
                    href="/shop/crochet-accessories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium transition-colors"
                  >
                    🎀 Accessories
                  </Link>
                  <Link
                    href="/shop/coasters"
                    onClick={() => setMobileMenuOpen(false)}
                    className="col-span-2 p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium text-center transition-colors"
                  >
                    ☕ Coasters &amp; Mug Rugs
                  </Link>
                  <Link
                    href="/custom-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="col-span-2 p-2.5 rounded-xl bg-brand-100 hover:bg-brand-200 text-brand-900 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-brand-600" /> Request Custom Crochet
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium text-center transition-colors"
                  >
                    📖 About Us
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2.5 rounded-xl bg-canvas-subtle hover:bg-brand-50 text-brand-900 font-medium text-center transition-colors"
                  >
                    📞 Contact
                  </Link>
                </div>
              </div>

              {/* Account Links */}
              <div className="pt-2 border-t border-canvas-border">
                <p className="text-[11px] font-bold text-brand-400 uppercase tracking-wider mb-2">
                  Account &amp; Orders
                </p>
                <div className="space-y-1.5 text-xs">
                  <Link
                    href="/track-order"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-brand-50 text-brand-900 font-medium"
                  >
                    <Package className="w-4 h-4 text-brand-600" /> Track My Order
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-brand-50 text-brand-900 font-medium"
                  >
                    <User className="w-4 h-4 text-brand-600" /> My Account &amp; History
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold transition-colors mt-2"
                    >
                      <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}
