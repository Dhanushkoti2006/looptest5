import React from 'react';

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-canvas-border shadow-cozy p-3 sm:p-5 flex flex-col space-y-3 animate-pulse">
      {/* Image Skeleton */}
      <div className="aspect-square w-full rounded-2xl bg-brand-50" />

      {/* Category & Rating Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 bg-brand-100/70 rounded-full" />
        <div className="h-3 w-10 bg-amber-100 rounded-full" />
      </div>

      {/* Title Skeleton */}
      <div className="space-y-1.5">
        <div className="h-4 w-4/5 bg-slate-200 rounded-md" />
        <div className="h-4 w-3/5 bg-slate-100 rounded-md" />
      </div>

      {/* Price & Button Skeleton */}
      <div className="pt-2 flex items-center justify-between border-t border-canvas-border">
        <div className="h-5 w-16 bg-brand-200/60 rounded-md" />
        <div className="h-8 w-8 bg-brand-100 rounded-full" />
      </div>
    </div>
  );
}
