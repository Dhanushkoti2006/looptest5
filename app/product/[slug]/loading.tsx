import React from 'react';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function ProductDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-pulse space-y-12">
      {/* Breadcrumb */}
      <div className="h-3 w-48 bg-slate-200 rounded-md" />

      {/* 2-Column Product Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Left: Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-square w-full rounded-[32px] bg-brand-50 border border-canvas-border" />
          <div className="flex gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-20 h-20 rounded-2xl bg-brand-50 border border-canvas-border shrink-0" />
            ))}
          </div>
        </div>

        {/* Right: Info & Purchase Skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="h-3 w-28 bg-brand-200 rounded-full" />
            <div className="h-9 w-4/5 bg-slate-300 rounded-xl" />
            <div className="h-5 w-32 bg-amber-100 rounded-md" />
          </div>

          <div className="h-8 w-36 bg-brand-300/60 rounded-lg" />

          <div className="space-y-2 pt-2 border-t border-canvas-border">
            <div className="h-4 w-full bg-slate-100 rounded-md" />
            <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
            <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-4">
            <div className="h-12 w-32 bg-slate-200 rounded-full" />
            <div className="h-12 flex-1 bg-brand-500/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="pt-8 space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
