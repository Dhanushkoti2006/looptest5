'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Send, Sparkles, Shield, Truck, RefreshCw, MessageSquare } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscribed(true);
        setEmail('');
      }
    } catch (err) {
      console.warn('Newsletter error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-brand-900 text-cream-100 pt-16 pb-12 border-t border-brand-800">
      {/* BRAND VALUES STRIP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-8 px-6 bg-brand-800/60 rounded-3xl border border-brand-700/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-700/50 flex items-center justify-center text-cream-200">
              <Sparkles className="w-6 h-6 text-cream-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">100% Handcrafted</h4>
              <p className="text-xs text-cream-300/80">Every stitch is hand-hooked with love</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-700/50 flex items-center justify-center text-cream-200">
              <Truck className="w-6 h-6 text-cream-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">All-India Delivery</h4>
              <p className="text-xs text-cream-300/80">Free express shipping on orders ₹999+</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-700/50 flex items-center justify-center text-cream-200">
              <Shield className="w-6 h-6 text-cream-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">Secure Razorpay Pay</h4>
              <p className="text-xs text-cream-300/80">UPI, Cards, NetBanking, Wallets</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-700/50 flex items-center justify-center text-cream-200">
              <RefreshCw className="w-6 h-6 text-cream-300" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-white text-base">Custom Crochet Studio</h4>
              <p className="text-xs text-cream-300/80">Bespoke bouquets, plushies & gifts</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN FOOTER COLUMNS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-brand-800">
          {/* Brand Info & Logo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand-400">
                <Image
                  src="/images/loop-and-love-logo.jpg"
                  alt="Loop & Love Logo"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-white">LOOP & LOVE</h3>
                <p className="text-xs text-brand-300 tracking-wider uppercase">Handmade with Love, Just for You</p>
              </div>
            </div>
            <p className="text-sm text-cream-200/90 leading-relaxed max-w-sm">
              We create everlasting crochet blooms, charming plush amigurumi, artisanal tote bags, and personalized handmade keepsakes designed to bring warmth, beauty, and joy to your everyday life.
            </p>
            <div className="pt-2 text-xs text-brand-300 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Support: +91 98765 43210 (10 AM - 7 PM)</span>
            </div>
          </div>

          {/* Quick Categories */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white text-base tracking-wide">Handmade Collections</h4>
            <ul className="space-y-2 text-sm text-cream-300/80">
              <li>
                <Link href="/shop?category=flowers-and-bouquets" className="hover:text-white transition-colors">
                  Crochet Flowers & Bouquets
                </Link>
              </li>
              <li>
                <Link href="/shop?category=bags-and-totes" className="hover:text-white transition-colors">
                  Granny Square Bags & Totes
                </Link>
              </li>
              <li>
                <Link href="/shop?category=soft-toys-amigurumi" className="hover:text-white transition-colors">
                  Soft Toys & Amigurumi
                </Link>
              </li>
              <li>
                <Link href="/shop?category=keychains-and-charms" className="hover:text-white transition-colors">
                  Keychains & Bag Charms
                </Link>
              </li>
              <li>
                <Link href="/shop?category=crochet-accessories" className="hover:text-white transition-colors">
                  Hair Scrunchies & Brooches
                </Link>
              </li>
              <li>
                <Link href="/custom-orders" className="text-brand-300 font-semibold hover:text-white transition-colors">
                  ✨ Custom Order Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif font-bold text-white text-base tracking-wide">Customer Care</h4>
            <ul className="space-y-2 text-sm text-cream-300/80">
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  Live Order Tracking
                </Link>
              </li>
              <li>
                <Link href="/account" className="hover:text-white transition-colors">
                  My Profile & Invoices
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Our Story & Craftsmanship
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us & FAQs
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-white transition-colors">
                  Shipping & Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-white transition-colors">
                  Return & Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-white transition-colors">
                  Privacy Policy & Terms
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-white text-base tracking-wide">Join Our Cozy Circle</h4>
            <p className="text-xs text-cream-300/80 leading-relaxed">
              Subscribe for exclusive secret launches, new floral pattern releases, and a 10% welcome coupon!
            </p>
            {subscribed ? (
              <div className="p-3 bg-brand-800 rounded-xl text-xs text-emerald-300 border border-emerald-500/30">
                🎉 Welcome to the Loop & Love family! Check your inbox for code <strong>WELCOME10</strong>.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-brand-800 border border-brand-700 rounded-l-xl focus:outline-none focus:border-brand-400 text-white placeholder-brand-300"
                  />
                  <button
                    type="submit"
                    className="bg-brand-500 hover:bg-brand-400 text-white px-4 rounded-r-xl text-xs font-semibold flex items-center justify-center transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-cream-400/60 block">We respect your inbox. Unsubscribe anytime.</span>
              </form>
            )}
          </div>
        </div>

        {/* BOTTOM COPYRIGHT & PAYMENT BADGES */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-cream-300/70 gap-4">
          <div className="flex items-center gap-1.5">
            <span>© 2026 Loop & Love. Handcrafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>in India. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-cream-400 mr-2">100% Secure Checkout via:</span>
            <span className="px-2 py-1 rounded bg-brand-800 text-[10px] font-semibold text-white">Razorpay</span>
            <span className="px-2 py-1 rounded bg-brand-800 text-[10px] font-semibold text-white">UPI (GPay / PhonePe)</span>
            <span className="px-2 py-1 rounded bg-brand-800 text-[10px] font-semibold text-white">RuPay</span>
            <span className="px-2 py-1 rounded bg-brand-800 text-[10px] font-semibold text-white">Visa / Mastercard</span>
            <span className="px-2 py-1 rounded bg-brand-800 text-[10px] font-semibold text-white">NetBanking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
