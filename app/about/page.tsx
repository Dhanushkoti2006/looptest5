import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Sparkles, Scissors, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-16 pb-20">
      {/* HERO */}
      <section className="bg-brand-900 text-cream-100 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-brand-400 shadow-md">
            <Image src="/images/loop-and-love-logo.jpg" alt="Loop & Love Logo" fill className="object-cover" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-cream-300">Our Artisanal Story</span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white">
            Handmade with Love, Crafted to Last.
          </h1>
          <p className="text-sm sm:text-base text-cream-200/90 max-w-2xl mx-auto leading-relaxed">
            Loop & Love began with a simple hook, a skein of soft pastel yarn, and an enduring belief: that the most meaningful gifts in life are those crafted with patience, tenderness, and human touch.
          </p>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">The Everlasting Bloom</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900">
              Why We Love Crochet Flowers
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Traditional fresh bouquets are beautiful, but within days their petals dry, brown, and are discarded. Our crochet blossoms never fade. They stand on desks, bedside tables, and bookshelves for years—a perpetual gentle reminder of the love with which they were gifted.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Each tulip petal, sunflower seed head, and rose leaf is individually crocheted by hand using premium milk cotton yarn, wired for natural lifelike posing, and tied with satin ribbons.
            </p>
          </div>

          <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-cozy border border-canvas-border">
            <Image
              src="/images/loop-and-love-logo.jpg"
              alt="Crafting crochet blooms"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ARTISAN COLLECTIVE */}
      <section className="bg-brand-50/70 py-16 border-y border-brand-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">Women Empowerment</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-brand-900">The Artisan Collective</h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Behind every Loop & Love creation is a community of talented home-based women crafters across India. By providing fair wages, flexible home hours, and continuous yarn supply, we support financial independence through their extraordinary crochet talent.
          </p>

          <div className="pt-6">
            <Link
              href="/custom-orders"
              className="px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-cozy inline-flex items-center gap-2"
            >
              Order a Custom Creation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
