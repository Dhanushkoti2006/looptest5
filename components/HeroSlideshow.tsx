'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  title: string;
  subtitle: string;
  badge: string;
  ctaText: string;
  ctaLink: string;
  image: string;
  accentColor: string;
}

interface HeroSlideshowProps {
  slides?: HeroSlide[];
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    title: 'Handmade with Love, Crafted to Last.',
    subtitle: 'Everlasting flower bouquets, charming keychains, and bespoke amigurumi keepsakes stitched with utmost tenderness.',
    badge: '✨ Artisanal Crochet Collection 2026',
    ctaText: 'Explore Collection',
    ctaLink: '/shop',
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    title: 'Bring Your Dream Crochet Idea to Life',
    subtitle: 'Custom bridal bouquets, anniversary gifts, or your favorite plush toy character crafted exactly to your vision.',
    badge: '🌸 Bespoke Custom Order Studio',
    ctaText: 'Design Custom Order',
    ctaLink: '/custom-orders',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
  {
    title: 'Sweet Companions & Soft Amigurumi Toys',
    subtitle: 'Gentle, hypoallergenic milk cotton toys stitched for pure cuddles and nursery warmth.',
    badge: '🧸 Baby Safe & Handcrafted',
    ctaText: 'Shop Toys',
    ctaLink: '/shop?category=toys',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1400&q=85',
    accentColor: 'from-brand-900/85 via-brand-900/65 to-transparent',
  },
];

export default function HeroSlideshow({ slides = DEFAULT_SLIDES }: HeroSlideshowProps) {
  const activeSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [currentSlide, setCurrentSlide] = useState(0);

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
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full bg-cream-200 hover:bg-white text-brand-900 font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all shadow-cozy hover:shadow-cozy-lg transform active:scale-95"
                >
                  {slide.ctaText} <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Slider Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 text-white flex items-center justify-center transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/30 backdrop-blur-md hover:bg-white/50 text-white flex items-center justify-center transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slider Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {activeSlides.map((_, dotIdx) => (
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
  );
}
