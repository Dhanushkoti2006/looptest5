import React from 'react';
import ProductCardSkeleton from '@/components/ProductCardSkeleton';

export default function HomeLoading() {
  return (
    <div className="space-y-12 sm:space-y-16 pb-16 animate-pulse max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
      {/* 1. Hero Slideshow Skeleton */}
      <div className="w-full h-[360px] sm:h-[460px] md:h-[520px] rounded-2xl sm:rounded-3xl bg-gradient-to-r from-brand-900/10 via-brand-50 to-brand-100/30 flex items-center p-6 sm:p-12">
        <div className="max-w-md space-y-4">
          <div className="h-5 w-32 bg-brand-200/60 rounded-full" />
          <div className="h-10 w-3/4 bg-brand-300/40 rounded-xl" />
          <div className="h-4 w-full bg-brand-100 rounded-md" />
          <div className="h-10 w-36 bg-brand-400/40 rounded-full mt-2" />
        </div>
      </div>

      {/* 2. Category Showcase Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-brand-200 rounded-full" />
            <div className="h-7 w-48 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-4 w-24 bg-slate-100 rounded-md" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-canvas-border flex flex-col items-center space-y-2">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50" />
              <div className="h-3 w-16 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Featured Creations Skeleton */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-28 bg-brand-200 rounded-full" />
          <div className="h-7 w-56 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
