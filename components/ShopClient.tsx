'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { Product, Category } from '@/lib/types';
import { useCart } from '@/lib/CartContext';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  Sparkles,
  Heart,
  RotateCcw,
} from 'lucide-react';

interface ShopClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

function ShopContent({ initialProducts, initialCategories }: ShopClientProps) {
  const searchParams = useSearchParams();
  const { wishlist } = useCart();

  const [products] = useState<Product[]>(initialProducts);
  const [categories] = useState<Category[]>(initialCategories);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<number>(3000);
  const [availability, setAvailability] = useState<'all' | 'in-stock' | 'sold-out'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [showOnlyWishlist, setShowOnlyWishlist] = useState<boolean>(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Initialize from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const wishlistParam = searchParams.get('wishlist');

    setSelectedCategory(categoryParam || 'all');
    setSearchQuery(searchParam || '');
    setShowOnlyWishlist(wishlistParam === 'true');
  }, [searchParams]);

  // Filter & sort logic
  const filteredProducts = products.filter((product) => {
    // Category filter
    if (selectedCategory !== 'all') {
      const target = selectedCategory.toLowerCase().trim();
      const catId = (product.categoryId || '').toLowerCase().trim();
      const catName = (product.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const tags = (product.tags || []).map((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

      const matchesCategory =
        catId === target ||
        catName === target ||
        catName.includes(target) ||
        target.includes(catName) ||
        tags.includes(target);

      if (!matchesCategory) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.tags.some((t) => t.toLowerCase().includes(q));
      if (!matches) return false;
    }

    // Max Price filter
    const effectivePrice = product.discountPrice || product.price;
    if (effectivePrice > priceRange) return false;

    // Availability
    if (availability === 'in-stock' && (product.status === 'SOLD_OUT' || product.stock <= 0)) {
      return false;
    }
    if (availability === 'sold-out' && product.status !== 'SOLD_OUT' && product.stock > 0) {
      return false;
    }

    // Wishlist only
    if (showOnlyWishlist && !wishlist.includes(product.id)) {
      return false;
    }

    return true;
  });

  // Sort
  filteredProducts.sort((a, b) => {
    const priceA = a.discountPrice || a.price;
    const priceB = b.discountPrice || b.price;

    if (sortBy === 'price-low') return priceA - priceB;
    if (sortBy === 'price-high') return priceB - priceA;
    if (sortBy === 'popular') return (b.reviewCount || 0) - (a.reviewCount || 0);
    if (sortBy === 'rating') return (b.averageRating || 5) - (a.averageRating || 5);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange(3000);
    setAvailability('all');
    setSortBy('newest');
    setShowOnlyWishlist(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-brand-100 via-brand-50 to-cream-100 rounded-3xl p-6 sm:p-10 mb-8 border border-brand-200/60 shadow-xs">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
            Handcrafted with 100% Milk Cotton
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">
            Artisanal Crochet Catalog
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            Explore our handcrafted collections of everlasting flower bouquets, vintage-modern tote bags, snuggly amigurumi toys, and aesthetic accessories.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* DESKTOP SIDEBAR FILTERS */}
        <aside className="hidden lg:block w-72 shrink-0 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h3 className="font-serif font-bold text-base text-brand-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-brand-500" /> Filters
              </h3>
              <button
                onClick={resetFilters}
                className="text-xs text-brand-600 hover:text-brand-900 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">
                Categories
              </label>
              <div className="space-y-1.5">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'hover:bg-brand-50 text-brand-900'
                  }`}
                >
                  All Categories ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-brand-600 text-white font-semibold'
                        : 'hover:bg-brand-50 text-brand-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                <span>Max Price</span>
                <span className="text-brand-900 font-bold text-sm">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                <span>₹300</span>
                <span>₹3,000+</span>
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5 block">
                Stock Status
              </label>
              <div className="grid grid-cols-3 gap-1 bg-canvas-subtle p-1 rounded-xl text-xs">
                <button
                  onClick={() => setAvailability('all')}
                  className={`py-1.5 rounded-lg font-medium transition-colors ${
                    availability === 'all' ? 'bg-white shadow-2xs font-semibold text-brand-900' : 'text-gray-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setAvailability('in-stock')}
                  className={`py-1.5 rounded-lg font-medium transition-colors ${
                    availability === 'in-stock' ? 'bg-white shadow-2xs font-semibold text-brand-900' : 'text-gray-500'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setAvailability('sold-out')}
                  className={`py-1.5 rounded-lg font-medium transition-colors ${
                    availability === 'sold-out' ? 'bg-white shadow-2xs font-semibold text-brand-900' : 'text-gray-500'
                  }`}
                >
                  Sold Out
                </button>
              </div>
            </div>

            {/* Wishlist Toggle */}
            <div className="pt-2 border-t border-canvas-border">
              <button
                onClick={() => setShowOnlyWishlist(!showOnlyWishlist)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  showOnlyWishlist
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'border-canvas-border text-brand-900 hover:bg-canvas-subtle'
                }`}
              >
                <Heart className={`w-4 h-4 ${showOnlyWishlist ? 'fill-rose-500 text-rose-500' : ''}`} />
                {showOnlyWishlist ? 'Showing Wishlist Only' : `My Wishlist (${wishlist.length})`}
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN PRODUCT GRID & CONTROLS */}
        <main className="flex-1">
          {/* TOP CONTROLS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-canvas-border shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-canvas-subtle text-xs font-semibold text-brand-900 border border-canvas-border"
              >
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Showing <strong className="text-brand-900">{filteredProducts.length}</strong> creations
              </span>
            </div>

            {/* Search within shop & Sort */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <input
                  type="text"
                  placeholder="Search catalog..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-3 text-xs bg-canvas-subtle border border-canvas-border rounded-xl font-medium text-brand-900 focus:outline-none focus:border-brand-500"
              >
                <option value="newest">Sort: Newest Launches</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* ACTIVE FILTER PILLS */}
          {(selectedCategory !== 'all' || searchQuery || showOnlyWishlist || availability !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-gray-400">Active filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 text-xs rounded-full">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 text-xs rounded-full">
                  Search: &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {showOnlyWishlist && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 text-xs rounded-full">
                  Wishlist Only
                  <button onClick={() => setShowOnlyWishlist(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {availability !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-800 text-xs rounded-full">
                  Status: {availability}
                  <button onClick={() => setAvailability('all')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-brand-600 underline font-medium hover:text-brand-900 ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* PRODUCTS GRID */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-canvas-border p-8">
              <Sparkles className="w-12 h-12 text-brand-400 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-brand-900">No matching crochet items found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                We couldn&apos;t find any products matching your specific filters. Try clearing them or request a custom order!
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={resetFilters}
                  className="px-5 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE FILTER MODAL */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-canvas-border">
              <h3 className="font-serif font-bold text-lg text-brand-900">Filters</h3>
              <button onClick={() => setMobileFilterOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 block">
                Category
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                    selectedCategory === 'all' ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-brand-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.slug);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs ${
                      selectedCategory === c.slug ? 'bg-brand-600 text-white font-semibold' : 'hover:bg-brand-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price slider */}
            <div>
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                <span>Max Price</span>
                <span className="text-brand-900 font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="300"
                max="3000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-brand-600 cursor-pointer"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-3 bg-brand-600 text-white font-semibold rounded-2xl text-xs"
            >
              Apply Filters ({filteredProducts.length} items)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopClient({ initialProducts, initialCategories }: ShopClientProps) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading shop...</div>}>
      <ShopContent initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
