'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/CartContext';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  Tag,
  ShieldCheck,
  Check,
  X,
  Truck,
} from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    shippingCharge,
    discountAmount,
    taxAmount,
    totalAmount,
    coupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setApplying(true);
    setCouponMessage(null);
    const result = await applyCoupon(couponCodeInput.trim());
    setApplying(false);

    if (result.success) {
      setCouponMessage({ text: result.message, isError: false });
      setCouponCodeInput('');
    } else {
      setCouponMessage({ text: result.message, isError: true });
    }
  };

  const freeShippingThreshold = 999;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <ShoppingBag className="w-12 h-12" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-brand-900">Your Shopping Cart is Empty</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          It looks like you haven&apos;t added any handmade crochet creations to your basket yet.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/shop"
            className="px-8 py-3.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-cozy flex items-center gap-2"
          >
            Explore Catalog <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/custom-orders"
            className="px-6 py-3.5 rounded-full bg-white border border-brand-300 text-brand-900 font-semibold text-sm hover:bg-brand-50"
          >
            Request Custom Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-canvas-border">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Review Basket</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-0.5">Your Shopping Cart</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Empty Cart
        </button>
      </div>

      {/* FREE SHIPPING PROGRESS METER */}
      <div className="mb-8 p-4 bg-brand-50 rounded-2xl border border-brand-200/80">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-brand-900 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-brand-600" />
            {amountNeededForFreeShipping === 0
              ? '🎉 Congratulations! You have unlocked FREE Express Delivery!'
              : `Add ₹${amountNeededForFreeShipping.toLocaleString('en-IN')} more to get FREE Delivery!`}
          </span>
          <span className="font-bold text-brand-700">{shippingProgress}%</span>
        </div>
        <div className="w-full bg-brand-200/60 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-brand-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${shippingProgress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CART ITEMS (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 sm:p-5 rounded-3xl border border-canvas-border shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-brand-50 shrink-0 border border-brand-100">
                  <Image src={item.image} alt={item.productName} fill className="object-cover" />
                </div>
                <div>
                  <Link href={`/product/${item.productSlug || item.productId}`}>
                    <h3 className="font-serif font-semibold text-base text-brand-900 hover:text-brand-600 transition-colors line-clamp-1">
                      {item.productName}
                    </h3>
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    Color: <strong className="text-brand-900">{item.color}</strong> • Size:{' '}
                    <strong className="text-brand-900">{item.size}</strong>
                  </p>
                  <span className="text-xs font-bold text-brand-900 mt-1 block">
                    ₹{item.price.toLocaleString('en-IN')} each
                  </span>
                </div>
              </div>

              {/* Quantity and Actions */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                <div className="flex items-center border border-canvas-border bg-white rounded-xl p-0.5">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg hover:bg-canvas-subtle font-bold text-brand-900 flex items-center justify-center text-xs"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-xs text-brand-900">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg hover:bg-canvas-subtle font-bold text-brand-900 flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-serif font-bold text-base text-brand-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ORDER SUMMARY (1 COL) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-5">
            <h3 className="font-serif font-bold text-lg text-brand-900 pb-3 border-b border-canvas-border">
              Order Summary
            </h3>

            {/* Calculations */}
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-brand-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping & Gift Packaging</span>
                <span className="font-semibold text-brand-900">
                  {shippingCharge === 0 ? <span className="text-emerald-700">FREE</span> : `₹${shippingCharge}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Estimated GST / Taxes (5%)</span>
                <span className="font-semibold text-brand-900">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-canvas-border flex justify-between text-base font-bold text-brand-900">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* COUPON INPUT */}
            <div className="pt-2">
              {coupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span>
                      Coupon <strong>{coupon.code}</strong> applied!
                    </span>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon: WELCOME10, LOVELOOP"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs uppercase bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={applying}
                      className="px-4 py-2 bg-brand-900 hover:bg-black text-white text-xs font-semibold rounded-xl"
                    >
                      {applying ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponMessage && (
                    <p
                      className={`text-[11px] font-medium ${
                        couponMessage.isError ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {couponMessage.text}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* CHECKOUT BUTTON */}
            <Link
              href="/checkout"
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-cozy hover:shadow-cozy-lg transition-all flex items-center justify-center gap-2 text-center"
            >
              Proceed to Secure Checkout <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay Verified 256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
