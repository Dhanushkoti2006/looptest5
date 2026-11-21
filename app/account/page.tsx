'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { Order, CustomOrderRequest } from '@/lib/types';
import {
  User,
  Package,
  Wand2,
  MapPin,
  Download,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CUSTOM_ORDERS' | 'PROFILE'>('ORDERS');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrderRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/orders?userId=${encodeURIComponent(user.id)}`).then((r) => r.json()),
      fetch(`/api/custom-orders?userId=${encodeURIComponent(user.id)}`).then((r) => r.json()),
    ])
      .then(([orderData, customData]) => {
        if (orderData.orders) setOrders(orderData.orders);
        if (customData.customOrders) setCustomOrders(customData.customOrders);
      })
      .catch((err) => console.error('Account data fetch error:', err))
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 border border-brand-200 flex items-center justify-center font-serif text-2xl font-bold text-brand-800">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-brand-900">{user.name}</h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{user.email} • {user.phone}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Email Verified
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Phone Verified
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              router.push('/');
            }}
            className="px-4 py-2.5 rounded-2xl border border-canvas-border hover:bg-red-50 text-red-600 font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-canvas-border pb-4 mb-8 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'ORDERS' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-white'
          }`}
        >
          <Package className="w-4 h-4" /> My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOM_ORDERS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'CUSTOM_ORDERS' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-white'
          }`}
        >
          <Wand2 className="w-4 h-4" /> Custom Order Requests ({customOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'PROFILE' ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-white'
          }`}
        >
          <User className="w-4 h-4" /> Saved Addresses & Profile
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-canvas-border p-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-brand-900">No Orders Yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your past handmade purchases and live tracking statuses will appear here.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white font-semibold text-xs"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-canvas-border gap-3">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Order Number</span>
                    <span className="font-serif font-bold text-base text-brand-900">#{ord.orderNumber}</span>
                    <span className="text-[11px] text-gray-500 block">
                      Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold">
                      ✨ {ord.orderStatus}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      Paid ₹{ord.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {ord.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-brand-900 font-medium">
                        {item.quantity}x {item.productName} ({item.color})
                      </span>
                      <span className="font-semibold text-brand-900">₹{item.totalPrice.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-canvas-border flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Deliver to: <strong>{ord.shippingAddress.city}, {ord.shippingAddress.pincode}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/api/orders/invoice?id=${ord.id}`}
                      download
                      className="px-4 py-2 rounded-xl bg-canvas-subtle hover:bg-gray-200 text-brand-900 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF Invoice
                    </a>
                    <Link
                      href={`/track-order?id=${ord.orderNumber}`}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" /> Track Order
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM ORDERS */}
      {activeTab === 'CUSTOM_ORDERS' && (
        <div className="space-y-4">
          {customOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-canvas-border p-8">
              <Wand2 className="w-12 h-12 text-brand-400 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-brand-900">No Custom Requests Yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Have a dream crochet design in mind? Submit a request and our master artisans will provide a custom quote!
              </p>
              <Link
                href="/custom-orders"
                className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white font-semibold text-xs"
              >
                Create Custom Order
              </Link>
            </div>
          ) : (
            customOrders.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-canvas-border gap-2">
                  <div>
                    <span className="text-xs text-gray-400 font-medium">Request #{req.requestNumber}</span>
                    <h3 className="font-serif font-bold text-lg text-brand-900">{req.productType}</h3>
                    <span className="text-[11px] text-gray-500">
                      Submitted on {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold w-fit">
                    Status: {req.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-border text-xs space-y-2">
                  <p><strong>Description:</strong> {req.description}</p>
                  <p><strong>Palette:</strong> {req.preferredColors} • <strong>Target:</strong> {req.requiredDeliveryDate}</p>
                </div>

                {req.quotation && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-900 text-sm">Official Artisan Quotation</span>
                      <span className="font-serif text-base font-bold text-emerald-800">
                        ₹{req.quotation.quoteAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-emerald-800 leading-relaxed">{req.quotation.breakdown}</p>
                    <span className="text-[11px] text-emerald-600 block">
                      Estimated Crafting: {req.quotation.estimatedPrepDays} days • Valid until {req.quotation.validUntil}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SAVED ADDRESSES & PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy space-y-6 max-w-2xl">
          <h3 className="font-serif font-bold text-lg text-brand-900 pb-3 border-b border-canvas-border">
            Default Delivery Address
          </h3>
          <div className="p-5 rounded-2xl bg-canvas-subtle border border-canvas-border text-xs space-y-1.5">
            <span className="px-2 py-0.5 rounded bg-brand-200 text-brand-800 text-[10px] font-bold uppercase inline-block mb-1">
              Primary Address
            </span>
            <p className="font-bold text-sm text-brand-900">{user.name}</p>
            <p className="text-gray-600">Flat 402, Lotus Greens, Indiranagar</p>
            <p className="text-gray-600">Bengaluru, Karnataka - 560038</p>
            <p className="text-gray-500">Phone: {user.phone}</p>
          </div>
        </div>
      )}
    </div>
  );
}
