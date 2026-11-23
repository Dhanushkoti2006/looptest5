'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export interface HeroSlide {
  id?: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  accentColor?: string;
}

interface HeroSlideshowProps {
  slides?: HeroSlide[];
}

export default function HeroSlideshow({ slides = [] }: HeroSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // One-time cleanup on load: delete legacy localStorage key and never read it again
  useEffect(() => {
    try {
      localStorage.removeItem('loop_and_love_hero_slides');
    } catch (_) {}
  }, []);

  const activeSlides = slides || [];

  // Autoplay pauses when the browser tab is hidden
  useEffect(() => {
    if (activeSlides.length <= 1) return;

    let timer: NodeJS.Timeout | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
        }
      }, 6000);
    };

    startTimer();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (timer) clearInterval(timer);
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeSlides.length]);

  // Fallback: If there are zero active slides, show a neutral branded block with the logo
  if (activeSlides.length === 0) {
    return (
      <div className="relative h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-cozy-lg bg-gradient-to-br from-brand-900 via-brand-800 to-purple-950 flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-brand-300/40 shadow-xl bg-brand-900">
          <Image
            src="/images/loop-and-love-logo.jpg"
            alt="Loop & Love Boutique"
            fill
            priority
            sizes="112px"
            className="object-cover"
          />
        </div>
        <div className="max-w-md space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-cream-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-cream-300" /> Artisanal Crochet Studio
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-cream-100">
            Loop &amp; Love
          </h2>
          <p className="text-xs sm:text-sm text-cream-200/90 leading-relaxed">
            Handmade with Love, Crafted to Last. Discover everlasting crochet floral bouquets, charming keychains, and bespoke amigurumi keepsakes.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cream-100 text-brand-900 font-bold text-xs sm:text-sm hover:bg-white transition-all shadow-md"
          >
            Explore Boutique <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  return (
    <div className="relative h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl sm:rounded-3xl overflow-hidden shadow-cozy-lg">
      {activeSlides.map((slide, idx) => (
        <div
          key={slide.id || idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            priority={idx === 0}
            loading={idx === 0 ? undefined : 'lazy'}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 95vw, 1200px"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 500'%3E%3Crect width='100%25' height='100%25' fill='%232E1D36'/%3E%3C/svg%3E"
            className="object-cover object-center"
          />
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              slide.accentColor || 'from-brand-900/85 via-brand-900/65 to-transparent'
            } flex items-center`}
          />

          <div className="absolute inset-0 flex items-center px-4 sm:px-12 lg:px-16 z-20">
            <div className="max-w-xl text-white space-y-2.5 sm:space-y-4">
              {slide.badge && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-semibold tracking-wide border border-white/30">
                  {slide.badge}
                </span>
              )}
              <h2 className="font-serif text-2xl sm:text-4xl md:text-5xl font-bold leading-tight drop-shadow-xs">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="text-xs sm:text-base text-cream-100 leading-relaxed drop-shadow-2xs line-clamp-2 sm:line-clamp-none">
                  {slide.subtitle}
                </p>
              )}
              <div className="pt-1 sm:pt-2">
                <Link
                  href={slide.ctaLink || '/shop'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3 rounded-full bg-cream-100 text-brand-900 font-bold text-xs sm:text-sm hover:bg-white hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{slide.ctaText || 'Explore Collection'}</span>
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
