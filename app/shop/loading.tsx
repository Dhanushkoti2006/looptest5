import React from 'react';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="h-3 w-32 bg-brand-200 rounded-full mx-auto" />
        <div className="h-8 w-64 bg-slate-200 rounded-xl mx-auto" />
        <div className="h-4 w-80 bg-slate-100 rounded-md mx-auto" />
      </div>

      {/* Category Pills Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-2 justify-start sm:justify-center">
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
