'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
import {
  Package,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
} from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  image_url: string | null;
}

interface OrderRecord {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method?: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_street_address?: string;
  shipping_apartment?: string;
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  customer_note?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  razorpay_refund_id?: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Cancellation modal state
  const [cancellingOrder, setCancellingOrder] = useState<OrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customReasonText, setCustomReasonText] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const supabase = createClient();

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase.from('orders') as any)
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as OrderRecord[]);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/account/orders');
      return;
    }
    if (user) {
      loadOrders();
    }
  }, [user, authLoading, router, loadOrders]);

  const canCancelOrder = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    // Strictly only allow when order is paid, confirmed, or in making stage before packing
    return ['paid', 'confirmed', 'order confirmed', 'pending_payment', 'making-not-started', 'making'].includes(s);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingOrder) return;

    setCancelSubmitting(true);
    setCancelFeedback(null);

    const finalReason = cancelReason === 'Other' ? customReasonText.trim() : cancelReason;
    if (cancelReason === 'Other' && !finalReason) {
      setCancelFeedback({ text: 'Please specify your cancellation reason.', isError: true });
      setCancelSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancellingOrder.id,
          reason: finalReason,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCancelFeedback({
          text: data.message || 'Order cancelled successfully and refund initiated.',
          isError: false,
        });
        setTimeout(() => {
          setCancellingOrder(null);
          loadOrders();
        }, 1200);
      } else {
        setCancelFeedback({
          text: data.message || 'Could not cancel order.',
          isError: true,
        });
      }
    } catch {
      setCancelFeedback({ text: 'Network error processing cancellation.', isError: true });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'delivered') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
        </span>
      );
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5 text-blue-600" /> Shipped / Out for Delivery
        </span>
      );
    }
    if (s === 'packed') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-indigo-600" /> Packed & Inspected
        </span>
      );
    }
    if (s === 'making' || s === 'making-not-started' || s === 'processing') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> In Artisanal Making
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-amber-600" /> Confirmed & Paid
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <Sparkles className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Back and Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/account" className="hover:text-brand-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> My Account
          </Link>
          <span>/</span>
          <span className="text-brand-900 font-semibold">Orders</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/account/addresses"
            className="text-xs text-brand-700 font-semibold hover:underline flex items-center gap-1"
          >
            <MapPin className="w-3.5 h-3.5" /> Saved Addresses
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">My Orders</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track artisanal creation progress, download tax invoices, and manage your crochet orders.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-canvas-border p-12 text-center shadow-cozy space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto text-brand-600">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-900">No Orders Placed Yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            You haven't ordered any handcrafted crochet creations yet. Explore our handcrafted bouquets, wearables, and custom gifts.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold uppercase tracking-wider shadow-soft"
          >
            <ShoppingBag className="w-4 h-4" /> Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const cancellable = canCancelOrder(order.status);
            const line1 = order.shipping_line1 || order.shipping_street_address || '';
            const line2 = order.shipping_line2 || order.shipping_apartment || '';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-canvas-border shadow-cozy overflow-hidden transition-all hover:border-brand-200"
              >
                {/* Header bar */}
                <div className="bg-canvas-subtle/50 px-6 py-4 border-b border-canvas-border flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Order Number</span>
                      <span className="font-mono font-bold text-brand-900 text-sm">#{order.order_number}</span>
                    </div>
                    <div className="hidden sm:block border-l border-gray-200 pl-4">
                      <span className="text-gray-400 block text-[11px]">Placed On</span>
                      <span className="text-gray-700 font-medium">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <span className="text-gray-400 block text-[11px]">Total Paid</span>
                      <span className="font-mono font-bold text-brand-900 text-sm">
                        ₹{Number(order.total).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="p-6 space-y-4">
                  <div className="divide-y divide-canvas-border">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-14 h-14 rounded-2xl bg-canvas-subtle overflow-hidden shrink-0 border border-canvas-border">
                            <Image
                              src={item.image_url || '/images/photo-coming-soon.svg'}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-brand-900 text-xs sm:text-sm truncate">
                              {item.product_name}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              Qty: <span className="font-semibold text-gray-700">{item.quantity}</span> • ₹
                              {Number(item.unit_price).toLocaleString('en-IN')} each
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-brand-900 text-xs sm:text-sm">
                            ₹{(Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery snapshot & tracking */}
                  <div className="pt-4 border-t border-canvas-border flex flex-wrap items-center justify-between gap-4 text-xs text-gray-600">
                    <div className="flex items-start gap-2 max-w-md">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-gray-900">Delivery Address: </span>
                        <span>
                          {order.shipping_full_name}, {line1}
                          {line2 ? `, ${line2}` : ''}, {order.shipping_city}, {order.shipping_state} -{' '}
                          {order.shipping_pincode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`/api/orders/${order.id}/invoice`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-gray-600 hover:text-brand-800 text-xs font-semibold py-1.5 px-3 rounded-xl border border-canvas-border hover:bg-canvas-subtle transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> Tax Invoice
                      </a>

                      {cancellable && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingOrder(order);
                            setCancelFeedback(null);
                            setCancelReason('Ordered by mistake');
                            setCustomReasonText('');
                          }}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 text-xs font-semibold py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 transition-all"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Cancel Order
                        </button>
                      )}
                    </div>
                  </div>

                  {order.status === 'cancelled' && (
                    <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 text-xs text-rose-800">
                      <p className="font-semibold">Order Cancelled</p>
                      {order.cancel_reason && <p className="text-[11px] mt-0.5">Reason: {order.cancel_reason}</p>}
                      {order.razorpay_refund_id && (
                        <p className="text-[11px] text-rose-700 mt-0.5">
                          Refund Reference: <span className="font-mono">{order.razorpay_refund_id}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-canvas-border shadow-cozy space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-canvas-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-900">Cancel Order</h3>
                <p className="text-xs text-gray-500 font-mono">Order #{cancellingOrder.order_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setCancellingOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Are you sure you want to cancel?
              </p>
              <p>
                Our women artisans begin lovingly crafting each loop upon order confirmation. Cancellation is only permitted prior to packing and shipping.
              </p>
              <p className="font-semibold text-emerald-800 pt-1">
                A full refund of ₹{Number(cancellingOrder.total).toLocaleString('en-IN')} will be initiated instantly to your original payment method.
              </p>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Reason for Cancellation *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="Ordered by mistake">Ordered by mistake</option>
                  <option value="Need to change delivery address">Need to change delivery address</option>
                  <option value="Need to change items / color / size">Need to change items / color / size</option>
                  <option value="Delivery time is too long">Delivery time is too long</option>
                  <option value="Other">Other reason (please specify)</option>
                </select>
              </div>

              {cancelReason === 'Other' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Please provide details *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Tell us why you are cancelling..."
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>
              )}

              {cancelFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${cancelFeedback.isError
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                    }`}
                >
                  {cancelFeedback.isError ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{cancelFeedback.text}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingOrder(null)}
                  disabled={cancelSubmitting}
                  className="flex-1 py-3 px-4 rounded-full border border-canvas-border text-xs font-bold text-gray-700 hover:bg-canvas-subtle transition-all"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelSubmitting}
                  className="flex-1 py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-xs font-bold uppercase tracking-wider text-white shadow-soft transition-all flex items-center justify-center gap-1.5"
                >
                  {cancelSubmitting ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Confirm Cancellation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
