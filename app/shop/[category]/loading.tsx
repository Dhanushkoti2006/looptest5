import React from 'react';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-3 w-40 bg-slate-200 rounded-md" />

      {/* Hero Banner Skeleton */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-brand-900 via-brand-800 to-purple-950 p-8 sm:p-12 text-white">
        <div className="space-y-3 max-w-xl">
          <div className="h-3 w-28 bg-cream-200/40 rounded-full" />
          <div className="h-9 w-64 bg-white/40 rounded-xl" />
          <div className="h-4 w-80 bg-white/20 rounded-md" />
        </div>
      </div>

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-white rounded-full border border-canvas-border shrink-0" />
        ))}
      </div>

      {/* Grid of Product Skeletons */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
