'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Scissors,
  CheckCircle2,
  Instagram,
  Wand2,
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState([
    {
      title: 'Handmade with Love, Crafted to Last.',
      subtitle: 'Everlasting blooms, cozy artisan totes, and bespoke amigurumi keepsakes stitched with utmost tenderness.',
      badge: '✨ Artisanal Crochet Collection 2026',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
    {
      title: 'Bring Your Dream Crochet Idea to Life',
      subtitle: 'Custom bridal flowers, anniversary gifts, or your favorite plush character crafted exactly to your vision.',
      badge: '🌸 Bespoke Custom Order Studio',
      ctaText: 'Design Custom Order',
      ctaLink: '/custom-orders',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
    {
      title: 'Sweet Companions & Soft Amigurumi',
      subtitle: 'Gentle, hypoallergenic milk cotton toys stitched for pure cuddles and nursery warmth.',
      badge: '🧸 Baby Safe & Handcrafted',
      ctaText: 'Shop Soft Toys',
      ctaLink: '/shop?category=soft-toys-amigurumi',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    },
  ]);

  useEffect(() => {
    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.hero?.slides && data.hero.slides.length > 0) {
          setHeroSlides(data.hero.slides);
        }
      })
      .catch((err) => console.error('Error fetching hero banner:', err));

    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
        }
      })
      .catch((err) => console.error('Error fetching products:', err));

    fetch('/api/categories', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Auto advance hero slideshow every 6s
  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured);
  const bestsellers = products.filter((p) => p.isBestseller);
  const newArrivals = products.filter((p) => p.isNewArrival);

  // Homepage product showcase: if specific products are selected as featured, show only those!
  // Otherwise fall back to latest products
  const displayFeatured = featuredProducts.length > 0
    ? featuredProducts
    : products.slice(0, 8);
  const displayBestsellers = products.length > 0
    ? (bestsellers.length > 0
        ? [...bestsellers, ...products.filter((p) => !p.isBestseller)].slice(0, 8)
        : products.slice(0, 8))
    : [];

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SLIDESHOW */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="relative h-[480px] sm:h-[580px] lg:h-[640px] rounded-[36px] overflow-hidden shadow-cozy-lg border border-brand-100">
          {heroSlides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                className="object-cover object-center scale-105 transition-transform duration-10000 ease-out"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.accentColor} flex items-center`} />

              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20 max-w-2xl text-white z-20">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wide w-fit mb-4 text-cream-200 border border-white/30">
                  {slide.badge}
                </span>
                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white drop-shadow-sm">
                  {slide.title}
                </h1>
                <p className="text-sm sm:text-lg text-cream-100/90 mb-8 leading-relaxed font-light">
                  {slide.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={slide.ctaLink}
                    className="px-7 py-3.5 rounded-full bg-cream-200 text-brand-900 font-bold text-sm hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md flex items-center gap-2"
                  >
                    {slide.ctaText} <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/custom-orders"
                    className="px-6 py-3.5 rounded-full bg-white/15 backdrop-blur-md text-white font-semibold text-sm hover:bg-white/25 border border-white/40 transition-all flex items-center gap-2"
                  >
                    <Wand2 className="w-4 h-4 text-cream-300" /> Custom Order
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white hover:text-brand-900 flex items-center justify-center transition-all shadow-md"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/30 backdrop-blur-md text-white hover:bg-white hover:text-brand-900 flex items-center justify-center transition-all shadow-md"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Slider Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {heroSlides.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentSlide(dotIdx)}
                className={`h-2 rounded-full transition-all ${
                  dotIdx === currentSlide ? 'w-8 bg-cream-200' : 'w-2 bg-white/50'
                }`}
                aria-label={`Slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Curated Collections</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900 mt-1">Shop by Category</h2>
          </div>
          <Link
            href="/shop"
            className="mt-3 sm:mt-0 text-sm font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 group"
          >
            Explore all categories <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-4 bg-white rounded-3xl border border-canvas-border hover:border-brand-300 shadow-cozy hover:shadow-cozy-lg transition-all"
            >
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden mb-3 bg-brand-50 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-serif font-semibold text-sm text-brand-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                {cat.name}
              </h3>
              <span className="text-[11px] text-gray-400 mt-0.5">Explore →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED HANDCRAFTED CREATIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Artisan Spotlight</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900 mt-1">Featured Creations</h2>
          </div>
          <Link
            href="/shop?featured=true"
            className="mt-3 sm:mt-0 text-sm font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-1 group"
          >
            View all featured <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {displayFeatured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 4. DEDICATED CUSTOM CROCHET PROMOTIONAL CALLOUT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-br from-brand-900 via-brand-800 to-purple-950 text-white rounded-[36px] overflow-hidden p-8 sm:p-14 lg:p-16 shadow-cozy-lg border border-brand-700/60">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-700/60 text-cream-200 text-xs font-bold tracking-wide border border-brand-500/40">
                <Sparkles className="w-3.5 h-3.5 text-cream-300" /> Have a Unique Idea in Mind?
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-tight text-white">
                Custom Crochet Orders Made Just For You.
              </h2>
              <p className="text-cream-100/90 text-sm sm:text-base leading-relaxed">
                Whether it is a bridal bouquet in specific wedding colors, personalized character plushies, or a custom granny square bag, our master artisans turn your dream yarn vision into reality.
              </p>

              <div className="space-y-3 py-2">
                <div className="flex items-center gap-3 text-sm text-cream-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Upload your reference photo & specify color preferences</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-cream-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Receive a personalized quotation & crafting timeline within 24 hours</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-cream-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Track live progress from yarn spinning to final quality check</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/custom-orders"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-cream-200 text-brand-900 font-bold text-sm sm:text-base hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <Wand2 className="w-5 h-5 text-brand-700" /> Start Custom Request Now
                </Link>
              </div>
            </div>

            <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20">
              <Image
                src="https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80"
                alt="Custom Crochet Studio"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 text-brand-900 text-xs shadow-lg max-w-sm">
                  <p className="font-semibold text-sm">✨ 100% Satisfaction Guarantee</p>
                  <p className="text-gray-600 mt-1">We share photo updates of your handmade creation before dispatch!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BESTSELLERS & NEW ARRIVALS TABS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Customer Favorites</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">Most Loved & Trending</h2>
          <p className="text-sm text-gray-500 mt-2">
            Discovered and cherished by thousands of handmade crochet lovers across India.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {displayBestsellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE LOOP & LOVE */}
      <section className="bg-brand-50/60 py-16 sm:py-24 border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">The Artisanal Difference</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">Why Choose Loop & Love?</h2>
            <p className="text-sm text-gray-600 mt-2">
              In a world of factory-made fast items, we believe in the timeless warmth of handmade treasures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mb-6">
                <Scissors className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Premium Milk Cotton Yarn</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We select ultra-soft, colorfast, non-pilling milk cotton yarn that feels velvety soft, retains vibrant hues, and stands the test of time.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mb-6">
                <Heart className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Stitched by Skilled Women Artisans</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Every purchase supports fair wages and empowers home-based women crafters in our artisan collective across India.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center text-brand-700 mb-6">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-900 mb-3">Safe & Gift-Ready Packaging</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Wrapped in craft gift paper with satin ribbons, personalized handwritten notes, and protective crush-proof cartons.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Love Letters</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">What Our Customers Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-7 rounded-3xl border border-canvas-border shadow-cozy flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-brand-900 italic leading-relaxed">
                “I ordered the Lavender & Buttercream Tulip bouquet for my girlfriend’s birthday. She was in absolute awe! The fact that these flowers will never wilt makes it infinitely better than real flowers.”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-canvas-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-800 text-sm">
                AK
              </div>
              <div>
                <p className="font-serif font-bold text-brand-900 text-sm">Aanya Kapoor</p>
                <p className="text-[11px] text-gray-400">Verified Buyer • Mumbai</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-canvas-border shadow-cozy flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-brand-900 italic leading-relaxed">
                “Requested a custom couple amigurumi for our 5th anniversary. Loop & Love captured our outfit colors so precisely! The craftsmanship is breathtaking. Thank you so much!”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-canvas-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-800 text-sm">
                RM
              </div>
              <div>
                <p className="font-serif font-bold text-brand-900 text-sm">Rohan Mehra</p>
                <p className="text-[11px] text-gray-400">Verified Custom Order • Bengaluru</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-7 rounded-3xl border border-canvas-border shadow-cozy flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-brand-900 italic leading-relaxed">
                “The Granny square tote bag is my new daily carry! The cotton canvas lining is high quality and sturdy. I get asked about it everywhere I go. 10/10!”
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-canvas-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center font-bold text-brand-800 text-sm">
                PS
              </div>
              <div>
                <p className="font-serif font-bold text-brand-900 text-sm">Pooja Sharma</p>
                <p className="text-[11px] text-gray-400">Verified Buyer • Delhi</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. INSTAGRAM & COMMUNITY GALLERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Instagram Community</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900 mt-1">#LoopAndLoveCrochet</h2>
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-2 sm:mt-0 text-sm font-semibold text-brand-700 hover:text-brand-900 flex items-center gap-2"
          >
            <Instagram className="w-4 h-4 text-pink-600" /> Follow us @loopandlove
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=80"
              alt="Community post 1"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Instagram className="w-6 h-6" />
            </div>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
              alt="Community post 2"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Instagram className="w-6 h-6" />
            </div>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80"
              alt="Community post 3"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Instagram className="w-6 h-6" />
            </div>
          </div>

          <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80"
              alt="Community post 4"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Instagram className="w-6 h-6" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
