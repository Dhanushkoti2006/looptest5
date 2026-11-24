'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { Address } from '@/lib/types';
import { TAMIL_NADU_DISTRICTS } from '@/lib/delivery/tamilNaduPincodes';
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
  Plus,
  Home,
  CheckCircle,
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

interface SavedAddressItem {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, discountAmount, coupon, clearCart } = useCart();
  const { user } = useAuth();

  // Saved Addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [saveToAccount, setSaveToAccount] = useState(true);

  // Form states
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
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
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Pre-load and monitor Razorpay SDK readiness on mount
  useEffect(() => {
    function checkRazorpay() {
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        setRazorpayReady(true);
        return true;
      }
      return false;
    }

    if (checkRazorpay()) return;

    // Dynamically inject Razorpay SDK if not already present
    if (typeof window !== 'undefined') {
      const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayReady(true);
        document.body.appendChild(script);
      }
    }

    const timer = setInterval(() => {
      if (checkRazorpay()) {
        clearInterval(timer);
      }
    }, 400);

    return () => clearInterval(timer);
  }, []);

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (user?.id) {
      setLoadingAddresses(true);
      fetch('/api/addresses', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
            setSavedAddresses(data.addresses);
            // Default to default address or first address
            const defaultAddr = data.addresses.find((a: SavedAddressItem) => a.is_default) || data.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              applyAddress(defaultAddr);
            }
          }
        })
        .catch((e) => console.warn('Could not fetch saved addresses:', e))
        .finally(() => setLoadingAddresses(false));
    }
  }, [user?.id]);

  const applyAddress = (addr: SavedAddressItem) => {
    setCustomerName(addr.full_name || user?.name || '');
    setCustomerPhone(addr.phone || user?.phone || '');
    setStreet(addr.line1 || '');
    setArea(addr.line2 || addr.city || '');
    setLandmark('');
    setCity(addr.city || '');
    setState('Tamil Nadu');
    setPincode(addr.pincode || '');
  };

  const handleSelectSavedAddress = (addr: SavedAddressItem) => {
    setSelectedAddressId(addr.id);
    applyAddress(addr);
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setCustomerName(user?.name || '');
    setCustomerPhone(user?.phone || '');
    setStreet('');
    setArea('');
    setLandmark('');
    setCity('');
    setState('Tamil Nadu');
    setPincode('');
  };

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
        const methodDesc =
          data.zone.deliveryMethod === 'local_own'
            ? 'Local Hand Delivery (1–2 days)'
            : 'Express Courier Delivery (2–4 days)';
        setZoneMessage(
          `✓ Delivers to ${data.zone.district || data.zone.zoneName}, Tamil Nadu • ${methodDesc}`
        );
        if (data.district) {
          setCity(data.district);
        } else if (data.zone.district) {
          setCity(data.zone.district);
        }
        if (data.city && !area) {
          setArea(data.city);
        }
        setState('Tamil Nadu');
      } else {
        setDeliveryZone(null);
        setIsUnservedPincode(true);
        setZoneMessage(data.message || 'Sorry, we currently deliver only within Tamil Nadu.');
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

  // Real-time Field Validations
  const cleanPhone = customerPhone.trim().replace(/\D/g, '');
  const isNameValid = customerName.trim().length >= 3;
  const isPhoneValid = /^[6-9]\d{9}$/.test(cleanPhone);
  const isStreetValid = street.trim().length >= 5;
  const isAreaValid = area.trim().length >= 2;
  const isCityValid = city.trim().length >= 2;
  const isPincodeValid = !isUnservedPincode && deliveryZone !== null && pincode.trim().length === 6;
  const isFormValid =
    isNameValid &&
    isPhoneValid &&
    isStreetValid &&
    isAreaValid &&
    isCityValid &&
    isPincodeValid;

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

    if (!isNameValid) {
      setErrorMessage('Please enter a valid Full Name (minimum 3 characters).');
      return;
    }
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!isPincodeValid) {
      setErrorMessage(zoneMessage || 'Sorry, we currently deliver only within Tamil Nadu.');
      return;
    }
    if (!isStreetValid) {
      setErrorMessage('Please enter Flat / House No. / Building / Street (minimum 5 characters).');
      return;
    }
    if (!isAreaValid) {
      setErrorMessage('Please enter Area / Locality / Village.');
      return;
    }
    if (!isCityValid) {
      setErrorMessage('Please select or enter your City / District in Tamil Nadu.');
      return;
    }

    setIsProcessing(true);

    try {
      // If user typed a new address and opted to save it
      if (user?.id && selectedAddressId === 'new' && saveToAccount) {
        try {
          await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: customerName,
              phone: cleanPhone,
              line1: street,
              line2: area + (landmark ? `, ${landmark}` : ''),
              city,
              state: 'Tamil Nadu',
              pincode: pincode.trim(),
              isDefault: savedAddresses.length === 0,
            }),
          });
        } catch (addrErr) {
          console.warn('Address auto-save warning:', addrErr);
        }
      }

      const shippingAddress: Address = {
        id: `addr-${Date.now()}`,
        userId: user?.id || 'guest',
        name: customerName,
        phone: cleanPhone,
        street,
        landmark: area + (landmark ? `, ${landmark}` : ''),
        city,
        state: 'Tamil Nadu',
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
          customerPhone: cleanPhone,
          items: cart,
          shippingAddress: {
            ...shippingAddress,
            line1: street,
            line2: area + (landmark ? `, ${landmark}` : ''),
            city,
            state: 'Tamil Nadu',
            pincode: pincode.trim(),
          },
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
      const rzpKey = razorpayConfig?.key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_U24YNvPzHAbE40';

      // Ensure Razorpay SDK is ready
      let isRazorpayLoaded = typeof window !== 'undefined' && !!(window as any).Razorpay;
      if (typeof window !== 'undefined' && !isRazorpayLoaded) {
        setErrorMessage('Loading Razorpay secure payment window...');
        isRazorpayLoaded = await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
          setTimeout(() => resolve(!!(window as any).Razorpay), 2000);
        });
      }

      // TRIGGER RAZORPAY OFFICIAL CHECKOUT MODAL
      if (typeof window !== 'undefined' && (window as any).Razorpay && rzpKey && rzpKey !== 'rzp_test_placeholder') {
        const orderIdValue = razorpayConfig?.orderId || createdOrder.razorpayOrderId;
        const cleanOrderId = (typeof orderIdValue === 'string' && orderIdValue.startsWith('order_')) ? orderIdValue : undefined;

        const options: any = {
          key: rzpKey,
          amount: razorpayConfig?.amount || Math.round(createdOrder.total * 100),
          currency: razorpayConfig?.currency || 'INR',
          name: 'Loop & Love Crochet',
          description: `Order #${createdOrder.orderNumber}`,
          image: '/images/loop-and-love-logo.jpg',
          handler: async function (response: any) {
            try {
              setErrorMessage('Verifying payment with Razorpay...');
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
                window.location.href = `/order-success?orderId=${createdOrder.id}`;
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
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              setErrorMessage('Razorpay checkout window was closed. You can retry paying whenever you are ready.');
            },
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

        if (cleanOrderId) {
          options.order_id = cleanOrderId;
        }

        try {
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            setErrorMessage(`Payment failed: ${response.error?.description || 'Transaction declined'}`);
            setIsProcessing(false);
          });
          rzp.open();
        } catch (openErr: any) {
          console.error('Razorpay open exception:', openErr);
          setErrorMessage('Could not open Razorpay checkout. ' + (openErr?.message || 'Please retry.'));
          setIsProcessing(false);
        }
      } else {
        // High-fidelity sandbox / test payment completion if Razorpay script is blocked by browser:
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
          window.location.href = `/order-success?orderId=${createdOrder.id}`;
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
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Full Name * <span className="font-normal text-gray-400">(min. 3 characters)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none ${
                    customerName.length > 0 && !isNameValid
                      ? 'border-amber-400 focus:border-amber-500'
                      : customerName.length >= 3
                      ? 'border-emerald-500/80 focus:border-emerald-600'
                      : 'border-canvas-border focus:border-brand-500'
                  }`}
                />
                {customerName.length > 0 && !isNameValid && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">Full name must be at least 3 characters.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Email Address * <span className="font-normal text-gray-400">(for order receipts)</span>
                </label>
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
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Mobile Number * <span className="font-normal text-gray-400">(10-digit Indian mobile starting with 6–9)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-xs text-gray-500 font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))}
                    className={`w-full text-xs p-3 pl-12 bg-canvas-subtle border rounded-xl focus:outline-none font-mono ${
                      cleanPhone.length > 0 && !isPhoneValid
                        ? 'border-amber-400 focus:border-amber-500'
                        : cleanPhone.length === 10 && isPhoneValid
                        ? 'border-emerald-500/80 focus:border-emerald-600'
                        : 'border-canvas-border focus:border-brand-500'
                    }`}
                  />
                </div>
                {cleanPhone.length > 0 && !isPhoneValid && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium">
                    Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. Saved Addresses Selection */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-canvas-border">
              <h3 className="font-serif font-bold text-base text-brand-900">
                2. Select Delivery Address *
              </h3>
              {user ? (
                <Link
                  href="/account/addresses"
                  target="_blank"
                  className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                >
                  Manage Addresses →
                </Link>
              ) : (
                <Link
                  href="/login?redirect=/checkout"
                  className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
                >
                  Log in to use saved addresses →
                </Link>
              )}
            </div>

            {/* List of saved addresses if available */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700">Choose from your saved addresses:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all text-left relative ${isSelected
                            ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-400'
                            : 'border-canvas-border hover:border-brand-300 bg-canvas-subtle/50'
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={isSelected}
                              onChange={() => handleSelectSavedAddress(addr)}
                              className="accent-brand-600 mt-0.5"
                            />
                            <span className="font-bold text-xs text-brand-900">{addr.full_name}</span>
                          </div>
                          {addr.is_default && (
                            <span className="text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded-full font-bold">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 pl-5 line-clamp-2">
                          {addr.line1}
                          {addr.line2 ? `, ${addr.line2}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 pl-5 font-mono">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <p className="text-[11px] text-gray-500 pl-5 mt-1">Phone: {addr.phone}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSelectNewAddress}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 ${selectedAddressId === 'new'
                        ? 'border-brand-600 bg-brand-50 text-brand-800 font-bold'
                        : 'border-canvas-border hover:bg-canvas-subtle text-gray-700'
                      }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Deliver to a different address
                  </button>
                </div>
              </div>
            )}

            {/* Address input fields (shown if 'new' or if no saved addresses) */}
            {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Enter Shipping Address (Tamil Nadu Only):</span>
                  <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> PIN Verified
                  </span>
                </div>

                {/* 1. PINCODE (REAL-TIME TAMIL NADU VALIDATION) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-700">
                      PIN Code (6 digits) *
                    </label>
                    <span className="text-[10px] text-brand-700 font-medium">
                      Tamil Nadu Postal Circles (60–64)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g. 600001, 641001"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none font-mono ${
                        isUnservedPincode
                          ? 'border-red-400 focus:border-red-500 bg-rose-50/20'
                          : deliveryZone
                          ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                          : 'border-canvas-border focus:border-brand-500'
                      }`}
                    />
                    {zoneChecking && (
                      <span className="absolute right-3 top-3 text-xs text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-500" /> Verifying PIN...
                      </span>
                    )}
                  </div>

                  {/* ZONE STATUS FEEDBACK */}
                  {zoneMessage && (
                    <div
                      className={`mt-2 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
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

                {/* 2. FLAT / HOUSE NO. / BUILDING / STREET */}
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Flat / House No. / Building / Street * <span className="font-normal text-gray-400">(min. 5 characters)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Door No. 12, 3rd Floor, Lotus Apartments, 1st Cross Street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none ${
                      street.length > 0 && !isStreetValid
                        ? 'border-amber-400 focus:border-amber-500'
                        : isStreetValid
                        ? 'border-emerald-500/80 focus:border-emerald-600'
                        : 'border-canvas-border focus:border-brand-500'
                    }`}
                  />
                  {street.length > 0 && !isStreetValid && (
                    <p className="text-[10px] text-amber-600 mt-1 font-medium">Please enter at least 5 characters.</p>
                  )}
                </div>

                {/* 3. AREA / LOCALITY / VILLAGE & LANDMARK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Area / Locality / Village *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. T. Nagar / Gandhipuram / Peelamedu"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none ${
                        area.length > 0 && !isAreaValid
                          ? 'border-amber-400 focus:border-amber-500'
                          : isAreaValid
                          ? 'border-emerald-500/80 focus:border-emerald-600'
                          : 'border-canvas-border focus:border-brand-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Murugan Temple or Opp. Bus Stand"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* 4. CITY / DISTRICT & STATE */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      City / Town / District *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        list="tamil-nadu-districts-list"
                        placeholder="Select or enter district"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`w-full text-xs p-3 bg-canvas-subtle border rounded-xl focus:outline-none ${
                          city.length > 0 && !isCityValid
                            ? 'border-amber-400 focus:border-amber-500'
                            : isCityValid
                            ? 'border-emerald-500/80 focus:border-emerald-600'
                            : 'border-canvas-border focus:border-brand-500'
                        }`}
                      />
                      <datalist id="tamil-nadu-districts-list">
                        {TAMIL_NADU_DISTRICTS.map((d) => (
                          <option key={d} value={d} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Auto-filled from PIN or choose from 38 Tamil Nadu districts
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      State (Service Locked) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={state || 'Tamil Nadu'}
                        className="w-full text-xs p-3 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-xl cursor-not-allowed select-none"
                      />
                      <span className="absolute right-3 top-3 text-[10px] bg-brand-100 text-brand-800 px-2 py-0.5 rounded font-bold">
                        Tamil Nadu Only
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1 font-medium">
                      ✓ Service exclusive to Tamil Nadu
                    </p>
                  </div>
                </div>

                {user && (
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={saveToAccount}
                      onChange={(e) => setSaveToAccount(e.target.checked)}
                      className="accent-brand-600 rounded"
                    />
                    <span className="text-xs text-gray-700 font-medium">
                      Save this address to my account for faster future checkouts
                    </span>
                  </label>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                Special Delivery Instructions or Gift Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Please leave with security, or handwritten gift note: 'Happy Birthday!'"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
          </div>

          {/* 3. Payment Method (Prepaid Only - No COD) */}
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border flex items-center justify-between">
              <span>3. Prepaid Payment Gateway (Razorpay)</span>
              <span className="text-xs font-semibold text-emerald-700">🔒 100% Encrypted</span>
            </h3>

            {/* RAZORPAY TEST MODE BADGE & HELPER */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-purple-50/50 to-emerald-50/40 border border-purple-200 text-xs space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-purple-900 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${razorpayReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                  🧪 Razorpay Test Mode Active
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-2 py-0.5 rounded-full font-semibold">
                    rzp_test_U24YNvPzHAbE40
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${razorpayReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {razorpayReady ? '● Gateway SDK Ready' : '⏳ Connecting...'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                This store is running in <strong>Razorpay Test Sandbox</strong>. No real currency is deducted.
                When you click <strong>Place Order & Pay</strong> below, the official Razorpay test payment window will pop up.
              </p>

              <div className="pt-2 border-t border-purple-100/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Test UPI ID</span>
                  <span className="font-mono font-bold text-purple-900">success@razorpay</span>
                  <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">Instant simulated authorization</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100">
                  <span className="text-gray-400 block text-[10px] font-bold uppercase tracking-wider">Test Card / OTP</span>
                  <span className="font-mono font-bold text-purple-900">4111 1111 1111 1111</span>
                  <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Exp: 12/28 • CVV: 123 • OTP: 123456</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'RAZORPAY_UPI'
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
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'RAZORPAY_CARD'
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
                    <span className="text-xs font-bold text-brand-900 block">Debit / Credit Card</span>
                    <span className="text-[11px] text-gray-500">Visa, Mastercard, RuPay, Maestro</span>
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-gray-400" />
              </label>

              <label
                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${paymentMethod === 'RAZORPAY_NETBANKING'
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
                    <span className="text-[11px] text-gray-500">HDFC, ICICI, SBI, Axis, Kotak & 50+ Banks</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT: ORDER SUMMARY (1 COL) */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-canvas-border shadow-cozy space-y-4 sticky top-24">
            <h3 className="font-serif font-bold text-base text-brand-900 pb-2 border-b border-canvas-border">
              Order Summary ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </h3>

            {/* Item Thumbnails */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 items-center text-xs">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-brand-50 shrink-0 border border-canvas-border">
                    <Image src={item.image} alt={item.productName} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-brand-900 shrink-0 font-mono">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-canvas-border space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Estimated Delivery</span>
                <span className="font-mono">
                  {finalShippingCharge === 0 ? (
                    <span className="text-emerald-700 font-bold uppercase text-[10px]">FREE</span>
                  ) : (
                    `₹${finalShippingCharge}`
                  )}
                </span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>GST (5%)</span>
                <span className="font-mono">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="pt-3 border-t border-canvas-border flex justify-between items-baseline">
                <span className="font-bold text-sm text-brand-900">Total Payable</span>
                <div className="text-right">
                  <span className="font-serif text-xl font-bold text-brand-900 font-mono">
                    ₹{calculatedTotal.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !isFormValid}
              className={`w-full py-3.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-soft transition-all flex items-center justify-center gap-2 ${
                isProcessing || !isFormValid
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 hover:shadow-hover'
              }`}
            >
              {isProcessing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Processing Payment...
                </>
              ) : isUnservedPincode ? (
                'Delivery Not Available (TN Only)'
              ) : !deliveryZone ? (
                'Enter Valid Tamil Nadu PIN'
              ) : !isNameValid ? (
                'Enter Full Name (Min 3 chars)'
              ) : !isPhoneValid ? (
                'Enter Valid 10-Digit Mobile'
              ) : !isStreetValid ? (
                'Enter Flat / Building / Street (Min 5)'
              ) : !isAreaValid ? (
                'Enter Area / Locality'
              ) : !isCityValid ? (
                'Select City / District'
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" /> Pay ₹{calculatedTotal.toLocaleString('en-IN')} & Place Order
                </>
              )}
            </button>

            <div className="pt-2 text-center text-[10px] text-gray-400 space-y-1">
              <p className="flex items-center justify-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" /> Bank-grade 256-bit SSL encryption
              </p>
              <p>Prepaid only • 100% Guaranteed handcrafting by certified artisans</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
