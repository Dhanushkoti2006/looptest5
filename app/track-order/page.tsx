'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order, OrderStatus } from '@/lib/types';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Download,
  AlertCircle,
  Sparkles,
  MapPin,
  Calendar,
} from 'lucide-react';

const ORDER_MILESTONES: OrderStatus[] = [
  'Order Placed',
  'Payment Verified',
  'Order Confirmed',
  'Making Your Crochet Product',
  'Quality Check',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');

  const [orderIdInput, setOrderIdInput] = useState(idParam || 'LL-2026-1001');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchOrder = (searchId: string) => {
    if (!searchId.trim()) return;
    setLoading(true);
    setErrorMsg('');

    fetch(`/api/orders?orderNumber=${encodeURIComponent(searchId.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setOrder(null);
          setErrorMsg(data.message || 'No order found with this Order ID.');
        }
      })
      .catch(() => {
        setErrorMsg('Error retrieving order details.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (idParam) {
      fetchOrder(idParam);
    } else {
      // Preload sample order so the user sees a rich timeline immediately!
      fetchOrder('LL-2026-1001');
    }
  }, [idParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderIdInput);
  };

  // Determine current milestone index
  const currentStatusIndex = order
    ? ORDER_MILESTONES.indexOf(order.orderStatus as any)
    : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* HEADER */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Live Delivery Radar</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">
          Track Your Handmade Creation
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Enter your unique Loop & Love Order ID to monitor crafting milestones, quality checks, and dispatch progress.
        </p>

        {/* SEARCH INPUT */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-md mx-auto gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="e.g. LL-2026-1001"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-canvas-border rounded-2xl shadow-xs focus:outline-none focus:border-brand-500 font-medium text-brand-900"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-colors"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {order && (
        <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-10 shadow-cozy space-y-8 animate-in fade-in">
          {/* HEADER SUMMARY */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-canvas-border gap-4">
            <div>
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider block">Order Details</span>
              <h2 className="font-serif text-2xl font-bold text-brand-900">#{order.orderNumber}</h2>
              <span className="text-xs text-gray-500">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
              </span>
            </div>

            <div className="flex flex-col sm:items-end">
              <span className="text-xs text-gray-400 block font-medium">Current Status</span>
              <span className="px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold mt-1 shadow-2xs">
                ✨ {order.orderStatus}
              </span>
              {order.estimatedDeliveryDate && (
                <span className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Est. Delivery: {order.estimatedDeliveryDate}
                </span>
              )}
            </div>
          </div>

          {/* VISUAL STEPPER TIMELINE */}
          <div>
            <h3 className="font-serif font-bold text-base text-brand-900 mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-600" /> Crafting & Shipping Progress
            </h3>

            <div className="relative pl-6 sm:pl-8 border-l-2 border-brand-200 space-y-8 ml-3 sm:ml-4">
              {ORDER_MILESTONES.map((milestone, idx) => {
                const isPassed = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;

                const matchingHistory = order.statusHistory?.find((h) => h.status === milestone);

                return (
                  <div key={milestone} className="relative group">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-brand-600 text-white ring-4 ring-brand-200 shadow-md animate-pulse'
                          : isPassed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h4
                          className={`font-semibold text-sm ${
                            isCurrent
                              ? 'text-brand-900 font-bold'
                              : isPassed
                              ? 'text-gray-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {milestone}
                        </h4>
                        {matchingHistory && (
                          <span className="text-[11px] text-gray-400">
                            {new Date(matchingHistory.timestamp).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      {matchingHistory?.note && (
                        <p className="text-xs text-brand-700 bg-brand-50 p-2.5 rounded-xl border border-brand-100 mt-2 max-w-lg">
                          📝 {matchingHistory.note}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SHIPPING & TRACKING COURIER INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-canvas-border text-xs">
            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-border space-y-1.5">
              <span className="font-bold text-gray-500 uppercase tracking-wider block">Delivery Destination</span>
              <p className="font-semibold text-brand-900">{order.shippingAddress.name}</p>
              <p className="text-gray-600">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                {order.shippingAddress.pincode}
              </p>
              <p className="text-gray-500">Contact: {order.shippingAddress.phone}</p>
            </div>

            <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-border space-y-1.5">
              <span className="font-bold text-gray-500 uppercase tracking-wider block">Courier & Tracking Details</span>
              <p className="font-semibold text-brand-900">
                {order.courierPartner || 'Artisan Special Handling / BlueDart Express'}
              </p>
              <p className="text-brand-700 font-mono">Tracking Number: {order.trackingNumber || 'Pending Courier Scan'}</p>
              <p className="text-emerald-700 font-medium">Payment: {order.paymentMethod}</p>
            </div>
          </div>

          {/* INVOICE & ACTIONS */}
          <div className="pt-4 border-t border-canvas-border flex flex-wrap items-center justify-between gap-4">
            <a
              href={`/api/orders/invoice?id=${order.id}`}
              download
              className="px-6 py-3 rounded-full bg-brand-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-cream-200" /> Download Tax Invoice PDF
            </a>

            <div className="text-xs text-gray-500">
              Need assistance? WhatsApp our artisan support at <strong>+91 98765 43210</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading tracking data...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
