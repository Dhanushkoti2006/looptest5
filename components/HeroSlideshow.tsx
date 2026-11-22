'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export interface HeroSlide {
  id?: string;
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  accentColor: string;
}

interface HeroSlideshowProps {
  initialSlides?: HeroSlide[];
}

export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    title: 'Handmade with Love, Crafted to Last.',
    subtitle: 'Everlasting flower bouquets, charming keychains, and bespoke amigurumi keepsakes stitched with utmost tenderness.',
    badge: '✨ Artisanal Crochet Collection 2026',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    id: 'slide-2',
    title: 'Bring Your Dream Crochet Idea to Life',
    subtitle: 'Custom bridal bouquets, anniversary gifts, or your favorite plush toy character crafted exactly to your vision.',
    badge: '🌸 Bespoke Custom Order Studio',
    ctaText: 'Design Custom Order',
    ctaLink: '/custom-orders',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    id: 'slide-3',
    title: 'Sweet Companions & Soft Amigurumi Toys',
    subtitle: 'Gentle, hypoallergenic milk cotton toys stitched for pure cuddles and nursery warmth.',
    badge: '🧸 Baby Safe & Handcrafted',
    ctaText: 'Shop Toys',
    ctaLink: '/shop/toys',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
];

export default function HeroSlideshow({ initialSlides }: HeroSlideshowProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    if (initialSlides && initialSlides.length > 0) return initialSlides;
    return DEFAULT_SLIDES;
  });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check localStorage first for instant client updates when admin edits
    try {
      const local = localStorage.getItem('loop_and_love_hero_slides');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      }
    } catch (_) {}

    // Fetch latest slides from API
    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.hero?.slides && Array.isArray(data.hero.slides) && data.hero.slides.length > 0) {
          setSlides(data.hero.slides);
        }
      })
      .catch((err) => console.warn('Hero live refresh error:', err));
  }, []);

  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <div className="relative h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-cozy-lg">
      {activeSlides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={idx === 0}
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accentColor} flex items-center`} />

          <div className="absolute inset-0 flex items-center px-4 sm:px-12 lg:px-16 z-20">
            <div className="max-w-xl text-white space-y-2.5 sm:space-y-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wide border border-white/30">
                {slide.badge}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-tight drop-shadow-xs">
                {slide.title}
              </h2>
              <p className="text-xs sm:text-base text-cream-100 leading-relaxed drop-shadow-2xs line-clamp-2 sm:line-clamp-none">
                {slide.subtitle}
              </p>
              <div className="pt-1 sm:pt-2">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-cream-100 text-brand-900 font-bold text-xs sm:text-sm hover:bg-white hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slide Navigation Buttons */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-xs transition-colors border border-white/20"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-2.5 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-xs transition-colors border border-white/20"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </>
      )}

      {/* Slide Dots Indicator */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {activeSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
