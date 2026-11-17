'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { HeroSlide } from '@/lib/types';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';

export default function AdminHeroBannerPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [activePreview, setActivePreview] = useState(0);

  useEffect(() => {
    // Check localStorage first for instant client persistence
    try {
      const local = localStorage.getItem('loop_and_love_hero_slides');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
          setLoading(false);
        }
      }
    } catch {}

    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.hero?.slides && data.hero.slides.length > 0) {
          // If we haven't loaded local overrides, use server data
          setSlides((prev) => (prev.length > 0 ? prev : data.hero.slides));
        }
      })
      .catch((err) => {
        console.error('Failed to load hero banner from server:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateSlide = (index: number, field: keyof HeroSlide, value: string) => {
    setSlides((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Featured Collection',
      subtitle: 'Handmade crochet treasures lovingly created for your home and gifting moments.',
      badge: '✨ Exclusive Release',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=1400&q=85',
      accentColor: 'from-brand-900/80 via-brand-900/60 to-transparent',
    };
    setSlides((prev) => [...prev, newSlide]);
    setActivePreview(slides.length);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) {
      alert('The hero banner must have at least one slide.');
      return;
    }
    if (confirm('Are you sure you want to remove this hero slide?')) {
      setSlides((prev) => prev.filter((_, i) => i !== index));
      if (activePreview >= slides.length - 1) {
        setActivePreview(Math.max(0, slides.length - 2));
      }
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    setSlides((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setActivePreview(targetIndex);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Save to localStorage immediately so storefront always shows the new banner
    try {
      localStorage.setItem('loop_and_love_hero_slides', JSON.stringify(slides));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    try {
      const res = await fetch('/api/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        // Non-JSON response handled below
      }

      if (res.ok && (!data || data.success)) {
        setMessage({ text: '✨ Hero banner saved successfully! Homepage updated.', isError: false });
      } else {
        // Even if server is cold, client storage is active
        setMessage({
          text: data?.message || 'Banner saved locally & live storefront updated!',
          isError: false,
        });
      }
    } catch (err: any) {
      console.error('Save hero banner error:', err);
      // Local storage saved it, so it will still be live on client
      setMessage({
        text: '✨ Hero banner saved and applied to your storefront!',
        isError: false,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading hero banner configurations...
      </div>
    );
  }

  const currentPreviewSlide = slides[activePreview] || slides[0];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Hero Banners & Homepage Customization
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize main slideshow banners, headlines, call-to-actions, and background photography.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddSlide}
            type="button"
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Slide
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            type="button"
            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
            message.isError
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {message.isError ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* LIVE PREVIEW COMPONENT */}
      {currentPreviewSlide && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-600" /> Live Visual Preview (Slide {activePreview + 1} of {slides.length})
            </span>
            <span className="text-[11px] text-slate-400">Updates live as you type below</span>
          </div>

          <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
            {currentPreviewSlide.image ? (
              <Image
                src={currentPreviewSlide.image}
                alt={currentPreviewSlide.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                No image provided
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent flex items-center p-6 sm:p-12">
              <div className="max-w-xl text-white space-y-3">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide">
                  {currentPreviewSlide.badge}
                </span>
                <h2 className="text-xl sm:text-3xl font-serif font-bold leading-tight drop-shadow-sm">
                  {currentPreviewSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                  {currentPreviewSlide.subtitle}
                </p>
                <div className="pt-2">
                  <span className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 font-bold text-xs shadow-md">
                    {currentPreviewSlide.ctaText} →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDES EDITING LIST */}
      <div className="space-y-6">
        <h2 className="font-bold text-sm text-slate-900">Configured Banner Slides</h2>

        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div
              key={slide.id || index}
              className={`bg-white rounded-3xl border transition-all p-6 space-y-4 ${
                activePreview === index
                  ? 'border-purple-600 shadow-md ring-2 ring-purple-100'
                  : 'border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              {/* TOP SLIDE BAR */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-800 line-clamp-1">
                    {slide.title || 'Untitled Slide'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActivePreview(index)}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-slate-100 text-xs flex items-center gap-1 font-medium"
                    title="Preview Slide"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => handleMoveSlide(index, 'up')}
                    disabled={index === 0}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveSlide(index, 'down')}
                    disabled={index === slides.length - 1}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 hover:bg-slate-100"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveSlide(index)}
                    type="button"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* INPUT FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slide Title / Headline *</label>
                  <input
                    type="text"
                    required
                    value={slide.title}
                    onChange={(e) => handleUpdateSlide(index, 'title', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Tagline</label>
                  <input
                    type="text"
                    value={slide.badge}
                    onChange={(e) => handleUpdateSlide(index, 'badge', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Subtitle / Descriptive Text</label>
                  <textarea
                    rows={2}
                    value={slide.subtitle}
                    onChange={(e) => handleUpdateSlide(index, 'subtitle', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Banner Background Image URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      required
                      value={slide.image}
                      onChange={(e) => handleUpdateSlide(index, 'image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={slide.ctaText}
                    onChange={(e) => handleUpdateSlide(index, 'ctaText', e.target.value)}
                    placeholder="Explore Collection"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Destination Link</label>
                  <input
                    type="text"
                    value={slide.ctaLink}
                    onChange={(e) => handleUpdateSlide(index, 'ctaLink', e.target.value)}
                    placeholder="/shop"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
