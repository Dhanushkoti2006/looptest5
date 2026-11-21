'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import {
  Wand2,
  Sparkles,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function CustomOrdersPage() {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [productType, setProductType] = useState('Custom Bouquet & Flowers');
  const [description, setDescription] = useState('');
  const [preferredColors, setPreferredColors] = useState('Lilac, Cream & Dusty Rose');
  const [preferredSize, setPreferredSize] = useState('Standard (approx 30 cm)');
  const [quantity, setQuantity] = useState(1);
  const [budgetRange, setBudgetRange] = useState('₹1,500 - ₹2,500');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setReferenceImageUrl(data.url);
      }
    } catch (err) {
      console.warn('Image upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const [loading, setLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const productTypes = [
    'Custom Bouquet & Flowers',
    'Personalized Amigurumi Plushie',
    'Custom Granny Square Bag',
    'Baby Nursery Keepsake / Blanket',
    'Bridal / Wedding Gift Set',
    'Handmade Home Decor / Wall Art',
    'Custom Accessories / Hairpins',
  ];

  const colorPalettes = [
    'Signature Lilac, Buttercream & Mauve',
    'Pastel Meadow (Sage Green, Daisy White, Pale Yellow)',
    'Warm Sunset (Terracotta, Apricot, Honey Gold)',
    'Ocean Breeze (Soft Blue, Cream, Mint)',
    'Monochrome Ivory & Champagne',
    'Custom / Specific (Details in description)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        userId: user?.id,
        customerName,
        email,
        phone,
        productType,
        description,
        preferredColors,
        preferredSize,
        quantity,
        budgetRange,
        requiredDeliveryDate: deliveryDate,
        referenceImages: referenceImageUrl ? [referenceImageUrl] : [],
        additionalNotes,
      };

      const res = await fetch('/api/custom-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.customOrder) {
        setSubmittedData(data.customOrder);
      } else {
        setErrorMsg(data.message || 'Submission failed. Please check required fields.');
      }
    } catch {
      setErrorMsg('Network error submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* HEADER HERO */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold tracking-wide mb-3">
          <Wand2 className="w-3.5 h-3.5 text-brand-600" /> Bespoke Artisanal Studio
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-900 leading-tight">
          Design Your Dream Crochet Piece
        </h1>
        <p className="text-sm text-gray-600 mt-3 leading-relaxed">
          From custom wedding bouquet recreations to personalized pet amigurumi and customized tote palettes, our artisans hook your dream into reality.
        </p>
      </div>

      {submittedData ? (
        /* SUCCESS CONFIRMATION BOX */
        <div className="bg-white rounded-3xl border border-brand-200 p-8 sm:p-12 shadow-cozy-lg text-center max-w-2xl mx-auto space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500">
              Request Received • #{submittedData.requestNumber}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900 mt-1">
              Thank You, {submittedData.customerName}!
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Our lead artisan is reviewing your specifications for <strong>{submittedData.productType}</strong>. You will receive an official quotation and crafting plan within 24 hours at <strong>{submittedData.email}</strong>.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-canvas-subtle border border-canvas-border text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Preferred Color Palette:</span>
              <span className="font-semibold text-brand-900">{submittedData.preferredColors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Estimated Delivery Target:</span>
              <span className="font-semibold text-brand-900">{submittedData.requiredDeliveryDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Current Status:</span>
              <span className="font-bold text-brand-600 uppercase">Awaiting Artisan Review</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/track-order"
              className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs"
            >
              Track Custom Order Status
            </Link>
            <button
              onClick={() => setSubmittedData(null)}
              className="px-6 py-3 rounded-full bg-canvas-subtle text-brand-900 font-semibold text-xs hover:bg-gray-200"
            >
              Submit Another Custom Request
            </button>
          </div>
        </div>
      ) : (
        /* REQUEST FORM */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (2 cols) */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 bg-white rounded-3xl border border-canvas-border p-6 sm:p-10 shadow-cozy space-y-6"
          >
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            {/* 1. Contact Info */}
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-lg text-brand-900 pb-2 border-b border-canvas-border">
                1. Your Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. priya@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp / Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Custom Creation Details */}
            <div className="space-y-4 pt-2">
              <h3 className="font-serif font-bold text-lg text-brand-900 pb-2 border-b border-canvas-border">
                2. Custom Creation Specifications
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Product Type *</label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl font-medium focus:outline-none focus:border-brand-500"
                >
                  {productTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Detailed Description & Customization Request *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your vision: e.g. 'I want a bridal bouquet with 5 lilac tulips, 3 white hydrangeas, and baby's breath, with an ivory silk wrap and engraved monogram tag.'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Preferred Color Palette *</label>
                <select
                  value={preferredColors}
                  onChange={(e) => setPreferredColors(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl font-medium focus:outline-none focus:border-brand-500 mb-2"
                >
                  {colorPalettes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Preferred Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 cm height"
                    value={preferredSize}
                    onChange={(e) => setPreferredSize(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Budget Range</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1500 - ₹2500"
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Required By Delivery Date * (Min. 7 days handmade craft lead-time)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Reference Image link & Upload */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reference Image / Photo (Optional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="Paste link to Pinterest / Instagram / photo..."
                    value={referenceImageUrl}
                    onChange={(e) => setReferenceImageUrl(e.target.value)}
                    className="flex-1 text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                  <label className="px-4 py-3 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition-colors">
                    <Upload className="w-4 h-4 text-brand-600" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
                {referenceImageUrl && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    ✓ Reference image attached
                  </p>
                )}
                <span className="text-[11px] text-gray-400 mt-1 block">
                  You can upload a screenshot or paste a link.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Special Instructions or Gift Card Message
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please pack in a pink gift box with a note: 'Happy Anniversary love!'"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-cozy hover:shadow-cozy-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Submitting Request...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" /> Submit Custom Crochet Request
                </>
              )}
            </button>
          </form>

          {/* Right Sidebar: Custom Order FAQ & Process (1 col) */}
          <div className="space-y-6">
            <div className="bg-brand-50/70 p-6 rounded-3xl border border-brand-200/60 space-y-4">
              <h4 className="font-serif font-bold text-base text-brand-900">How It Works</h4>
              <div className="space-y-3 text-xs text-brand-900">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-200 text-brand-800 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <strong className="block">Submit Request</strong>
                    <span className="text-gray-600">Share your vision, color palette, and target delivery date.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-200 text-brand-800 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <strong className="block">Artisan Review & Quote</strong>
                    <span className="text-gray-600">We analyze yarn requirements and email you a price quote.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-200 text-brand-800 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <strong className="block">Accept & Pay Securely</strong>
                    <span className="text-gray-600">Approve the quote and pay online via Razorpay UPI or Cards.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-200 text-brand-800 font-bold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <strong className="block">Crafted & Dispatched</strong>
                    <span className="text-gray-600">Our artisans hand-crochet your order with live photo updates!</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-2xs space-y-3">
              <h4 className="font-serif font-bold text-sm text-brand-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Artisan Quality Guarantee
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                If the color or details do not match the approved design specifications, we will gladly adjust it before shipping.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
