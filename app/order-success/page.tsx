'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { Order } from '@/lib/types';
import {
  CheckCircle2,
  FileText,
  Package,
  Truck,
  Heart,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#9D7BB0', '#FBF5E5', '#C98B9E', '#E2C474', '#10B981'],
      });
    } catch {}

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) {
            setOrder(data.order);
          }
        })
        .catch((err) => console.error('Error fetching order:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
      {/* SUCCESS HERO BADGE */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-cozy animate-bounce">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
        Payment Verified & Order Confirmed
      </span>

      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-900 mt-3">
        Thank You for Your Order!
      </h1>
      <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
        We have safely received your payment. Our master artisans have reserved your items and begun handcrafting your crochet order with utmost love!
      </p>

      {loading ? (
        <div className="mt-10 py-16 bg-white rounded-3xl border border-canvas-border shadow-cozy">
          <div className="w-9 h-9 border-2 border-brand-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium">Preparing your verified order summary & tax invoice...</p>
        </div>
      ) : order ? (
        <div className="mt-10 bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy text-left space-y-6">
          {/* HEADER SUMMARY */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-canvas-border gap-4">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Order Number</span>
              <span className="font-serif text-xl font-bold text-brand-900">#{order.orderNumber}</span>
              <span className="text-[11px] text-gray-500 block mt-0.5">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div>
              <span className="text-xs text-gray-400 block font-medium">Payment Mode</span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {order.paymentMethod || 'Prepaid (Razorpay Online)'}
              </span>
            </div>

            <div>
              <span className="text-xs text-gray-400 block font-medium">Total Paid</span>
              <span className="font-bold text-brand-900 text-xl font-mono">
                ₹{Number(order.totalAmount || (order as any).total || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* VISUAL ORDER TIMELINE STEPPER */}
          <div>
            <h3 className="font-serif font-bold text-sm text-brand-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Order Fulfillment Status
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
                <strong className="block">1. Order Placed</strong>
                <span className="text-[10px] text-emerald-700">Payment Verified</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900">
                <span className="w-2 h-2 rounded-full bg-brand-500 inline-block mr-1.5 animate-pulse" />
                <strong className="block">2. Artisan Making</strong>
                <span className="text-[10px] text-gray-500">Handcrafting stitches</span>
              </div>
              <div className="p-3 rounded-2xl bg-canvas-subtle border border-canvas-border text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block mr-1.5" />
                <strong className="block">3. Quality & Pack</strong>
                <span className="text-[10px] text-gray-400">Gift packaging</span>
              </div>
              <div className="p-3 rounded-2xl bg-canvas-subtle border border-canvas-border text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block mr-1.5" />
                <strong className="block">4. Dispatched</strong>
                <span className="text-[10px] text-gray-400">Doorstep delivery</span>
              </div>
            </div>
          </div>

          {/* Ordered Items Preview */}
          <div className="pt-4 border-t border-canvas-border space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Ordered Items ({order.items?.length || (order as any).order_items?.length || 0})
            </h4>
            <div className="space-y-2">
              {(order.items || (order as any).order_items || []).map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs p-2.5 bg-canvas-warm/40 rounded-xl">
                  <div className="flex items-center gap-3">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName || item.product_name}
                        className="w-10 h-10 rounded-lg object-cover border border-canvas-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-700 font-serif font-bold text-xs">
                        🧶
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-brand-900 block">
                        {item.productName || item.product_name}
                      </span>
                      <span className="text-gray-500 text-[11px]">
                        Qty: {item.quantity} × ₹{Number(item.unitPrice || item.unit_price || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-brand-900 font-mono">
                    ₹{(
                      item.totalPrice ||
                      (Number(item.unitPrice || item.unit_price) || 0) * (item.quantity || 1)
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address Snapshot */}
          {order.shippingAddress && (
            <div className="pt-4 border-t border-canvas-border text-xs text-gray-600">
              <span className="font-bold text-gray-700 uppercase tracking-wider block mb-1">
                Delivering To:
              </span>
              <p className="font-semibold text-brand-900">{order.shippingAddress.name} • {order.shippingAddress.phone}</p>
              <p>{order.shippingAddress.street}</p>
              {(order.shippingAddress.landmark || order.shippingAddress.apartment) && (
                <p>{order.shippingAddress.landmark || order.shippingAddress.apartment}</p>
              )}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
            </div>
          )}

          {/* PDF Invoice Download & Action Buttons */}
          <div className="pt-6 border-t border-canvas-border flex flex-wrap items-center justify-between gap-4">
            <a
              href={`/api/orders/invoice?id=${order.id || order.orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              download={`Invoice-${order.orderNumber}.pdf`}
              className="px-6 py-3 rounded-2xl bg-brand-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-cream-200" /> Download Tax Invoice (PDF)
            </a>

            <div className="flex items-center gap-3">
              <Link
                href={`/track-order?id=${order.orderNumber}`}
                className="px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Package className="w-4 h-4" /> Live Tracking
              </Link>
              <Link
                href="/shop"
                className="px-5 py-3 rounded-2xl bg-canvas-subtle hover:bg-gray-200 text-brand-900 font-semibold text-xs transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-10 py-12 bg-white rounded-3xl border border-canvas-border shadow-cozy p-6 space-y-4">
          <p className="text-xs text-gray-600">Your order is being processed by our store system.</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/account"
              className="px-5 py-2.5 rounded-full bg-brand-800 text-white font-semibold text-xs"
            >
              Go to My Account
            </Link>
            <Link
              href="/shop"
              className="px-5 py-2.5 rounded-full bg-canvas-subtle text-brand-900 font-semibold text-xs"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-gray-500">Loading order details...</div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
