'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { Address } from '@/lib/types';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  AlertCircle,
  Sparkles,
  MapPin,
  Bell,
  Check,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface DeliveryZoneInfo {
  zoneName: string;
  pincode: string;
  deliveryMethod: 'local_own' | 'courier_manual';
  deliveryFee: number;
  freeAbove: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discountAmount, coupon, clearCart } = useCart();
  const { user } = useAuth();

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Delivery zone state
  const [zoneChecking, setZoneChecking] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<DeliveryZoneInfo | null>(null);
  const [zoneMessage, setZoneMessage] = useState('');
  const [isUnservedPincode, setIsUnservedPincode] = useState(false);

  // Notify me for unserved pincode
  const [notifyEmail, setNotifyEmail] = useState(user?.email || '');
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  // Payment states (Prepaid only, no COD)
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY_UPI' | 'RAZORPAY_CARD' | 'RAZORPAY_NETBANKING'>('RAZORPAY_UPI');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync user profile data when loaded
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!customerEmail && user.email) {
        setCustomerEmail(user.email);
        setNotifyEmail(user.email);
      }
      if (!customerPhone && user.phone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Live Pincode Verification
  useEffect(() => {
    const clean = pincode.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      checkDeliveryZone(clean);
    } else {
      setDeliveryZone(null);
      setIsUnservedPincode(false);
      setZoneMessage('');
    }
  }, [pincode]);

  const checkDeliveryZone = async (code: string) => {
    setZoneChecking(true);
    setZoneMessage('');
    setIsUnservedPincode(false);

    try {
      const res = await fetch(`/api/delivery-zone/check?pincode=${code}`);
      const data = await res.json();

      if (data.success && data.served && data.zone) {
        setDeliveryZone(data.zone);
        setIsUnservedPincode(false);
        setZoneMessage(`✓ Delivers to ${data.zone.zoneName} (${data.zone.deliveryMethod === 'local_own' ? 'Local Hand Delivery' : 'Courier Delivery'} • Est. ${data.zone.estimatedDaysMin}-${data.zone.estimatedDaysMax} days)`);
      } else {
        setDeliveryZone(null);
        setIsUnservedPincode(true);
        setZoneMessage(data.message || `Sorry, we do not currently deliver to PIN code ${code}.`);
      }
    } catch {
      setDeliveryZone(null);
      setIsUnservedPincode(false);
      setZoneMessage('Could not verify PIN code. Please check connection.');
    } finally {
      setZoneChecking(false);
    }
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;

    setNotifyLoading(true);
    try {
      const res = await fetch('/api/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: notifyEmail,
          pincode: pincode.trim(),
          requestType: 'unserved_pincode',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotifySuccess(true);
      }
    } catch (err) {
      console.warn('Notify me error:', err);
    } finally {
      setNotifyLoading(false);
    }
  };

  // Dynamic fee calculation based on verified delivery zone
  let finalShippingCharge = 99;
  if (deliveryZone) {
    if (deliveryZone.freeAbove && subtotal >= deliveryZone.freeAbove) {
      finalShippingCharge = 0;
    } else {
      finalShippingCharge = deliveryZone.deliveryFee;
    }
  } else if (subtotal >= 999) {
    finalShippingCharge = 0;
  }

  const taxAmount = Math.round((subtotal - discountAmount) * 0.05 * 100) / 100;
  const calculatedTotal = Math.max(0, subtotal - discountAmount + finalShippingCharge + taxAmount);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-serif text-2xl font-bold text-brand-900">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500 mt-2">Add handcrafted crochet creations to proceed to checkout.</p>
        <Link href="/shop" className="mt-4 inline-block px-6 py-2.5 rounded-full bg-brand-600 text-white text-xs font-semibold">
          Return to Shop
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isUnservedPincode || !deliveryZone) {
      setErrorMessage('Please enter a serviceable 6-digit Indian PIN code to proceed with checkout.');
      return;
    }

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
        pincode: pincode.trim(),
        isDefault: true,
        createdAt: new Date().toISOString(),
      };

      // 1. Create order on server (recalculates server-side prices and inventory)
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
          customerNote: specialInstructions,
          paymentMethod: `Razorpay (${paymentMethod})`,
        }),
      });

      const orderData = await res.json();
      if (!orderData.success) {
        setErrorMessage(orderData.message || 'Order initialization failed.');
        setIsProcessing(false);
        return;
      }

      const createdOrder = orderData.order;
      const razorpayConfig = orderData.razorpay;
      const rzpKey = razorpayConfig?.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // 2. TRIGGER RAZORPAY OFFICIAL CHECKOUT
      if (typeof window !== 'undefined' && window.Razorpay && rzpKey && rzpKey !== 'rzp_test_placeholder') {
        const options = {
          key: rzpKey,
          amount: razorpayConfig?.amount || Math.round(createdOrder.total * 100),
          currency: razorpayConfig?.currency || 'INR',
          name: 'Loop & Love Crochet',
          description: `Order #${createdOrder.orderNumber} Payment`,
          image: '/images/loop-and-love-logo.jpg',
          order_id: razorpayConfig?.orderId || createdOrder.razorpayOrderId,
          handler: async function (response: any) {
            try {
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
          setErrorMessage(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
          setIsProcessing(false);
        });
        rzp.open();
      } else {
        // High-fidelity sandbox / test payment completion:
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
          setErrorMessage(verifyData.message || 'Order completed.');
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
        <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Secure Checkout</span>
        <h1 className="font-serif text-3xl font-bold text-brand-900 mt-1">Delivery Details & Payment</h1>
        <p className="text-xs text-gray-500 mt-1">100% Secure Prepaid Payment • Handcrafted with Care</p>
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
              <span className="text-xs font-normal text-gray-500">For tracking & invoice</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address (for order updates) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Number (for delivery coordination) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Shipping Address & Live Pincode Check */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border flex items-center justify-between">
              <span>2. Delivery Address & Service Check</span>
              <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Pincode Verified
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">PIN Code (6 digits) *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 560001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none font-mono ${
                      isUnservedPincode
                        ? 'border-red-400 focus:border-red-500'
                        : deliveryZone
                        ? 'border-emerald-500 focus:border-emerald-600'
                        : 'border-canvas-border focus:border-brand-500'
                    }`}
                  />
                  {zoneChecking && (
                    <span className="absolute right-3 top-3 text-xs text-gray-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" /> Checking...
                    </span>
                  )}
                </div>

                {/* ZONE STATUS FEEDBACK */}
                {zoneMessage && (
                  <div
                    className={`mt-2 p-3 rounded-xl text-xs flex items-center gap-2 ${
                      isUnservedPincode
                        ? 'bg-rose-50 border border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium'
                    }`}
                  >
                    {isUnservedPincode ? (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    ) : (
                      <Truck className="w-4 h-4 shrink-0 text-emerald-600" />
                    )}
                    <span>{zoneMessage}</span>
                  </div>
                )}

                {/* UNSERVED PINCODE NOTIFY ME FORM */}
                {isUnservedPincode && (
                  <div className="mt-3 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <p className="text-xs text-amber-900 font-semibold flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-700" /> Notify me when delivery expands to {pincode}:
                    </p>
                    {notifySuccess ? (
                      <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> You will be notified the moment we open deliveries in PIN {pincode}!
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={notifyEmail}
                          onChange={(e) => setNotifyEmail(e.target.value)}
                          className="flex-1 text-xs p-2.5 bg-white border border-amber-300 rounded-xl focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleNotifyMe}
                          disabled={notifyLoading}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0"
                        >
                          {notifyLoading ? 'Saving...' : 'Notify Me'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Street Address / House No. / Flat No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Sunflower Heights, 4th Main"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Metro Station"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
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
                    placeholder="e.g. Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Delivery Note or Special Gift Message (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please leave with security, or handwritten note: 'Happy Birthday!'"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Payment Method (Prepaid Only - No COD) */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border flex items-center justify-between">
              <span>3. Prepaid Payment Gateway (Razorpay)</span>
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
                    <span className="text-[11px] text-gray-500">Google Pay, PhonePe, Paytm, BHIM, Any UPI ID</span>
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
                  {finalShippingCharge === 0 ? <span className="text-emerald-700">FREE</span> : `₹${finalShippingCharge}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (5% GST included)</span>
                <span className="font-semibold text-brand-900">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-canvas-border flex justify-between text-base font-bold text-brand-900">
                <span>Total Payable</span>
                <span>₹{calculatedTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || isUnservedPincode || !deliveryZone}
              className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-cozy hover:shadow-cozy-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : isUnservedPincode ? (
                <span>PIN Code Not Serviceable</span>
              ) : !deliveryZone ? (
                <span>Enter Valid PIN Code to Pay</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" /> Pay ₹{calculatedTotal.toLocaleString('en-IN')} Securely
                </>
              )}
            </button>

            <div className="text-[11px] text-gray-400 text-center space-y-1">
              <p>🛡️ Official Razorpay Payments Gateway (Prepaid Only)</p>
              <p>Instant PDF Tax Invoice generated upon payment</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
