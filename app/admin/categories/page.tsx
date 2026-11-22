'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  UploadCloud,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  image_url?: string;
  displayOrder: number;
  display_order?: number;
  isActive: boolean;
  is_active?: boolean;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick Cover Image Modal State
  const [coverModalCategory, setCoverModalCategory] = useState<CategoryRecord | null>(null);
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickCoverInputRef = useRef<HTMLInputElement>(null);

  const fetchCategories = () => {
    setLoading(true);
    fetch('/api/categories?all=true', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error('Error fetching categories:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const autoGenerateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingCategory) {
      setSlug(autoGenerateSlug(val));
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
    setMessage(null);
  };

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.imageUrl || cat.image_url || '');
    setDisplayOrder(cat.displayOrder ?? cat.display_order ?? 1);
    setIsActive(cat.isActive ?? cat.is_active ?? true);
    setIsModalOpen(true);
    setMessage(null);
  };

  const openQuickCoverModal = (cat: CategoryRecord) => {
    setCoverModalCategory(cat);
    setNewCoverUrl(cat.imageUrl || cat.image_url || '');
  };

  const compressAndProcessImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'modal' | 'quick') => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    if (target === 'quick') setUploadingCover(true);

    try {
      let finalUrl = '';
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          finalUrl = data.url;
        }
      } catch (_) {}

      if (!finalUrl) {
        finalUrl = await compressAndProcessImage(file);
      }

      if (finalUrl) {
        if (target === 'modal') {
          setImageUrl(finalUrl);
        } else {
          setNewCoverUrl(finalUrl);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to process image file. Please try again.');
    } finally {
      if (target === 'quick') setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Category name is required.');
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      id: editingCategory?.id,
      name: name.trim(),
      slug: slug.trim() ? autoGenerateSlug(slug) : autoGenerateSlug(name),
      description: description.trim(),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
      displayOrder: Number(displayOrder || 1),
      isActive,
    };

    try {
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch('/api/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setMessage({
          text: `✨ Category "${name}" saved successfully!`,
          isError: false,
        });
        fetchCategories();
      } else {
        setMessage({
          text: data.message || 'Failed to save category',
          isError: true,
        });
      }
    } catch (err: any) {
      console.error('Save category error:', err);
      setMessage({
        text: 'Network error saving category',
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveQuickCover = async () => {
    if (!coverModalCategory || !newCoverUrl.trim()) return;

    setUploadingCover(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coverModalCategory.id,
          slug: coverModalCategory.slug,
          imageUrl: newCoverUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoverModalCategory(null);
        fetchCategories();
      } else {
        alert(data.message || 'Failed to update category cover image');
      }
    } catch (err) {
      console.error('Update cover photo error:', err);
      alert('Error updating cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryRecord) => {
    if (!confirm(`Are you sure you want to delete the category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.message || 'Failed to delete category');
      }
    } catch (err) {
      console.error('Delete category error:', err);
      alert('Network error deleting category');
    }
  };

  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-purple-700" /> Category Management &amp; Covers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create store categories, customize showcase cover photos, set display priority, and manage collection pages.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCategories}
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-2xs transition-colors"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Add New Category
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {message && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
            message.isError
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {message.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="p-1 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CATEGORIES GRID */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          <span>Loading categories from database...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
          <Layers className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-serif font-bold text-base text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-400">Click &quot;Add New Category&quot; to create your first store collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCategories.map((cat) => {
            const cover = cat.imageUrl || cat.image_url || 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80';
            return (
              <div
                key={cat.id || cat.slug}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col group hover:border-purple-300 hover:shadow-cozy transition-all"
              >
                {/* COVER PHOTO DISPLAY */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={cover}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-black/20" />

                  {/* Active Badge & Order */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                      #{cat.displayOrder ?? cat.display_order ?? 1}
                    </span>
                    {(cat.isActive ?? cat.is_active ?? true) ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-bold">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/90 text-white text-[10px] font-bold">
                        Hidden
                      </span>
                    )}
                  </div>

                  {/* Quick Cover Change Button Overlay */}
                  <button
                    onClick={() => openQuickCoverModal(cat)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/40 hover:bg-purple-700 text-white backdrop-blur-md text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                    title="Change Category Cover Image"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Change Cover</span>
                  </button>

                  {/* Bottom title in cover */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-serif font-bold text-base leading-tight drop-shadow-sm">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-purple-200 font-mono mt-0.5">/shop/{cat.slug}</p>
                  </div>
                </div>

                {/* DETAILS BODY */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                      {cat.productCount ?? 0} {cat.productCount === 1 ? 'Product' : 'Products'}
                    </span>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/shop/${cat.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="View Category Page on Storefront"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                        title="Edit Category Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-serif font-bold text-lg text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-700" />
                <span>{editingCategory ? 'Edit Category' : 'Create New Category'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hair Scrunchies & Clips"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  URL Slug (Auto-generated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hair-scrunchies-clips"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-purple-700"
                />
                <p className="text-[10px] text-slate-400 mt-1">Live URL: /shop/{slug || '...'}</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description displayed on storefront category page..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-700"
                />
              </div>

              {/* COVER IMAGE CONTROLS */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Category Cover Photo *
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Paste image URL (https://...)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-700"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'modal')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload</span>
                    </button>
                  </div>

                  {imageUrl && (
                    <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <Image src={imageUrl} alt="Cover Preview" fill className="object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold backdrop-blur-xs">
                        Cover Preview
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Display Priority</label>
                  <input
                    type="number"
                    min={1}
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span className="font-bold text-slate-700 text-xs">Active on Storefront</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK COVER PHOTO MODAL */}
      {coverModalCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Update Cover: {coverModalCategory.name}
                </h3>
                <p className="text-[11px] text-slate-400">Change image displayed on home showcase &amp; banner.</p>
              </div>
              <button
                onClick={() => setCoverModalCategory(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Upload New Cover Photo</label>
                <input
                  type="file"
                  ref={quickCoverInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'quick')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => quickCoverInputRef.current?.click()}
                  className="w-full py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-dashed border-purple-200 transition-colors"
                >
                  <UploadCloud className="w-5 h-5" />
                  <span>Choose Image File to Upload</span>
                </button>
              </div>

              <div className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                — OR ENTER DIRECT URL —
              </div>

              <div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-800"
                />
              </div>

              {newCoverUrl && (
                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                  <Image src={newCoverUrl} alt="Cover Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setCoverModalCategory(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingCover || !newCoverUrl.trim()}
                onClick={handleSaveQuickCover}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {uploadingCover ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                  </>
                ) : (
                  'Apply New Cover'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
