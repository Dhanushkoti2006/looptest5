'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Review, ProductVariant } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import ProductCard from '@/components/ProductCard';
import {
  Heart,
  ShoppingBag,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock,
  Sparkles,
  Check,
  Bell,
  Send,
  ArrowRight,
  Share2,
  CheckCircle2,
  Lock,
  Gift,
  AlertCircle,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || '';

  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeVariant, setActiveVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // Restock form
  const [restockEmail, setRestockEmail] = useState('');
  const [restockRegistered, setRestockRegistered] = useState(false);

  // Review form
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Toasts
  const [addedToast, setAddedToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    setLoading(true);

    const decoded = decodeURIComponent(rawSlug).toLowerCase().trim();

    const findMatchingProduct = (list: Product[]) => {
      return list.find((p) => {
        const pSlug = (p.slug || '').toLowerCase().trim();
        const pId = (p.id || '').toLowerCase().trim();
        const pNameSlug = (p.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        return pSlug === decoded || pId === decoded || pNameSlug === decoded;
      });
    };

    fetch('/api/products', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          const match = findMatchingProduct(data.products);
          if (match) {
            setupFoundProduct(match, data.products);
          } else {
            setProduct(null);
          }
        }
      })
      .catch((err) => console.error('Error fetching product detail:', err))
      .finally(() => setLoading(false));
  }, [rawSlug]);

  const setupFoundProduct = (found: Product, allList: Product[]) => {
    setProduct(found);
    const cover = found.images && found.images.length > 0 ? found.images[0] : '/images/loop-and-love-logo.jpg';
    setSelectedImage(cover);

    if (found.variants && found.variants.length > 0) {
      const firstVar = found.variants[0];
      setSelectedColor(firstVar.colorName);
      setSelectedSize(firstVar.sizeName);
      setActiveVariant(firstVar);
    } else {
      setSelectedColor('Standard');
      setSelectedSize('Standard');
      setActiveVariant(null);
    }

    // Related products from same category
    const related = allList
      .filter((p: Product) => p.id !== found.id && p.categoryId === found.categoryId)
      .slice(0, 4);
    setRelatedProducts(related.length > 0 ? related : allList.filter((p) => p.id !== found.id).slice(0, 4));

    // Fetch approved reviews from Supabase
    fetch(`/api/reviews?productId=${found.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.reviews && Array.isArray(d.reviews)) {
          setReviews(d.reviews);
        }
      })
      .catch(() => {});
  };

  const handleSelectColor = (v: ProductVariant) => {
    setSelectedColor(v.colorName);
    if (v.sizeName) setSelectedSize(v.sizeName);
    setActiveVariant(v);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-28 text-center text-brand-900">
        <Sparkles className="w-9 h-9 animate-spin mx-auto text-brand-500 mb-3" />
        <h2 className="font-serif text-xl font-bold">Weaving artisanal creation...</h2>
        <p className="text-xs text-gray-400 mt-1">Loading product details and yarn textures</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">Handcrafted Creation Not Found</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          We could not locate this crochet product. It may have been archived or moved to a different category.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/shop"
            className="px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition-colors"
          >
            Browse All Creations
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-full border border-canvas-border text-brand-900 text-xs font-semibold hover:bg-brand-50 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const isSoldOut = product.status === 'SOLD_OUT' || product.stock <= 0;
  const modifier = activeVariant?.priceModifier || 0;
  const baseCurrentPrice = product.discountPrice || product.price;
  const currentPrice = baseCurrentPrice + modifier;
  const originalPrice = product.price + modifier;
  const discountPercent =
    product.discountPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addToCart(product, selectedColor, selectedSize, quantity);
    router.push('/checkout');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockEmail.trim() || !product) return;

    try {
      await fetch('/api/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: restockEmail.trim(), productId: product.id }),
      });
      setRestockRegistered(true);
      setRestockEmail('');
    } catch (err) {
      console.warn('Restock error:', err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          userId: user?.id,
          rating: newRating,
          comment: newComment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.review) {
        setReviews([data.review, ...reviews]);
        setNewComment('');
        setReviewSubmitted(true);
        setTimeout(() => setReviewSubmitted(false), 4000);
      }
    } catch (err) {
      console.warn('Review submit error:', err);
    }
  };

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : ['/images/loop-and-love-logo.jpg'];

  const defaultHighlights = [
    '100% Hand-stitched with love by skilled women artisans',
    'Ultra-soft, colorfast, hypoallergenic premium milk cotton yarn',
    'Gift-ready packaging with satin ribbon and handwritten note card',
    'Made in India, empowering home-based crafters',
  ];

  const highlights =
    product.highlights && product.highlights.length > 0
      ? product.highlights
      : defaultHighlights;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* BREADCRUMB NAVIGATION */}
      <nav className="text-xs text-gray-400 mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-brand-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-900 transition-colors">
          Shop
        </Link>
        <span>/</span>
        <Link
          href={`/shop?category=${encodeURIComponent(product.category)}`}
          className="hover:text-brand-900 transition-colors"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-brand-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* CUSTOM NOTICE BANNER (IF ADMIN SPECIFIED) */}
      {product.customNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{product.customNotice}</span>
        </div>
      )}

      {/* MAIN PRODUCT SHOWCASE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
        {/* LEFT: INTERACTIVE PHOTO GALLERY */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-[32px] overflow-hidden bg-white border border-canvas-border shadow-cozy group">
            <Image
              src={selectedImage || galleryImages[0]}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />

            {/* STATUS / BADGES */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
              {isSoldOut ? (
                <span className="px-3.5 py-1.5 bg-rose-600 text-white text-xs font-bold tracking-wider uppercase rounded-full shadow-md">
                  SOLD OUT
                </span>
              ) : (
                <>
                  {product.isBestseller && (
                    <span className="px-3 py-1 bg-brand-900 text-cream-200 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                      Bestseller
                    </span>
                  )}
                  {product.isNewArrival && (
                    <span className="px-3 py-1 bg-brand-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                      New Launch
                    </span>
                  )}
                  {discountPercent && (
                    <span className="px-2.5 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-full shadow-xs">
                      {discountPercent}% OFF
                    </span>
                  )}
                </>
              )}
            </div>

            {/* WISHLIST & SHARE BUTTONS */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all ${isInWishlist(product.id)
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/90 backdrop-blur-xs text-brand-900 hover:bg-white hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-white' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share product"
                className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-xs text-brand-900 hover:bg-white flex items-center justify-center shadow-md transition-all"
                title="Copy Product Link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* GALLERY THUMBNAILS */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${selectedImage === img
                      ? 'border-brand-600 ring-2 ring-brand-300 scale-102'
                      : 'border-canvas-border hover:border-brand-400 opacity-80 hover:opacity-100'
                    }`}
                >
                  <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* SHARE TOAST */}
          {shareToast && (
            <div className="p-3 bg-brand-900 text-white text-xs rounded-xl flex items-center justify-center gap-2 shadow-cozy animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Product link copied to clipboard!</span>
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS, PRICING & ACTIONS */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-brand-500 font-bold uppercase tracking-widest">
              <span>{product.category}</span>
              <span className="text-gray-400 font-mono font-normal">SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-2 leading-tight">
              {product.name}
            </h1>

            {/* RATING & REVIEWS */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.floor(product.averageRating || 5) ? 'fill-amber-400' : 'text-gray-300'
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-brand-900">
                {product.averageRating || 5.0} ({product.reviewCount || 0} reviews)
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> In Artisanal Collection
              </span>
            </div>
          </div>

          {/* PRICING CARD */}
          <div className="p-5 bg-brand-50/70 rounded-3xl border border-brand-100 flex items-center justify-between shadow-2xs">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-bold text-brand-900">
                  ₹{currentPrice.toLocaleString('en-IN')}
                </span>
                {product.discountPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    ₹{originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent && (
                  <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-bold text-xs shadow-xs">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
              <span className="text-xs text-emerald-800 font-medium mt-1 block">
                ✓ Inclusive of all taxes • Free shipping across India on orders above ₹999
              </span>
            </div>

            <div className="text-right">
              <span
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full inline-block shadow-2xs ${isSoldOut
                    ? 'bg-rose-100 text-rose-700'
                    : product.stock <= 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
              >
                {isSoldOut
                  ? 'Sold Out'
                  : product.stock <= 5
                    ? `Only ${product.stock} left in stock!`
                    : 'In Stock & Ready'}
              </span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {/* COLOR SWATCHES */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Color Shade: <span className="text-brand-900 font-bold ml-1">{selectedColor}</span>
                </label>
                {activeVariant?.priceModifier ? (
                  <span className="text-xs font-bold text-brand-700">
                    +{activeVariant.priceModifier > 0 ? `₹${activeVariant.priceModifier}` : ''}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectColor(v)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-medium transition-all ${selectedColor === v.colorName
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-300 shadow-xs'
                        : 'border-canvas-border hover:border-brand-300 text-gray-700 bg-white'
                      }`}
                  >
                    <span
                      style={{ backgroundColor: v.colorHex || '#9D7BB0' }}
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs inline-block"
                    />
                    <span>{v.colorName}</span>
                    {v.sizeName && v.sizeName !== 'Standard' && (
                      <span className="text-[10px] text-gray-400 font-normal">({v.sizeName})</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SIZE OPTIONS IF MULTIPLE SIZES */}
          {product.variants &&
            Array.from(new Set(product.variants.map((v) => v.sizeName))).filter(
              (sz) => sz && sz !== 'Standard'
            ).length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Size: <span className="text-brand-900 font-bold ml-1">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(product.variants.map((v) => v.sizeName))).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all ${selectedSize === sz
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold ring-1 ring-brand-400'
                          : 'border-canvas-border hover:border-brand-300 text-gray-700 bg-white'
                        }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* PURCHASE CONTROLS */}
          {isSoldOut ? (
            /* SOLD OUT / RESTOCK NOTIFICATION BOX */
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <Bell className="w-4 h-4 text-rose-600" />
                <span>Currently Out of Stock</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Our master artisans are preparing the next batch of yarn for this creation. Leave your email to be the first to know when it restocks!
              </p>
              {restockRegistered ? (
                <div className="p-3 bg-white rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" /> You are on the priority restock notification list!
                </div>
              ) : (
                <form onSubmit={handleRestockSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email for restock alerts"
                    value={restockEmail}
                    onChange={(e) => setRestockEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-rose-300 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* QUANTITY ADJUSTER */}
                <div className="flex items-center justify-between sm:justify-start border border-canvas-border bg-white rounded-2xl p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl hover:bg-canvas-subtle font-bold text-brand-900 flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-brand-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-xl hover:bg-canvas-subtle font-bold text-brand-900 flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* ADD TO CART */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-cozy hover:shadow-cozy-lg transition-all active:scale-95"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </button>

                {/* BUY NOW */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-4 px-7 rounded-2xl bg-brand-900 hover:bg-black text-white font-bold text-sm shadow-cozy transition-all active:scale-95"
                >
                  Buy Now
                </button>
              </div>

              {addedToast && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
                  <span className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Added to your shopping cart!
                  </span>
                  <Link href="/cart" className="font-bold underline text-emerald-900">
                    View Cart & Checkout →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* PRODUCT SPECIFICATIONS GRID */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-canvas-border text-xs">
            <div className="p-3.5 rounded-2xl bg-white border border-canvas-border shadow-2xs">
              <span className="text-gray-400 block font-medium">🧶 Materials</span>
              <span className="font-bold text-brand-900 mt-1 block">{product.materials}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-canvas-border shadow-2xs">
              <span className="text-gray-400 block font-medium">📐 Dimensions</span>
              <span className="font-bold text-brand-900 mt-1 block">{product.dimensions}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-canvas-border shadow-2xs">
              <span className="text-gray-400 block font-medium">⏱️ Crafting Prep Time</span>
              <span className="font-bold text-brand-900 mt-1 block">
                {product.prepTimeDays} Business Days
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-canvas-border shadow-2xs">
              <span className="text-gray-400 block font-medium">🧼 Care Guide</span>
              <span className="font-bold text-brand-900 mt-1 block line-clamp-2" title={product.careInstructions}>
                {product.careInstructions}
              </span>
            </div>
          </div>

          {/* ARTISANAL HIGHLIGHTS & PROMISES */}
          <div className="p-5 bg-white rounded-3xl border border-canvas-border space-y-3 shadow-2xs">
            <h4 className="font-serif font-bold text-sm text-brand-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Why This Creation is Special</span>
            </h4>
            <div className="space-y-2">
              {highlights.map((h, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOM CROCHET INQUIRY / VARIATION CALLOUT */}
      <section className="mt-16 bg-gradient-to-r from-brand-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-cozy">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-cream-300 text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 justify-center sm:justify-start">
            <Gift className="w-4 h-4" /> Want a Custom Colorway or Name Tag?
          </span>
          <h3 className="font-serif text-xl sm:text-2xl font-bold">
            We can customize this exact piece for your special occasion.
          </h3>
          <p className="text-xs text-cream-100/90 max-w-xl">
            Choose bespoke bridal colors, custom plush accessories, or personalized letter tags woven into the yarn.
          </p>
        </div>
        <Link
          href="/custom-orders"
          className="px-6 py-3 rounded-full bg-cream-200 text-brand-900 font-bold text-xs hover:bg-white transition-all shrink-0 shadow-md"
        >
          Request Custom Variation →
        </Link>
      </section>

      {/* REVIEWS & COMMUNITY FEEDBACK */}
      <section className="mt-16 sm:mt-24 pt-12 border-t border-canvas-border">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-bold text-brand-900">Artisan Reviews & Feedback</h2>
          <p className="text-xs text-gray-500 mt-1">
            Read authentic feedback from fellow crochet collectors across India.
          </p>

          {/* NEW REVIEW SUBMISSION FORM */}
          <form
            onSubmit={handleReviewSubmit}
            className="mt-6 bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4"
          >
            <h3 className="font-serif font-bold text-sm text-brand-900">Leave Your Review</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Your Rating:</span>
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setNewRating(num)}
                    className="p-1 focus:outline-none"
                    aria-label={`Rate ${num} stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${num <= newRating ? 'fill-amber-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              rows={3}
              placeholder="How do you love the yarn texture, stitch quality, or packaging?"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 text-brand-900 resize-none"
            />
            <div className="flex items-center justify-between">
              {reviewSubmitted && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Thank you! Your review has been added.
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" /> Submit Review
              </button>
            </div>
          </form>

          {/* REVIEWS LIST */}
          <div className="mt-8 space-y-4">
            {reviews.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-canvas-border text-center text-xs text-gray-400">
                Be the first to leave a review for this handcrafted creation!
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-5 bg-white rounded-2xl border border-canvas-border shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-brand-900">{rev.userName}</span>
                    <div className="flex text-amber-400 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
                  <span className="text-[10px] text-gray-400 block">Verified Buyer • Recently</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* RELATED HANDCRAFTED CREATIONS */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 sm:mt-24 pt-12 border-t border-canvas-border">
          <h2 className="font-serif text-2xl font-bold text-brand-900 mb-8">
            You Might Also Adore
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
