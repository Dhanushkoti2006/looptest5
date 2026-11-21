'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import {
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Home,
  Sparkles,
  Phone,
  User as UserIcon,
} from 'lucide-react';

interface SavedAddress {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function SavedAddressesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/addresses');
      const data = await res.json();
      if (data.success && data.addresses) {
        setAddresses(data.addresses);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?next=/account/addresses');
      return;
    }
    if (user) {
      fetchAddresses();
      if (user.name) setFullName(user.name);
      if (user.phone) setPhone(user.phone);
    }
  }, [user, isLoading, router]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (pincode.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          phone,
          line1,
          line2,
          city,
          state,
          pincode,
          isDefault,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setLine1('');
        setLine2('');
        setPincode('');
        setIsDefault(false);
        fetchAddresses();
      } else {
        setErrorMsg(data.message || 'Failed to save address.');
      }
    } catch {
      setErrorMsg('Network error saving address.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;

    try {
      await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-brand-900">
        <Sparkles className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-2" />
        <p className="text-xs text-gray-500">Loading your saved delivery addresses...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-canvas-border">
        <div>
          <Link
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Account
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-600" /> Saved Delivery Addresses
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your delivery destinations for instant 1-click checkout.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-cozy self-start sm:self-auto transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {/* ADDRESSES LIST */}
      {addresses.length === 0 ? (
        <div className="bg-white p-10 rounded-3xl border border-canvas-border text-center space-y-3 shadow-2xs max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Home className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-base text-brand-900">No Saved Addresses Yet</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Save your home or work address for effortless, faster checkout on your handcrafted orders.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-6 py-2.5 rounded-full bg-brand-600 text-white font-bold text-xs"
          >
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 rounded-3xl bg-white border transition-all space-y-3 relative shadow-cozy ${
                addr.isDefault ? 'border-brand-500 ring-1 ring-brand-400' : 'border-canvas-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-brand-900 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-brand-600" /> {addr.fullName}
                </span>
                {addr.isDefault && (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 text-[10px] font-bold">
                    Default Delivery
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-600 space-y-1">
                <p className="leading-relaxed">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}
                </p>
                <p>
                  {addr.city}, {addr.state} - <strong className="text-brand-900 font-mono">{addr.pincode}</strong>
                </p>
                <p className="text-gray-500 flex items-center gap-1.5 pt-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {addr.phone}
                </p>
              </div>

              <div className="pt-3 border-t border-canvas-border flex items-center justify-end">
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD ADDRESS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-canvas-border">
              <h3 className="font-serif font-bold text-lg text-brand-900">Add New Delivery Address</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddAddress} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Address Line 1 (House/Flat No., Street) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Sunflower Heights, 4th Main"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Address Line 2 (Landmark, Area) (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Indiranagar Metro Station"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="560038"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl font-mono focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="accent-brand-600 rounded"
                />
                <span className="text-gray-700 font-medium">Set as my default delivery address</span>
              </label>

              <div className="pt-4 border-t border-canvas-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-canvas-border hover:bg-gray-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold"
                >
                  {saving ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
