'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  RotateCcw,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Check,
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

interface StatusHistoryItem {
  id: string;
  order_id: string;
  status: string;
  notes?: string | null;
  created_at: string;
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
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  created_at: string;
  order_items: OrderItem[];
  order_status_history?: StatusHistoryItem[];
}

const TIMELINE_STEPS = [
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Prepaid payment verified & order registered' },
  { key: 'making', label: 'Artisanal Making', desc: 'Crafted with premium milk cotton yarn' },
  { key: 'packed', label: 'Packed & Inspected', desc: 'Quality checked, boxed with ribbon' },
  { key: 'shipped', label: 'Shipped / En Route', desc: 'Dispatched via trusted express courier' },
  { key: 'delivered', label: 'Delivered', desc: 'Safely delivered to your doorstep' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const { user, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Ordered by mistake');
  const [customReasonText, setCustomReasonText] = useState('');
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const supabase = createClient();

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await (supabase.from('orders') as any)
        .select(`
          *,
          order_items (*),
          order_status_history (*)
        `)
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .maybeSingle();

      if (error || !data) {
        setErrorMsg('Order not found. It may have been deleted or the ID is incorrect.');
        setOrder(null);
        return;
      }

      // Check ownership if user is signed in
      if (user && data.user_id && data.user_id !== user.id && user.role !== 'admin') {
        setErrorMsg('You do not have permission to view this order.');
        setOrder(null);
        return;
      }

      setOrder(data as OrderRecord);
    } catch (err) {
      console.error('Error loading order details:', err);
      setErrorMsg('Failed to fetch order details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [orderId, user, supabase]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/account/orders/${orderId}`);
      return;
    }
    if (user) {
      loadOrder();
    }
  }, [user, authLoading, router, orderId, loadOrder]);

  const canCancel = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return ['paid', 'confirmed', 'order confirmed', 'pending_payment', 'making-not-started', 'making'].includes(s);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

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
          orderId: order.id,
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
          setShowCancelModal(false);
          loadOrder();
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

  // Helper to get step index
  const getTimelineStepIndex = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    if (s === 'delivered') return 4;
    if (s === 'shipped' || s === 'out_for_delivery') return 3;
    if (s === 'packed') return 2;
    if (s === 'making' || s === 'processing') return 1;
    return 0; // confirmed / paid
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Sparkles className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="font-serif text-2xl font-bold text-brand-900">Unable to View Order</h2>
        <p className="text-xs text-gray-500">{errorMsg || 'Order could not be located.'}</p>
        <Link
          href="/account/orders"
          className="inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-bold uppercase tracking-wider"
        >
          Back to My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const cancellable = canCancel(order.status);
  const currentStepIdx = getTimelineStepIndex(order.status);
  const line1 = order.shipping_line1 || order.shipping_street_address || '';
  const line2 = order.shipping_line2 || order.shipping_apartment || '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-800 font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to All Orders
        </Link>

        <a
          href={`/api/orders/${order.id}/invoice`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-canvas-border bg-white hover:bg-canvas-subtle text-xs font-bold text-gray-700 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4 text-brand-600" /> Download Tax Invoice (PDF)
        </a>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-canvas-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900">
                Order #{order.order_number}
              </h1>
              {isCancelled ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Cancelled
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {order.status.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
              <span>Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span>•</span>
              <span className="font-mono">Payment: {order.payment_status.toUpperCase()}</span>
            </p>
          </div>

          {cancellable && (
            <button
              type="button"
              onClick={() => {
                setShowCancelModal(true);
                setCancelFeedback(null);
                setCancelReason('Ordered by mistake');
                setCustomReasonText('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancel Order
            </button>
          )}
        </div>

        {/* STATUS TIMELINE */}
        <div className="py-6 border-b border-canvas-border">
          <h3 className="font-serif text-sm font-bold text-brand-900 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600" /> Order Fulfillment Status
          </h3>

          {isCancelled ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
              <p className="font-bold text-sm flex items-center gap-2 text-rose-700">
                <XCircle className="w-4 h-4" /> This Order Was Cancelled
              </p>
              {order.cancelled_at && (
                <p className="text-[11px] text-gray-600">
                  Cancelled on {new Date(order.cancelled_at).toLocaleString('en-IN')}
                </p>
              )}
              {order.cancel_reason && (
                <p className="text-xs">
                  <span className="font-semibold">Reason:</span> {order.cancel_reason}
                </p>
              )}
              {order.razorpay_refund_id && (
                <p className="text-xs font-medium text-emerald-800 pt-1">
                  ✓ Refund initiated to original payment source. Refund Reference ID: <span className="font-mono font-bold">{order.razorpay_refund_id}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {TIMELINE_STEPS.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.key} className="flex md:flex-col items-center md:items-start gap-3 md:gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isDone
                              ? 'bg-brand-600 text-white shadow-soft'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold leading-tight ${
                            isCurrent
                              ? 'text-brand-900'
                              : isDone
                              ? 'text-gray-800'
                              : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {order.tracking_number && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Courier: {order.courier_name || 'Express Courier'}</span>
                    <span className="font-mono ml-2">#{order.tracking_number}</span>
                  </div>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-700 hover:underline flex items-center gap-1"
                    >
                      Track Package <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* STATUS HISTORY LOG (IF AVAILABLE) */}
        {order.order_status_history && order.order_status_history.length > 0 && (
          <div className="py-4 border-b border-canvas-border">
            <h4 className="text-xs font-bold text-gray-700 mb-2">Fulfillment Activity Log</h4>
            <div className="space-y-2">
              {order.order_status_history.map((h) => (
                <div key={h.id} className="text-[11px] text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="font-semibold text-gray-900 uppercase tracking-wider">{h.status}:</span>
                  <span>{h.notes || 'Status updated'}</span>
                  <span className="text-gray-400 font-mono ml-auto">
                    {new Date(h.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDER ITEMS BREAKDOWN */}
        <div className="py-6 border-b border-canvas-border">
          <h3 className="font-serif text-sm font-bold text-brand-900 mb-4 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-600" /> Handcrafted Items ({order.order_items?.length || 0})
          </h3>

          <div className="divide-y divide-canvas-border">
            {(order.order_items || []).map((item) => (
              <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-16 h-16 rounded-2xl bg-canvas-subtle overflow-hidden shrink-0 border border-canvas-border">
                    <Image
                      src={item.image_url || '/images/loop-and-love-logo.jpg'}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-brand-900 text-sm truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      Qty: <span className="font-semibold text-gray-700">{item.quantity}</span> • ₹
                      {Number(item.unit_price).toLocaleString('en-IN')} each
                    </p>
                    {item.product_id && (
                      <Link
                        href={`/product/${item.product_id}`}
                        className="text-[11px] text-brand-600 hover:underline mt-0.5 inline-block"
                      >
                        View Product →
                      </Link>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-brand-900 text-sm">
                    ₹{(Number(item.unit_price) * Number(item.quantity)).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM DETAILS: ADDRESS & FINANCIAL SUMMARY */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Address & Customer Info */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold text-brand-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" /> Delivery Address Snapshot
            </h4>
            <div className="p-4 rounded-2xl bg-canvas-subtle/60 border border-canvas-border text-xs text-gray-700 space-y-1">
              <p className="font-bold text-brand-900">{order.shipping_full_name}</p>
              <p>{line1}</p>
              {line2 && <p>{line2}</p>}
              <p className="font-mono">
                {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
              </p>
              <p className="pt-1 text-gray-500">Contact: {order.shipping_phone}</p>
              {order.customer_note && (
                <div className="mt-2 pt-2 border-t border-canvas-border text-[11px] text-gray-600">
                  <span className="font-semibold">Note:</span> {order.customer_note}
                </div>
              )}
            </div>
          </div>

          {/* Payment & Price Summary */}
          <div className="space-y-4">
            <h4 className="font-serif text-sm font-bold text-brand-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" /> Payment & Billing Breakdown
            </h4>

            <div className="p-4 rounded-2xl bg-canvas-subtle/60 border border-canvas-border text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal</span>
                <span className="font-mono">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge</span>
                <span className="font-mono">
                  {Number(order.delivery_fee) === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[10px]">FREE</span>
                  ) : (
                    `₹${Number(order.delivery_fee).toLocaleString('en-IN')}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (5% Included)</span>
                <span className="font-mono">
                  ₹{(Math.round(Number(order.subtotal) * 0.05 * 100) / 100).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-canvas-border flex justify-between items-baseline font-bold text-sm text-brand-900">
                <span>Total Amount</span>
                <span className="font-serif text-base font-mono text-brand-900">
                  ₹{Number(order.total).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 border-t border-canvas-border text-[11px] text-gray-500 flex items-center justify-between">
                <span>Payment Gateway: Razorpay</span>
                <span className="font-mono text-emerald-800 font-bold uppercase">
                  {order.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-canvas-border shadow-cozy space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-canvas-border">
              <div>
                <h3 className="font-serif text-lg font-bold text-brand-900">Cancel Order</h3>
                <p className="text-xs text-gray-500 font-mono">Order #{order.order_number}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Confirm cancellation
              </p>
              <p>
                Each loop is made by hand with care. Cancellation is only allowed prior to packing and shipping.
              </p>
              <p className="font-semibold text-emerald-800 pt-1">
                A full refund of ₹{Number(order.total).toLocaleString('en-IN')} will be initiated instantly to your original payment method.
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
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    cancelFeedback.isError
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
                  onClick={() => setShowCancelModal(false)}
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
