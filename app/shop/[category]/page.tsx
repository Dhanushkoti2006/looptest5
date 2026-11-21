import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { getActiveCategories, getActiveProducts } from '@/lib/supabase/queries';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categorySlug = decodeURIComponent(params.category).toLowerCase().trim();

  const [categories, products] = await Promise.all([
    getActiveCategories(),
    getActiveProducts({ categorySlug }),
  ]);

  const currentCategory = categories.find(
    (c) => c.slug.toLowerCase() === categorySlug || c.id === categorySlug
  );

  const categoryName = currentCategory ? currentCategory.name : categorySlug.replace(/-/g, ' ');
  const categoryDesc = currentCategory?.description || 'Explore handcrafted crochet pieces made with milk cotton yarn.';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* BREADCRUMB */}
      <nav className="text-xs text-gray-400 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-brand-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-brand-900 transition-colors">
          Shop
        </Link>
        <span>/</span>
        <span className="text-brand-700 font-medium capitalize">{categoryName}</span>
      </nav>

      {/* HEADER HERO BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-brand-900 text-white p-8 sm:p-12 shadow-cozy">
        {currentCategory?.imageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image src={currentCategory.imageUrl} alt={categoryName} fill className="object-cover" />
          </div>
        )}
        <div className="relative z-10 max-w-2xl space-y-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cream-300 hover:text-white mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to All Collections
          </Link>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold capitalize">
            {categoryName}
          </h1>
          <p className="text-xs sm:text-sm text-cream-100/90 leading-relaxed">
            {categoryDesc}
          </p>
          <div className="pt-2 text-xs text-cream-300 font-medium">
            Showing {products.length} {products.length === 1 ? 'creation' : 'creations'}
          </div>
        </div>
      </div>

      {/* OTHER CATEGORY PILLS */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/shop"
          className="px-4 py-2 rounded-full border border-canvas-border text-xs font-semibold text-gray-600 hover:border-brand-500 hover:text-brand-900 shrink-0 transition-all"
        >
          All Collections
        </Link>
        {categories.map((c) => {
          const isActive = c.slug === categorySlug;
          return (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white border border-canvas-border text-gray-600 hover:border-brand-500 hover:text-brand-900'
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {/* PRODUCTS GRID / EMPTY STATE */}
      {products.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-canvas-border space-y-4 max-w-lg mx-auto p-8 shadow-2xs">
          <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-900">
            No creations found in {categoryName}
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Our artisans are currently handcrafting pieces for this collection. You can browse other collections or request a bespoke custom design!
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors"
            >
              Browse All Shop
            </Link>
            <Link
              href="/custom-orders"
              className="px-6 py-2.5 rounded-full border border-brand-300 text-brand-900 font-semibold text-xs hover:bg-brand-50 transition-colors"
            >
              Request Custom Order
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
