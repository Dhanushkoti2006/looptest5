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
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Launch festive confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9D7BB0', '#FBF5E5', '#C98B9E', '#E2C474'],
      });
    } catch {}

    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.order) setOrder(data.order);
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

      <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
        {order?.paymentMethod?.includes('Cash on Delivery')
          ? '💵 Cash on Delivery • Order Confirmed'
          : 'Payment Verified & Order Confirmed'}
      </span>
      <h1 className="font-serif text-3xl sm:text-5xl font-bold text-brand-900 mt-2">
        Thank You for Your Order!
      </h1>
      <p className="text-sm text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
        {order?.paymentMethod?.includes('Cash on Delivery')
          ? `Your handmade order is confirmed! Please keep ₹${order.totalAmount.toLocaleString('en-IN')} in cash or UPI ready for the delivery agent upon doorstep arrival.`
          : 'We have received your payment. Our artisans have reserved your items and begun handcrafting your crochet order with utmost love!'}
      </p>

      {order && (
        <div className="mt-10 bg-white rounded-3xl border border-canvas-border p-6 sm:p-8 shadow-cozy text-left space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-canvas-border gap-4">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Order Number</span>
              <span className="font-serif text-xl font-bold text-brand-900">#{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">Payment Mode</span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                order.paymentMethod?.includes('Cash on Delivery')
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {order.paymentMethod || 'Verified Online Payment'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">
                {order.paymentMethod?.includes('Cash on Delivery') ? 'Amount to Pay on Delivery' : 'Total Paid'}
              </span>
              <span className="font-bold text-brand-900 text-lg">₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* VISUAL ORDER TIMELINE STEPPER */}
          <div>
            <h3 className="font-serif font-bold text-sm text-brand-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Live Artisan Progress
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1.5" />
                <strong className="block">1. Order Placed</strong>
                <span className="text-[10px] text-gray-500">Confirmed & Verified</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900">
                <span className="w-2 h-2 rounded-full bg-brand-500 inline-block mr-1.5 animate-pulse" />
                <strong className="block">2. Artisan Making</strong>
                <span className="text-[10px] text-gray-500">Hand-hooking stitches</span>
              </div>
              <div className="p-3 rounded-2xl bg-canvas-subtle border border-canvas-border text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block mr-1.5" />
                <strong className="block">3. Quality & Pack</strong>
                <span className="text-[10px] text-gray-400">Gift box preparation</span>
              </div>
              <div className="p-3 rounded-2xl bg-canvas-subtle border border-canvas-border text-gray-400">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block mr-1.5" />
                <strong className="block">4. Dispatched</strong>
                <span className="text-[10px] text-gray-400">All-India express</span>
              </div>
            </div>
          </div>

          {/* Items Preview */}
          <div className="pt-4 border-t border-canvas-border space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Ordered Items</h4>
            {(order.items || (order as any).order_items || []).map((item: any) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="font-medium text-brand-900">
                  {item.quantity}x {item.productName || item.product_name} {item.color ? `(${item.color}${item.size ? `, ${item.size}` : ''})` : ''}
                </span>
                <span className="font-semibold text-brand-900">
                  ₹{(item.totalPrice || (Number(item.unit_price) || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* PDF Invoice Download & Actions */}
          <div className="pt-6 border-t border-canvas-border flex flex-wrap items-center justify-between gap-4">
            <a
              href={`/api/orders/invoice?id=${order.id}`}
              download
              className="px-6 py-3 rounded-full bg-brand-900 hover:bg-black text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-cream-200" /> Download Tax Invoice (PDF)
            </a>

            <div className="flex items-center gap-3">
              <Link
                href={`/track-order?id=${order.orderNumber}`}
                className="px-6 py-3 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
              >
                <Package className="w-4 h-4" /> Live Tracking
              </Link>
              <Link
                href="/shop"
                className="px-5 py-3 rounded-full bg-canvas-subtle hover:bg-gray-200 text-brand-900 font-semibold text-xs transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
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
