'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import { Heart, ShoppingBag, Star, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [added, setAdded] = useState(false);
  const [activeImage, setActiveImage] = useState(
    product.images[0] || '/images/loop-and-love-logo.jpg'
  );

  const isSoldOut = product.status === 'SOLD_OUT' || product.stock <= 0;
  const isWishlisted = isInWishlist(product.id);
  const productHref = `/product/${product.slug || product.id}`;

  const currentPrice = product.discountPrice || product.price;
  const originalPrice = product.price;
  const discountPercent =
    product.discountPrice && originalPrice > product.discountPrice
      ? Math.round(((originalPrice - product.discountPrice) / originalPrice) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isSoldOut) return;

    addToCart(product, undefined, undefined, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative bg-white rounded-3xl border border-canvas-border hover:border-brand-200 shadow-cozy hover:shadow-cozy-lg transition-all duration-300 flex flex-col overflow-hidden">
      {/* IMAGE CONTAINER */}
      <Link href={productHref} className="relative block aspect-square overflow-hidden bg-brand-50">
        <Image
          src={activeImage}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover object-center group-hover:scale-105 transition-transform duration-500 ${
            isSoldOut ? 'grayscale-30 opacity-80' : ''
          }`}
        />

        {/* BADGES */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isSoldOut ? (
            <span className="px-3 py-1 bg-rose-600 text-white text-[11px] font-bold tracking-wider uppercase rounded-full shadow-sm">
              SOLD OUT
            </span>
          ) : (
            <>
              {product.isBestseller && (
                <span className="px-2.5 py-1 bg-brand-900 text-cream-200 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                  Bestseller
                </span>
              )}
              {product.isNewArrival && (
                <span className="px-2.5 py-1 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                  New Launch
                </span>
              )}
              {discountPercent && (
                <span className="px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-xs">
                  {discountPercent}% OFF
                </span>
              )}
            </>
          )}
        </div>

        {/* WISHLIST BUTTON */}
        <button
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm z-10 ${
            isWishlisted
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 backdrop-blur-xs text-brand-900 hover:bg-white hover:text-rose-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>

        {/* PREPARATION TIME BADGE */}
        <div className="absolute bottom-2 left-2 sm:left-3 z-10">
          <span className="text-[9px] sm:text-[10px] font-medium bg-white/90 backdrop-blur-xs text-brand-800 px-1.5 sm:px-2 py-0.5 rounded-md shadow-xs">
            ⏱️ {product.prepTimeDays}d craft
          </span>
        </div>
      </Link>

      {/* CONTENT */}
      <div className="p-3 sm:p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="text-brand-600 font-medium text-[10px] sm:text-[11px] uppercase tracking-wider truncate max-w-[90px] sm:max-w-none">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-amber-500 font-semibold text-[11px] sm:text-xs">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.averageRating}</span>
              <span className="text-gray-400 text-[10px] hidden sm:inline">({product.reviewCount})</span>
            </div>
          </div>

          {/* Title */}
          <Link href={productHref} className="block">
            <h3 className="font-serif text-xs sm:text-base font-semibold text-brand-900 line-clamp-2 hover:text-brand-600 transition-colors leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Color Swatches */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 hidden sm:flex">
              <span className="text-[11px] text-gray-400">Colors:</span>
              <div className="flex items-center gap-1">
                {product.variants.slice(0, 4).map((variant) => (
                  <span
                    key={variant.id}
                    title={variant.colorName}
                    style={{ backgroundColor: variant.colorHex || '#9D7BB0' }}
                    className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs inline-block"
                  />
                ))}
                {product.variants.length > 4 && (
                  <span className="text-[10px] text-gray-500">+{product.variants.length - 4}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-canvas-border/80 flex items-center justify-between gap-1">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <span className="text-sm sm:text-lg font-bold text-brand-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {product.discountPrice && (
                <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-emerald-700 font-medium">Taxes incl.</span>
          </div>

          {isSoldOut ? (
            <Link
              href={productHref}
              className="text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-100 text-gray-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
            >
              Notify
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center gap-1 transition-all shadow-xs shrink-0 ${
                added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" /> Add
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
