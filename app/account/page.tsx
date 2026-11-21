'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { createClient } from '@/lib/supabase/client';
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
  XCircle,
  AlertCircle,
  Truck,
  RotateCcw,
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
  delivery_method: string;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_street_address: string;
  shipping_apartment?: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_pincode: string;
  customer_note?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  order_items: OrderItem[];
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CUSTOM_ORDERS' | 'PROFILE'>('ORDERS');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
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
      console.error('Error fetching Supabase orders:', err);
    }
  }, [user, supabase]);

  const loadCustomOrders = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase.from('custom_requests') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setCustomOrders(data);
      }
    } catch (err) {
      console.error('Error fetching custom requests:', err);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    Promise.all([loadOrders(), loadCustomOrders()]).finally(() => setLoading(false));

    // REAL-TIME LISTENER: Instantly updates whenever orders are placed, confirmed, or updated
    const channel = supabase
      .channel(`customer-orders-live-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isLoading, router, loadOrders, loadCustomOrders, supabase]);

  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return;
    setCancelSubmitting(true);
    setCancelFeedback(null);

    const finalReason = cancelReason === 'Other' ? customReasonText.trim() || 'Other' : cancelReason;

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
      setCancelSubmitting(false);

      if (data.success) {
        setCancelFeedback({ text: data.message, isError: false });
        await loadOrders();
        setTimeout(() => {
          setCancellingOrder(null);
          setCancelFeedback(null);
        }, 1200);
      } else {
        setCancelFeedback({ text: data.message || 'Failed to cancel order.', isError: true });
      }
    } catch {
      setCancelSubmitting(false);
      setCancelFeedback({ text: 'Network error. Please try again.', isError: true });
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
    }
    if (s === 'delivered') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
        </span>
      );
    }
    if (s === 'shipped' || s === 'out_for_delivery') {
      return (
        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" /> {s === 'out_for_delivery' ? 'Out for Delivery' : 'Shipped'}
        </span>
      );
    }
    if (s === 'making' || s === 'packed') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {s === 'making' ? 'Handcrafting' : 'Packed'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold flex items-center gap-1">
        ✨ Confirmed
      </span>
    );
  };

  const isCancellable = (status: string) => {
    const s = (status || '').toLowerCase();
    return ['paid', 'confirmed', 'order confirmed', 'pending_payment'].includes(s);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-gray-500 font-medium">Loading your account details...</p>
      </div>
    );
  }

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
            <p className="text-xs text-gray-500 mt-0.5">
              {user.email} {user.phone && `• ${user.phone}`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Authenticated via Supabase
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
      <div className="flex flex-wrap gap-2 border-b border-canvas-border pb-4 mb-8 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'ORDERS' ? 'bg-brand-800 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
        >
          <Package className="w-4 h-4" /> My Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOM_ORDERS')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'CUSTOM_ORDERS' ? 'bg-brand-800 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
        >
          <Wand2 className="w-4 h-4" /> Custom Requests ({customOrders.length})
        </button>
        <Link
          href="/account/addresses"
          className="px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-gray-600 hover:bg-white hover:text-brand-800 border border-transparent hover:border-canvas-border"
        >
          <MapPin className="w-4 h-4 text-brand-600" /> Saved Addresses
        </Link>
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${activeTab === 'PROFILE' ? 'bg-brand-800 text-white shadow-sm' : 'text-gray-600 hover:bg-white'
            }`}
        >
          <User className="w-4 h-4" /> Profile & Details
        </button>
      </div>

      {/* TAB 1: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-500">Loading your real-time orders from Supabase...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-canvas-border p-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-brand-900">No Orders Yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                Your past handmade purchases and live tracking statuses will appear here in real time.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs transition-colors"
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
                    <span className="font-serif font-bold text-base text-brand-900">#{ord.order_number}</span>
                    <span className="text-[11px] text-gray-500 block">
                      Placed on {new Date(ord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(ord.status)}
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                      ₹{ord.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Ordered Products Items */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Ordered Items ({ord.order_items?.length || 0})
                  </span>
                  {ord.order_items && ord.order_items.length > 0 ? (
                    ord.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-canvas-warm/40 rounded-xl">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="w-10 h-10 rounded-lg object-cover border border-canvas-border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-bold text-xs">
                              🧶
                            </div>
                          )}
                          <div>
                            <span className="text-brand-900 font-semibold block">{item.product_name}</span>
                            <span className="text-gray-500 text-[11px]">Qty: {item.quantity} × ₹{item.unit_price}</span>
                          </div>
                        </div>
                        <span className="font-bold text-brand-900">
                          ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic">No item snapshot available</p>
                  )}
                </div>

                {/* Cancellation notice if cancelled */}
                {ord.status.toLowerCase() === 'cancelled' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <XCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <p className="font-semibold">This order was cancelled.</p>
                      {ord.cancel_reason && <p className="text-rose-700 text-[11px]">Reason: {ord.cancel_reason}</p>}
                    </div>
                  </div>
                )}

                {/* Delivery details and Actions */}
                <div className="pt-4 border-t border-canvas-border flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-gray-500">
                    Deliver to: <strong>{ord.shipping_city}, {ord.shipping_pincode}</strong> ({ord.delivery_method === 'local_own' ? 'Local Hand Delivery' : 'Courier'})
                    {ord.tracking_number && (
                      <span className="block text-indigo-700 font-medium mt-0.5">
                        Tracking: {ord.tracking_number} {ord.courier_name && `(${ord.courier_name})`}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* CANCEL ORDER BUTTON (Only shown in confirmed/paid stage) */}
                    {isCancellable(ord.status) && (
                      <button
                        onClick={() => {
                          setCancellingOrder(ord);
                          setCancelFeedback(null);
                        }}
                        className="px-3.5 py-1.5 rounded-xl border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Order
                      </button>
                    )}

                    <Link
                      href={`/account/orders/${ord.id}`}
                      className="px-4 py-2 rounded-xl bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Package className="w-3.5 h-3.5" /> Order Details & Timeline
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM REQUESTS */}
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
                className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-800 text-white font-semibold text-xs"
              >
                Create Custom Request
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
                    <span className="text-xs text-gray-400 font-medium">Request #{req.request_number}</span>
                    <h3 className="font-serif font-bold text-lg text-brand-900">{req.product_type}</h3>
                    <span className="text-[11px] text-gray-500">
                      Submitted on {new Date(req.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold w-fit">
                    Status: {req.status}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-canvas-subtle border border-canvas-border text-xs space-y-2">
                  <p><strong>Description:</strong> {req.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SAVED ADDRESSES & PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy space-y-6 max-w-2xl">
          <h3 className="font-serif font-bold text-lg text-brand-900 pb-3 border-b border-canvas-border">
            Customer Profile
          </h3>
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Customer Name</span>
              <span className="font-semibold text-sm text-brand-900">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Email Address</span>
              <span className="font-semibold text-sm text-brand-900">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Phone Number</span>
              <span className="font-semibold text-sm text-brand-900">{user.phone || 'Not provided yet'}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-medium">Account Role</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-brand-100 text-brand-800 rounded font-bold uppercase text-[10px]">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-canvas-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2.5 rounded-2xl bg-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-slate-900">Cancel Order</h3>
                <p className="text-xs text-slate-500">Order #{cancellingOrder.order_number}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this order? Once confirmed, this order will be cancelled and the items restocked.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Reason for Cancellation
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-canvas-warm/50 border border-canvas-border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Need to change delivery address">Need to change delivery address</option>
                <option value="Found another product">Found another product</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {cancelReason === 'Other' && (
              <div>
                <input
                  type="text"
                  placeholder="Please specify your reason..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full p-2.5 bg-canvas-warm/50 border border-canvas-border rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {cancelFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${cancelFeedback.isError
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={() => setCancellingOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={cancelSubmitting}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {cancelSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" /> Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
