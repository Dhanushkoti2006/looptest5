import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getActiveProducts } from '@/lib/supabase/queries';
import ProductDetailClient from '@/components/ProductDetailClient';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const product = slug ? await getProductBySlug(slug) : null;
  if (!product) {
    return {
      title: 'Product Not Found | Loop & Love',
    };
  }
  return {
    title: `${product.name} | Loop & Love Handcrafted Crochet`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Loop & Love`,
      description: product.description.slice(0, 160),
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  const [product, relatedProducts] = await Promise.all([
    slug ? getProductBySlug(slug) : null,
    getActiveProducts({ limit: 4 }),
  ]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-brand-900">Handcrafted Creation Not Found</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          We could not locate this crochet product. It may have been archived, made inactive, or moved to a different category.
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
            className="px-6 py-2.5 rounded-full border border-canvas-border text-brand-900 text-xs font-semibold hover:bg-brand-50 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredRelated = relatedProducts.filter((p) => p.id !== product.id);

  return (
    <ProductDetailClient
      initialProduct={product}
      initialRelatedProducts={filteredRelated}
    />
  );
}
