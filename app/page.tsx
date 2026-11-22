import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import HeroSlideshow from '@/components/HeroSlideshow';
import { getActiveCategories, getActiveProducts } from '@/lib/supabase/queries';
import {
  Sparkles,
  ArrowRight,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Scissors,
  CheckCircle2,
  Instagram,
  Wand2,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [categories, allProducts, fetchedFeatured] = await Promise.all([
    getActiveCategories(),
    getActiveProducts({ limit: 16 }),
    getActiveProducts({ isFeatured: true, limit: 8 }),
  ]);

  // If no products were explicitly flagged as featured, showcase latest active products
  const featuredProducts = fetchedFeatured.length > 0 ? fetchedFeatured : allProducts.slice(0, 8);
  const trendingProducts = allProducts.length > 0 ? allProducts.slice(0, 8) : [];

  return (
    <div className="space-y-12 sm:space-y-20 pb-16">
      {/* 1. HERO SLIDESHOW */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <HeroSlideshow />
      </section>

      {/* 2. VALUES / TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 p-4 sm:p-8 bg-white rounded-2xl sm:rounded-3xl border border-canvas-border shadow-cozy text-center">
          <div className="space-y-1.5 sm:space-y-2 flex flex-col items-center p-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-900">100% Handcrafted</h4>
            <p className="text-[11px] sm:text-xs text-gray-500">Every single stitch hooked by skilled women artisans</p>
          </div>

          <div className="space-y-1.5 sm:space-y-2 flex flex-col items-center p-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-900">Premium Milk Cotton</h4>
            <p className="text-[11px] sm:text-xs text-gray-500">Ultra-soft, colorfast, hypoallergenic yarn</p>
          </div>

          <div className="space-y-1.5 sm:space-y-2 flex flex-col items-center p-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-900">All India Delivery</h4>
            <p className="text-[11px] sm:text-xs text-gray-500">Free express delivery on prepaid orders ₹999+</p>
          </div>

          <div className="space-y-1.5 sm:space-y-2 flex flex-col items-center p-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-900">Secure Payments</h4>
            <p className="text-[11px] sm:text-xs text-gray-500">Instant UPI, Cards & NetBanking via Razorpay</p>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SHOWCASE */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-brand-500">
              Artisanal Collections
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900 mt-1">
              Shop by Category
            </h3>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 self-start sm:self-auto group"
          >
            Explore All Collections <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-canvas-border text-xs text-gray-400">
            Categories are being woven. Check back shortly!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                href={`/shop?category=${cat.slug || cat.id}`}
                className="group relative bg-white rounded-2xl sm:rounded-3xl border border-canvas-border hover:border-brand-300 p-3 sm:p-4 shadow-cozy hover:shadow-cozy-lg transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl overflow-hidden mb-2 sm:mb-3 bg-brand-50 group-hover:scale-105 transition-transform duration-300">
                  <Image
                    src={cat.imageUrl || '/images/loop-and-love-logo.jpg'}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 14vw"
                    className="object-cover"
                  />
                </div>
                <h4 className="font-serif font-bold text-xs sm:text-sm text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-tight">
                  {cat.name}
                </h4>
                <span className="text-[10px] text-gray-400 mt-1">Explore →</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. FEATURED CREATIONS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-brand-500">
              Curated Highlights
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900 mt-1">
              Featured Handcrafted Pieces
            </h3>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 self-start sm:self-auto group"
          >
            View Full Boutique ({allProducts.length}) <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-canvas-border space-y-2">
            <Sparkles className="w-8 h-8 text-brand-400 mx-auto" />
            <h4 className="font-serif font-bold text-base text-brand-900">New Creations Coming Soon</h4>
            <p className="text-xs text-gray-500">Our artisans are hand-stitching new pieces for this collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 5. BESPOKE CUSTOM ORDERS CALLOUT */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-purple-950 text-white p-6 sm:p-12 shadow-cozy-lg">
          <div className="relative z-10 max-w-xl space-y-3 sm:space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-200/20 backdrop-blur-md text-cream-200 text-xs font-bold tracking-wide">
              <Wand2 className="w-3.5 h-3.5 text-cream-300" /> Bespoke Studio
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold leading-tight">
              Have a Specific Vision in Mind? We Can Hook It!
            </h3>
            <p className="text-xs sm:text-sm text-cream-100/90 leading-relaxed">
              Custom bridal flower bouquets that last forever, personalized pet amigurumi keepsakes, cozy home decor accents, or bespoke keychains. Share your color palette and reference photos with our master artisans.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/custom-orders"
                className="px-6 py-3 sm:px-7 sm:py-3.5 rounded-full bg-cream-200 hover:bg-white text-brand-900 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Design Your Custom Piece →
              </Link>
              <Link
                href="/about"
                className="text-xs font-bold text-cream-200 hover:text-white underline underline-offset-4"
              >
                Meet the Artisans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRENDING / BESTSELLERS */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2 sm:gap-4">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-brand-500">
              Customer Favorites
            </span>
            <h3 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900 mt-1">
              Trending & Loved Across India
            </h3>
          </div>
          <Link
            href="/shop"
            className="text-xs font-bold text-brand-600 hover:text-brand-800 flex items-center gap-1 self-start sm:self-auto group"
          >
            Browse All ({allProducts.length}) <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {trendingProducts.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-canvas-border text-xs text-gray-400">
            No products currently in stock. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
