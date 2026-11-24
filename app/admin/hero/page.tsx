'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  Megaphone,
  Palette,
  Link as LinkIcon,
} from 'lucide-react';

export default function AdminHeroBannerPage() {
  const [activeTab, setActiveTab] = useState<'slides' | 'announcement'>('slides');

  // Hero Slides State
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [activePreview, setActivePreview] = useState(0);

  // Announcement Bar State
  const [announcement, setAnnouncement] = useState({
    text: '🌸 Free Handcrafted Gift Box on orders above ₹999 • All India Express Delivery',
    secondary_text: '✨ 100% Milk Cotton',
    link_text: 'Request Custom Crochet',
    link_url: '/custom-orders',
    bg_color: '#2E1D36',
    text_color: '#FBF5E5',
    is_active: true,
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  useEffect(() => {
    Promise.all([
      fetch('/api/hero', { cache: 'no-store' }).then((res) => res.json()),
      fetch('/api/announcement', { cache: 'no-store' }).then((res) => res.json()),
    ])
      .then(([heroData, annData]) => {
        if (heroData.success && heroData.hero?.slides && heroData.hero.slides.length > 0) {
          setSlides(heroData.hero.slides);
        } else {
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

        if (annData.success && annData.announcement) {
          setAnnouncement(annData.announcement);
        }
      })
      .catch((err) => {
        console.error('Failed to load settings from server:', err);
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
      title: 'New Artisanal Creation',
      subtitle: 'Lovingly stitched with ultra-soft milk cotton yarn.',
      badge: '✨ New Launch',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      image: '/images/loop-and-love-logo.jpg',
    };

    setSlides([...slides, newSlide]);
    setActivePreview(slides.length);
  };

  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) {
      alert('The hero banner must have at least one slide.');
      return;
    }
    const filtered = slides.filter((_, i) => i !== index);
    setSlides(filtered);
    if (activePreview >= filtered.length) {
      setActivePreview(Math.max(0, filtered.length - 1));
    }
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const reordered = [...slides];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setSlides(reordered);
    setActivePreview(targetIndex);
  };

  const handleSaveHeroSlides = async () => {
    setSaving(true);
    setMessage(null);

    // Validation
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

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    setAnnouncementMessage(null);

    try {
      const res = await fetch('/api/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcement),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAnnouncementMessage({
          text: '✨ Top announcement bar saved! Live on store header.',
          isError: false,
        });
      } else {
        setAnnouncementMessage({
          text: data?.message || 'Failed to update announcement bar.',
          isError: true,
        });
      }
    } catch {
      setAnnouncementMessage({
        text: 'Failed to communicate with server.',
        isError: true,
      });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading storefront configurations...
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
            Storefront Banners & Announcements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize the top announcement strip, hero slideshow banners, buttons, and visual themes.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'announcement'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            Top Announcement Bar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('slides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'slides'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Hero Slideshow ({slides.length})
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: TOP ANNOUNCEMENT BAR CUSTOMIZER */}
      {/* ============================================================== */}
      {activeTab === 'announcement' && (
        <div className="space-y-6 animate-in fade-in">
          {/* LIVE PREVIEW OF ANNOUNCEMENT BAR */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-purple-600" /> Live Header Strip Preview
              </span>
              <span className="text-[11px] text-slate-400">
                {announcement.is_active ? 'Status: Active on Store' : 'Status: Hidden on Store'}
              </span>
            </div>

            {/* Rendered Announcement Bar Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
              <div
                style={{
                  backgroundColor: announcement.bg_color,
                  color: announcement.text_color,
                  opacity: announcement.is_active ? 1 : 0.45,
                }}
                className="py-2.5 px-4 text-xs font-medium transition-colors"
              >
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-cream-400 shrink-0 animate-pulse" />
                    <span className="truncate">{announcement.text || 'Add your announcement text...'}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] opacity-90 shrink-0">
                    {announcement.secondary_text && <span>{announcement.secondary_text}</span>}
                    {announcement.secondary_text && announcement.link_text && <span>•</span>}
                    {announcement.link_text && (
                      <span className="underline underline-offset-2 font-semibold">
                        {announcement.link_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {!announcement.is_active && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ The announcement bar is currently set to hidden and will not be displayed on the storefront.
              </p>
            )}
          </div>

          {/* ANNOUNCEMENT FORM */}
          <form onSubmit={handleSaveAnnouncement} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Announcement Bar Content & Colors</h3>
                <p className="text-xs text-slate-500">Edit the message, promotional links, and background palette.</p>
              </div>

              {/* ACTIVE TOGGLE */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={announcement.is_active}
                  onChange={(e) => setAnnouncement({ ...announcement, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Enable Announcement Bar</span>
              </label>
            </div>

            {announcementMessage && (
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-medium border ${
                  announcementMessage.isError
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {announcementMessage.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                )}
                <span>{announcementMessage.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Main Announcement Message */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Primary Announcement Message</label>
                  <span className="text-[10px] text-slate-400">{announcement.text.length}/250 chars</span>
                </div>
                <input
                  type="text"
                  maxLength={250}
                  required
                  value={announcement.text}
                  onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                  placeholder="e.g. 🌸 Free Handcrafted Gift Box on orders above ₹999 • All India Express Delivery"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 text-xs"
                />
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-600">Quick Emojis:</span>
                  {['🌸', '✨', '🎁', '🧶', '🚚', '💖', '💐', '🎉'].map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setAnnouncement((prev) => ({ ...prev, text: prev.text + ' ' + emoji }))}
                      className="px-1.5 py-0.5 rounded hover:bg-slate-100 text-xs"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Badge / Text */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Secondary Highlight Text (Optional)</label>
                <input
                  type="text"
                  maxLength={100}
                  value={announcement.secondary_text || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, secondary_text: e.target.value })}
                  placeholder="e.g. ✨ 100% Milk Cotton"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 text-xs"
                />
                <p className="text-[10px] text-slate-400">Shown on tablets and desktops next to the action link.</p>
              </div>

              {/* Action Link Label */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Action Link Label (Optional)</label>
                <input
                  type="text"
                  maxLength={60}
                  value={announcement.link_text || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, link_text: e.target.value })}
                  placeholder="e.g. Request Custom Crochet or Shop All"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 text-xs"
                />
                <p className="text-[10px] text-slate-400">Clickable text displayed with an underline.</p>
              </div>

              {/* Action Link URL */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Action Link Destination URL</label>
                <input
                  type="text"
                  value={announcement.link_url || ''}
                  onChange={(e) => setAnnouncement({ ...announcement, link_url: e.target.value })}
                  placeholder="e.g. /custom-orders or /shop"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 text-xs"
                />
                <p className="text-[10px] text-slate-400">Internal path (e.g. /shop) or external URL.</p>
              </div>

              {/* Color Customization */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600" /> Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.bg_color}
                    onChange={(e) => setAnnouncement({ ...announcement, bg_color: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={announcement.bg_color}
                    onChange={(e) => setAnnouncement({ ...announcement, bg_color: e.target.value })}
                    className="w-28 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                  {/* Preset Colors */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { name: 'Plum Charcoal', hex: '#2E1D36' },
                      { name: 'Brand Lilac', hex: '#9D7BB0' },
                      { name: 'Buttercream', hex: '#FBF5E5' },
                      { name: 'Dusty Rose', hex: '#C98B9E' },
                      { name: 'Midnight', hex: '#0F172A' },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setAnnouncement({ ...announcement, bg_color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-3">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-600" /> Text & Link Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={announcement.text_color}
                    onChange={(e) => setAnnouncement({ ...announcement, text_color: e.target.value })}
                    className="w-9 h-9 p-0.5 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={announcement.text_color}
                    onChange={(e) => setAnnouncement({ ...announcement, text_color: e.target.value })}
                    className="w-28 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                  />
                  {/* Preset Colors */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { name: 'Buttercream Gold', hex: '#FBF5E5' },
                      { name: 'Pure White', hex: '#FFFFFF' },
                      { name: 'Charcoal Dark', hex: '#2E1D36' },
                      { name: 'Warm Gold', hex: '#E2C474' },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setAnnouncement({ ...announcement, text_color: c.hex })}
                        style={{ backgroundColor: c.hex }}
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-2xs hover:scale-110 transition-transform"
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={savingAnnouncement}
                className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                {savingAnnouncement ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save & Update Store Announcement
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: HERO SLIDESHOW CAROUSEL CUSTOMIZER */}
      {/* ============================================================== */}
      {activeTab === 'slides' && (
        <div className="space-y-8 animate-in fade-in">
          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs text-slate-500 font-medium">
              Manage up to 6 animated rotating slides for the homepage hero slideshow.
            </span>
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
                onClick={handleSaveHeroSlides}
                disabled={saving}
                type="button"
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:bg-purple-400 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Save & Publish Slides'}</span>
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

              {/* PREVIEW SLIDE SELECTOR */}
              <div className="flex items-center gap-2 pt-2 overflow-x-auto">
                {slides.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => setActivePreview(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      activePreview === idx
                        ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Slide #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SLIDES EDITING LIST */}
          <div className="space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-900">Configure Slides</h3>

            <div className="space-y-4">
              {slides.map((slide, index) => (
                <div
                  key={slide.id || index}
                  className={`bg-white rounded-3xl border transition-all p-6 shadow-2xs space-y-5 ${
                    activePreview === index ? 'border-purple-400 ring-2 ring-purple-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {slide.title ? slide.title : `Slide #${index + 1}`}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'up')}
                        disabled={index === 0}
                        title="Move Slide Up"
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveSlide(index, 'down')}
                        disabled={index === slides.length - 1}
                        title="Move Slide Down"
                        className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePreview(index)}
                        title="Preview This Slide"
                        className="p-1.5 text-purple-600 hover:text-purple-800 rounded-lg hover:bg-purple-50"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveSlide(index)}
                        disabled={slides.length <= 1}
                        title="Delete Slide"
                        className="p-1.5 text-red-500 hover:text-red-700 disabled:opacity-30 rounded-lg hover:bg-red-50 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Badge Text (Optional)</label>
                      <input
                        type="text"
                        maxLength={60}
                        value={slide.badge || ''}
                        onChange={(e) => handleUpdateSlide(index, 'badge', e.target.value)}
                        placeholder="✨ Festive Collection"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Headline Title (Max 120)</label>
                      <input
                        type="text"
                        maxLength={120}
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(index, 'title', e.target.value)}
                        placeholder="Handmade Crochet Flowers"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-semibold"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Subtitle / Subtext (Max 250)</label>
                      <textarea
                        rows={2}
                        maxLength={250}
                        value={slide.subtitle}
                        onChange={(e) => handleUpdateSlide(index, 'subtitle', e.target.value)}
                        placeholder="Everlasting bouquets crafted with ultra-soft milk cotton yarn..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Slide Image (Required)</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={slide.image}
                          onChange={(e) => handleUpdateSlide(index, 'image', e.target.value)}
                          placeholder="https://... or /images/..."
                          className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                        />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          ref={(el) => {
                            fileInputRefs.current[index] = el;
                          }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(index, e.target.files[0]);
                            }
                          }}
                          className="hidden"
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
      )}
    </div>
  );
}
