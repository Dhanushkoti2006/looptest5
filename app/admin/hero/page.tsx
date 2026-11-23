'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HeroSlide } from '@/lib/types';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
} from 'lucide-react';

export default function AdminHeroBannerPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [activePreview, setActivePreview] = useState(0);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.hero?.slides && data.hero.slides.length > 0) {
          setSlides(data.hero.slides);
        } else {
          // If no slides exist in DB, provide one initial starter slide with brand logo
          setSlides([
            {
              id: 'slide-1',
              title: 'Welcome to Loop & Love Crochet',
              subtitle: 'Handcrafted artisanal crochet pieces made with pure love and premium milk cotton.',
              badge: '✨ Artisanal Crochet Collection',
              ctaText: 'Explore Collection',
              ctaLink: '/shop',
              image: '/images/loop-and-love-logo.jpg',
            },
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to load hero banner from server:', err);
        setMessage({ text: 'Failed to load existing slides from server.', isError: true });
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

  const handleFileUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/hero/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        handleUpdateSlide(index, 'image', data.url);
        setMessage({ text: 'Image uploaded and optimized successfully!', isError: false });
      } else {
        setMessage({ text: data.message || 'Image upload failed.', isError: true });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setMessage({ text: 'Network error uploading image.', isError: true });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleAddSlide = () => {
    if (slides.length >= 6) {
      alert('A maximum of 6 active slides is permitted in the hero banner.');
      return;
    }

    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Featured Collection',
      subtitle: 'Handmade crochet treasures lovingly created for your home and gifting moments.',
      badge: '✨ Exclusive Release',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      image: '/images/loop-and-love-logo.jpg',
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

    // Client-side quick validation before submission
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (!s.title.trim()) {
        setMessage({ text: `Slide #${i + 1} requires a headline title.`, isError: true });
        setSaving(false);
        return;
      }
      if (!s.image.trim()) {
        setMessage({ text: `Slide #${i + 1} requires an image URL or uploaded file.`, isError: true });
        setSaving(false);
        return;
      }
      if (!s.ctaLink.startsWith('/') && !s.ctaLink.startsWith('https://')) {
        setMessage({
          text: `Slide #${i + 1} destination link must start with "/" (internal) or "https://"`,
          isError: true,
        });
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage({ text: '✨ Hero banner saved successfully! Homepage updated.', isError: false });
      } else {
        setMessage({
          text: data?.message || 'Failed to update hero banner.',
          isError: true,
        });
      }
    } catch (err: any) {
      console.error('Save hero banner error:', err);
      setMessage({
        text: 'Failed to communicate with server.',
        isError: true,
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
            disabled={slides.length >= 6}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Slide ({slides.length}/6)
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

          <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-brand-900">
            {currentPreviewSlide.image ? (
              <Image
                src={currentPreviewSlide.image}
                alt={currentPreviewSlide.title || 'Slide Preview'}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs">
                No image provided
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/50 to-transparent flex items-center p-6 sm:p-12">
              <div className="max-w-xl text-white space-y-3">
                {currentPreviewSlide.badge && (
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-semibold tracking-wide">
                    {currentPreviewSlide.badge}
                  </span>
                )}
                <h2 className="text-xl sm:text-3xl font-serif font-bold leading-tight drop-shadow-sm">
                  {currentPreviewSlide.title || 'Untitled Slide'}
                </h2>
                {currentPreviewSlide.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 leading-relaxed">
                    {currentPreviewSlide.subtitle}
                  </p>
                )}
                <div className="pt-2">
                  <span className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 font-bold text-xs shadow-md">
                    {currentPreviewSlide.ctaText || 'Explore'} →
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
                  <label className="font-bold text-slate-700 block mb-1">Slide Title / Headline (Max 100) *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
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
                  <label className="font-bold text-slate-700 block mb-1">Subtitle / Descriptive Text (Max 250)</label>
                  <textarea
                    rows={2}
                    maxLength={250}
                    value={slide.subtitle}
                    onChange={(e) => handleUpdateSlide(index, 'subtitle', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Banner Background Image *</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={slide.image}
                      onChange={(e) => handleUpdateSlide(index, 'image', e.target.value)}
                      placeholder="/images/... or https://..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                    />
                    <input
                      type="file"
                      ref={(el) => {
                        fileInputRefs.current[index] = el;
                      }}
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(index, file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[index]?.click()}
                      disabled={uploadingIndex === index}
                      className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      {uploadingIndex === index ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" /> Upload Image
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload JPEG, PNG, or WebP (max 5MB). Automatically compressed & converted to 1600px WebP.
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Button Text (Max 50)</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={slide.ctaText}
                    onChange={(e) => handleUpdateSlide(index, 'ctaText', e.target.value)}
                    placeholder="Explore Collection"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Destination Link (starts with / or https://)</label>
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
