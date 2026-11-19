'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { Address } from '@/lib/types';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Banknote,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, shippingCharge, discountAmount, taxAmount, totalAmount, coupon, clearCart } = useCart();
  const { user } = useAuth();

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState('Flat 402, Lotus Greens, Indiranagar');
  const [landmark, setLandmark] = useState('Near Metro Station');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560038');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING' | 'COD'>('RAZORPAY_UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 mt-2">Add crochet products to proceed to checkout.</p>
        <Link href="/shop" className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsProcessing(true);

    try {
      const shippingAddress: Address = {
        id: `addr-${Date.now()}`,
        userId: user?.id || 'guest',
        name: customerName,
        phone: customerPhone,
        street,
        landmark,
        city,
        state,
        pincode,
        isDefault: true,
        createdAt: new Date().toISOString(),
      };

      // 1. Create order on server (revalidates price & inventory)
      const isCOD = paymentMethod === 'COD';
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          customerName,
          customerEmail,
          customerPhone,
          items: cart,
          shippingAddress,
          couponCode: coupon?.code,
          specialInstructions,
          paymentMethod: isCOD ? 'Cash on Delivery (COD)' : `Razorpay (${paymentMethod})`,
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        setErrorMessage(orderData.message || 'Order initialization failed.');
        setIsProcessing(false);
        return;
      }

      const createdOrder = orderData.order;

      // IF CASH ON DELIVERY (COD): Order is immediately confirmed and inventory reserved!
      if (isCOD) {
        clearCart();
        router.push(`/order-success?orderId=${createdOrder.id}`);
        return;
      }

      const razorpayConfig = orderData.razorpay;
      const rzpKey = razorpayConfig?.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U24YNvPzHAbE40';

      // 2. TRIGGER RAZORPAY CHECKOUT
      // If Razorpay SDK is loaded on window and key is available:
      if (typeof window !== 'undefined' && window.Razorpay && rzpKey) {
        const options = {
          key: rzpKey,
          amount: razorpayConfig?.amount || Math.round(createdOrder.totalAmount * 100),
          currency: razorpayConfig?.currency || 'INR',
          name: 'Loop & Love Crochet',
          description: `Order #${createdOrder.orderNumber} Payment`,
          image: '/images/loop-and-love-logo.jpg',
          order_id: razorpayConfig?.orderId,
          handler: async function (response: any) {
            try {
              // Verify payment on server
              const verifyRes = await fetch('/api/payments/razorpay/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderId: createdOrder.id,
                  order: createdOrder,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                clearCart();
                router.push(`/order-success?orderId=${createdOrder.id}`);
              } else {
                setErrorMessage(verifyData.message || 'Payment verification failed. Please contact support.');
                setIsProcessing(false);
              }
            } catch (verr) {
              console.error('Verification error:', verr);
              setErrorMessage('Payment verification request failed. Please check connection.');
              setIsProcessing(false);
            }
          },
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone,
          },
          theme: {
            color: '#9D7BB0',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setErrorMessage(`Payment failed: ${response.error.description}`);
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // High-Fidelity Test / Sandbox Mode verification:
        // Automatically completes payment verification and proceeds to invoice & order tracking!
        const simulatedPaymentId = `pay_sim_${Date.now()}`;
        const simulatedSignature = `sig_sim_${Date.now()}_verified`;

        const verifyRes = await fetch('/api/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: createdOrder.id,
            order: createdOrder,
            razorpayOrderId: razorpayConfig?.orderId || `ord_${Date.now()}`,
            razorpayPaymentId: simulatedPaymentId,
            razorpaySignature: simulatedSignature,
          }),
        });

        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          clearCart();
          router.push(`/order-success?orderId=${createdOrder.id}`);
        } else {
          setErrorMessage(verifyData.message || 'Payment simulation failed.');
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setErrorMessage('An unexpected error occurred during checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Secure Payment</span>
        <h1 className="font-serif text-3xl font-bold text-brand-900 mt-1">Checkout & Delivery Details</h1>
      </div>

      {errorMessage && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: DELIVERY & PAYMENT DETAILS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Customer Information */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border flex items-center justify-between">
              <span>1. Contact Information</span>
              <span className="text-xs font-normal text-gray-500">For tracking & PDF invoice</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (for invoice) *</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (for delivery SMS/OTP) *</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border">
              2. Delivery Address
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Street Address / House No. *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Delivery Instructions / Gift Message
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please leave package with security, or write a note: 'Happy Birthday!'"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border flex items-center justify-between">
              <span>3. Payment Gateway (Razorpay)</span>
              <span className="text-xs font-semibold text-emerald-700">🔒 100% Encrypted</span>
            </h3>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY_UPI'
                    ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-400'
                    : 'border-canvas-border hover:bg-canvas-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY_UPI'}
                    onChange={() => setPaymentMethod('RAZORPAY_UPI')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-brand-900 block">Instant UPI Payment</span>
                    <span className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, BHIM, Any UPI</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Fastest</span>
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY_CARD'
                    ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-400'
                    : 'border-canvas-border hover:bg-canvas-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY_CARD'}
                    onChange={() => setPaymentMethod('RAZORPAY_CARD')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-brand-900 block">Credit / Debit Cards</span>
                    <span className="text-[11px] text-gray-500">RuPay, Visa, Mastercard, American Express</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-gray-400" />
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'RAZORPAY_NETBANKING'
                    ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-400'
                    : 'border-canvas-border hover:bg-canvas-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY_NETBANKING'}
                    onChange={() => setPaymentMethod('RAZORPAY_NETBANKING')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-brand-900 block">Net Banking</span>
                    <span className="text-[11px] text-gray-500">SBI, HDFC, ICICI, Axis, Kotak & 50+ banks</span>
                  </div>
                </div>
              </label>

              {/* CASH ON DELIVERY OPTION */}
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-400'
                    : 'border-canvas-border hover:bg-canvas-subtle'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-brand-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-brand-900 block flex items-center gap-1.5">
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[11px] text-gray-500">Pay cash or UPI to courier upon doorstep arrival</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-brand-700 bg-brand-100/70 px-2.5 py-1 rounded-full text-[10px] font-bold">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Pay on Delivery</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY (1 COL) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-5 sticky top-28">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-3 border-b border-canvas-border">
              Order Items ({cart.length})
            </h3>

            {/* List preview */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 truncate">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-brand-100">
                      <Image src={item.image} alt={item.productName} fill className="object-cover" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-brand-900 truncate">{item.productName}</p>
                      <p className="text-[10px] text-gray-400">
                        Qty: {item.quantity} • {item.color}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-brand-900 shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-canvas-border space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-brand-900">
                  {shippingCharge === 0 ? <span className="text-emerald-700">FREE</span> : `₹${shippingCharge}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (5% GST included)</span>
                <span className="font-semibold text-brand-900">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-canvas-border flex justify-between text-base font-bold text-brand-900">
                <span>Total Payable</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-cozy hover:shadow-cozy-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Confirming Order...
                </>
              ) : paymentMethod === 'COD' ? (
                <>
                  <Banknote className="w-4 h-4" /> Place Cash on Delivery Order (₹{totalAmount.toLocaleString('en-IN')})
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Pay ₹{totalAmount.toLocaleString('en-IN')} Securely
                </>
              )}
            </button>

            <div className="text-[11px] text-gray-400 text-center space-y-1">
              <p>🛡️ Powered by official Razorpay Payments Gateway</p>
              <p>Instant PDF Tax Invoice generated upon payment</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
