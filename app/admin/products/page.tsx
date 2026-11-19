'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Product, Category, ProductStatus, ProductVariant } from '@/lib/types';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Palette,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFeaturedOnly, setFilterFeaturedOnly] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'variants' | 'specs'>('basic');
  const [successToast, setSuccessToast] = useState('');

  // Form Fields - Basic
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(999);
  const [discountPrice, setDiscountPrice] = useState<number | undefined>(undefined);
  const [stock, setStock] = useState<number>(10);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<ProductStatus>('AVAILABLE');
  const [isFeatured, setIsFeatured] = useState(true);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [sku, setSku] = useState('');

  // Form Fields - Images
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Form Fields - Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Form Fields - Specs & Highlights
  const [materials, setMaterials] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [prepTimeDays, setPrepTimeDays] = useState<number>(2);
  const [careInstructions, setCareInstructions] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [highlightsInput, setHighlightsInput] = useState('');
  const [customNotice, setCustomNotice] = useState('');

  const fetchProducts = () => {
    setLoading(true);

    try {
      const local = localStorage.getItem('loop_custom_products');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false);
        }
      }
    } catch {}

    Promise.all([
      fetch('/api/products', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/categories', { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([prodData, catData]) => {
        if (prodData.products && Array.isArray(prodData.products)) {
          setProducts((current) => {
            try {
              const local = localStorage.getItem('loop_custom_products');
              if (local) {
                const custom = JSON.parse(local) as Product[];
                if (Array.isArray(custom)) {
                  const customIds = new Set(custom.map((c) => c.id));
                  const serverOnly = prodData.products.filter((p: Product) => !customIds.has(p.id));
                  return [...custom, ...serverOnly];
                }
              }
            } catch {}
            return prodData.products;
          });
        }
        if (catData.categories) {
          setCategories(catData.categories);
          if (catData.categories[0] && !category) setCategory(catData.categories[0].name);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const autoGenerateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setActiveTab('basic');
    setName('');
    setSlug('');
    setDescription('');
    setPrice(999);
    setDiscountPrice(undefined);
    setStock(10);
    setCategory(categories[0]?.name || 'Crochet Flowers & Bouquets');
    setStatus('AVAILABLE');
    setIsFeatured(true);
    setIsBestseller(false);
    setIsNewArrival(true);
    setSku(`LL-PROD-${Date.now().toString().slice(-4)}`);
    setImages(['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80']);
    setNewImageUrl('');
    setVariants([
      {
        id: `v-${Date.now()}-1`,
        productId: '',
        colorName: 'Standard',
        colorHex: '#9D7BB0',
        sizeName: 'Standard',
        priceModifier: 0,
        stock: 10,
        sku: `LL-VAR-${Date.now().toString().slice(-4)}`,
      },
    ]);
    setMaterials('100% Premium Milk Cotton Yarn');
    setDimensions('Handmade Standard');
    setPrepTimeDays(2);
    setCareInstructions('Gentle hand wash with cold water. Lay flat in shade to dry.');
    setTagsInput('Handmade, Boutique, Crochet');
    setHighlightsInput('100% Hand-stitched with love by women artisans\nUltra-soft hypoallergenic milk cotton yarn\nGift-ready packaging with satin ribbon');
    setCustomNotice('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setActiveTab('basic');
    setName(p.name);
    setSlug(p.slug || autoGenerateSlug(p.name));
    setDescription(p.description || '');
    setPrice(p.price);
    setDiscountPrice(p.discountPrice);
    setStock(p.stock);
    setCategory(p.category);
    setStatus(p.status);
    setIsFeatured(Boolean(p.isFeatured));
    setIsBestseller(p.isBestseller);
    setIsNewArrival(p.isNewArrival);
    setSku(p.sku || `LL-PROD-${p.id.slice(-4)}`);
    setImages(p.images && p.images.length > 0 ? [...p.images] : ['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80']);
    setNewImageUrl('');
    setVariants(
      p.variants && p.variants.length > 0
        ? [...p.variants]
        : [
            {
              id: `v-${Date.now()}`,
              productId: p.id,
              colorName: 'Standard',
              colorHex: '#9D7BB0',
              sizeName: 'Standard',
              priceModifier: 0,
              stock: p.stock || 10,
              sku: `LL-VAR-${Date.now().toString().slice(-4)}`,
            },
          ]
    );
    setMaterials(p.materials || '100% Premium Milk Cotton Yarn');
    setDimensions(p.dimensions || 'Handmade Standard');
    setPrepTimeDays(p.prepTimeDays || 2);
    setCareInstructions(p.careInstructions || 'Gentle hand wash. Lay flat to dry.');
    setTagsInput(p.tags ? p.tags.join(', ') : 'Handmade, Crochet');
    setHighlightsInput(
      p.highlights && p.highlights.length > 0
        ? p.highlights.join('\n')
        : '100% Handcrafted by women artisans\nPremium hypoallergenic milk cotton\nGift-ready packaging with satin ribbon'
    );
    setCustomNotice(p.customNotice || '');
    setIsModalOpen(true);
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImages([...images, newImageUrl.trim()]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (index: number) => {
    if (images.length <= 1) {
      alert('Product must have at least one image.');
      return;
    }
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const selected = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([selected, ...rest]);
  };

  const handleAddVariant = () => {
    const newV: ProductVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: editingProduct?.id || '',
      colorName: 'New Color',
      colorHex: '#9D7BB0',
      sizeName: 'Standard',
      priceModifier: 0,
      stock: 5,
      sku: `LL-VAR-${Date.now().toString().slice(-4)}`,
    };
    setVariants([...variants, newV]);
  };

  const handleUpdateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      alert('Keep at least one color/size variant.');
      return;
    }
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Product title is required.');
      return;
    }
    if (!price || Number(price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    const finalSlug = slug.trim() ? autoGenerateSlug(slug) : autoGenerateSlug(name);
    const selectedCategory = category || categories[0]?.name || 'Crochet Flowers & Bouquets';
    const foundCat = categories.find((c) => c.name === selectedCategory);
    const categoryId = foundCat?.id ?? 'cat-custom';

    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const highlightsArray = highlightsInput
      .split('\n')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const payload = {
      name: name.trim(),
      slug: finalSlug,
      description: description.trim(),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock || 0),
      category: selectedCategory,
      categoryId,
      prepTimeDays: Number(prepTimeDays || 2),
      materials: materials.trim() || '100% Premium Milk Cotton Yarn',
      dimensions: dimensions.trim() || 'Standard Handmade Dimension',
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80'],
      status: Number(stock) === 0 ? 'SOLD_OUT' : status,
      isFeatured,
      isBestseller,
      isNewArrival,
      sku: sku.trim() || `LL-PROD-${Date.now().toString().slice(-4)}`,
      careInstructions: careInstructions.trim() || 'Gentle hand wash. Lay flat to dry.',
      tags: tagsArray.length > 0 ? tagsArray : ['Handmade', 'Boutique'],
      highlights: highlightsArray,
      customNotice: customNotice.trim(),
      variants: variants.map((v) => ({
        ...v,
        productId: editingProduct?.id || '',
        priceModifier: Number(v.priceModifier || 0),
        stock: Number(v.stock || 0),
      })),
    };

    try {
      let savedProduct: Product | null = null;
      if (editingProduct) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...payload }),
        });
        const data = await res.json();
        if (data.product) {
          savedProduct = data.product;
        } else if (!data.success) {
          alert(data.message || 'Failed to update product.');
          return;
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.product) {
          savedProduct = data.product;
        } else if (!data.success) {
          alert(data.message || 'Failed to create product.');
          return;
        }
      }

      const prodToSave: Product = savedProduct || {
        id: editingProduct?.id || `prod-${Date.now()}`,
        createdAt: editingProduct?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        averageRating: editingProduct?.averageRating || 5.0,
        reviewCount: editingProduct?.reviewCount || 0,
        ...payload,
      };

      setProducts((prev) => {
        const next = editingProduct
          ? prev.map((p) => (p.id === prodToSave.id ? prodToSave : p))
          : [prodToSave, ...prev];
        try {
          localStorage.setItem('loop_custom_products', JSON.stringify(next));
        } catch {}
        return next;
      });

      setIsModalOpen(false);
      setSuccessToast(editingProduct ? 'Product & specific page customized successfully!' : 'New product created successfully!');
      setTimeout(() => setSuccessToast(''), 4000);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      alert('Error saving product. Please check console.');
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const nextFeatured = !product.isFeatured;
    const updated = products.map((p) =>
      p.id === product.id ? { ...p, isFeatured: nextFeatured } : p
    );
    setProducts(updated);
    try {
      localStorage.setItem('loop_custom_products', JSON.stringify(updated));
    } catch {}

    try {
      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, isFeatured: nextFeatured }),
      });
    } catch (err) {
      console.error('Error toggling featured:', err);
    }
  };

  const handleStockQuickUpdate = async (id: string, newStock: number) => {
    await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        stock: newStock,
        status: newStock <= 0 ? 'SOLD_OUT' : 'AVAILABLE',
      }),
    });
    fetchProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      fetchProducts();
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    const matchesFeatured = !filterFeaturedOnly || p.isFeatured;
    return matchesSearch && matchesCat && matchesFeatured;
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ADD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customize specific product detail pages, color swatches, gallery images, pricing, and stock.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Crochet Creation
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by title, SKU, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterFeaturedOnly(false)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              !filterFeaturedOnly ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterFeaturedOnly(true)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              filterFeaturedOnly ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Homepage Spotlight ({products.filter((p) => p.isFeatured).length})
          </button>

          <span className="text-slate-300 mx-1">|</span>
          <span className="text-slate-400">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Product & URL</th>
                <th className="py-3 px-6">Category</th>
                <th className="py-3 px-6">Price</th>
                <th className="py-3 px-6">Stock Level</th>
                <th className="py-3 px-6 text-center">Homepage Spotlight</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                        <Image src={prod.images[0] || '/images/loop-and-love-logo.jpg'} alt={prod.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                          <span className="text-slate-300">•</span>
                          <Link
                            href={`/product/${prod.slug}`}
                            target="_blank"
                            className="text-[10px] text-purple-700 hover:text-purple-900 font-medium flex items-center gap-0.5 underline"
                            title="Open live customer page"
                          >
                            <span>/product/{prod.slug}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6 font-medium text-slate-600">{prod.category}</td>

                  <td className="py-4 px-6 font-bold text-slate-900">
                    ₹{prod.discountPrice || prod.price}
                    {prod.discountPrice && (
                      <span className="text-[10px] text-slate-400 line-through block">
                        ₹{prod.price}
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={prod.stock}
                        onChange={(e) => handleStockQuickUpdate(prod.id, Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-900"
                      />
                      {prod.stock === 0 && (
                        <span className="text-[10px] text-red-600 font-bold">SOLD OUT</span>
                      )}
                      {prod.stock > 0 && prod.stock <= 5 && (
                        <span className="text-[10px] text-amber-600 font-bold">Low</span>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(prod)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                        prod.isFeatured
                          ? 'bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 hover:text-slate-700'
                      }`}
                      title={prod.isFeatured ? 'Remove from Homepage Spotlight' : 'Add to Homepage Spotlight'}
                    >
                      {prod.isFeatured ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 fill-purple-600" />
                          <span>Featured</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                          <span>Add to Home</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        prod.status === 'SOLD_OUT'
                          ? 'bg-red-100 text-red-800'
                          : prod.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {prod.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/product/${prod.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg hover:bg-purple-50 text-slate-400 hover:text-purple-700"
                        title="View Live Page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(prod)}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold flex items-center gap-1.5 transition-colors"
                        title="Customize Specific Product Page"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPREHENSIVE PRODUCT & PAGE CUSTOMIZER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 max-h-[92vh] flex flex-col shadow-2xl border border-slate-200">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
              <div>
                <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-purple-700" />
                  <span>{editingProduct ? `Customize Page: ${name || 'Product'}` : 'Create New Product Page'}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure specific product details, gallery images, color swatches, and page highlights.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 overflow-x-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'basic' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>1. Core Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('images')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'images' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>2. Gallery Images ({images.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('variants')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'variants' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>3. Color & Size Swatches ({variants.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeTab === 'specs' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>4. Specs & Page Highlights</span>
              </button>
            </div>

            {/* FORM CONTENT */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto py-5 space-y-5 text-xs pr-1">
              {/* TAB 1: CORE DETAILS */}
              {activeTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Handmade Spiderman Plush Amigurumi"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (!editingProduct) {
                          setSlug(autoGenerateSlug(e.target.value));
                        }
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Specific Page URL Handle / Slug *</label>
                      <button
                        type="button"
                        onClick={() => setSlug(autoGenerateSlug(name))}
                        className="text-[11px] text-purple-700 hover:underline font-semibold"
                      >
                        Auto-generate from title
                      </button>
                    </div>
                    <div className="flex items-center">
                      <span className="p-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 font-mono text-xs">
                        /product/
                      </span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(autoGenerateSlug(e.target.value))}
                        placeholder="spiderman-toy"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-r-xl focus:outline-none focus:border-purple-600 font-mono text-xs"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      This is the exact URL customer will visit when they click the product image.
                    </p>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description *</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Artisan description detailing yarn texture, handcrafted charm, and gifting appeal..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Optional"
                        value={discountPrice || ''}
                        onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">SKU Code</label>
                      <input
                        type="text"
                        value={sku}
                        onChange={(e) => setSku(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-mono text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-medium"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as ProductStatus)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 font-medium"
                      >
                        <option value="AVAILABLE">AVAILABLE (In Stock & Orderable)</option>
                        <option value="SOLD_OUT">SOLD_OUT (Shows Restock Alert Box)</option>
                        <option value="COMING_SOON">COMING_SOON</option>
                        <option value="HIDDEN">HIDDEN (Draft)</option>
                      </select>
                    </div>
                  </div>

                  {/* SPOTLIGHT TOGGLES */}
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-900">
                      <input
                        type="checkbox"
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="w-4 h-4 accent-purple-700"
                      />
                      <span>✨ Show in Homepage Spotlight (Featured)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={isBestseller}
                        onChange={(e) => setIsBestseller(e.target.checked)}
                        className="w-4 h-4 accent-purple-700"
                      />
                      <span>Mark as Bestseller</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={isNewArrival}
                        onChange={(e) => setIsNewArrival(e.target.checked)}
                        className="w-4 h-4 accent-purple-700"
                      />
                      <span>Mark as New Launch</span>
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: GALLERY IMAGES */}
              {activeTab === 'images' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-800 block">Add Image to Gallery</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Paste image URL (https://...)"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" /> Add Image
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-2">
                      Current Gallery Photos ({images.length})
                    </label>
                    <p className="text-[11px] text-slate-500 mb-3">
                      The first photo is the Primary Cover Image shown on the homepage and catalog.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-slate-100 group ${
                            idx === 0 ? 'border-purple-600 ring-2 ring-purple-200' : 'border-slate-200'
                          }`}
                        >
                          <Image src={img} alt={`Gallery ${idx + 1}`} fill className="object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-700 text-white text-[10px] font-bold shadow-xs">
                              Cover Image
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="px-2.5 py-1 rounded-lg bg-white text-purple-800 font-bold text-[10px] hover:bg-purple-50 shadow-xs"
                              >
                                Set as Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[10px] hover:bg-red-700 shadow-xs"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: COLOR & SIZE VARIANTS */}
              {activeTab === 'variants' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Product Color & Size Options</h4>
                      <p className="text-[11px] text-slate-500">
                        Customers can click color swatches on the product page to see and purchase variations.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add Variant
                    </button>
                  </div>

                  <div className="space-y-3">
                    {variants.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3"
                      >
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="color"
                            value={v.colorHex || '#9D7BB0'}
                            onChange={(e) => handleUpdateVariant(v.id, { colorHex: e.target.value })}
                            className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 p-0.5 bg-white"
                            title="Pick color hex"
                          />
                        </div>

                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Color Name</label>
                            <input
                              type="text"
                              value={v.colorName}
                              onChange={(e) => handleUpdateVariant(v.id, { colorName: e.target.value })}
                              placeholder="e.g. Classic Red"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Size / Dimension</label>
                            <input
                              type="text"
                              value={v.sizeName}
                              onChange={(e) => handleUpdateVariant(v.id, { sizeName: e.target.value })}
                              placeholder="Standard"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Price Adjustment (₹)</label>
                            <input
                              type="number"
                              value={v.priceModifier}
                              onChange={(e) => handleUpdateVariant(v.id, { priceModifier: Number(e.target.value) })}
                              placeholder="0"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Variant Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={v.stock}
                              onChange={(e) => handleUpdateVariant(v.id, { stock: Number(e.target.value) })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-center"
                          title="Delete variant"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SPECS & HIGHLIGHTS */}
              {activeTab === 'specs' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Materials Used *</label>
                      <input
                        type="text"
                        placeholder="e.g. 100% Premium Milk Cotton Yarn, Polyester Fiberfill"
                        value={materials}
                        onChange={(e) => setMaterials(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Dimensions / Size *</label>
                      <input
                        type="text"
                        placeholder="e.g. Height: 25 cm | Width: 15 cm"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Crafting Prep Time (Business Days) *</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={prepTimeDays}
                        onChange={(e) => setPrepTimeDays(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Tags / Search Keywords</label>
                      <input
                        type="text"
                        placeholder="Comma separated: Superhero, Amigurumi, Plushie, Gift"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Care Guide & Washing Instructions *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Spot clean gently with cold water. Avoid bleach. Air dry flat in shade."
                      value={careInstructions}
                      onChange={(e) => setCareInstructions(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Custom Product Highlights (One per line)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g.
100% Hand-stitched with love by women artisans
Hypoallergenic, ultra-soft non-pilling yarn
Includes gift-ready presentation box with ribbon"
                      value={highlightsInput}
                      onChange={(e) => setHighlightsInput(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Custom Product Page Notice Banner (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Limited handcrafted batch – only 5 pieces available this week!"
                      value={customNotice}
                      onChange={(e) => setCustomNotice(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-slate-400 text-[11px]">
                  {editingProduct && (
                    <span>
                      Editing: <strong className="text-slate-700">/product/{slug || editingProduct.slug}</strong>
                    </span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save & Update Product Page</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
