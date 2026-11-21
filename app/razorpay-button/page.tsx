'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function RazorpayButton() {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (formRef.current) {
      formRef.current.innerHTML = '';
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
      script.setAttribute('data-payment_button_id', 'pl_U25DhYhGoNUrLa');
      script.async = true;
      formRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl border border-canvas-border shadow-cozy text-center max-w-md w-full space-y-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            🧪 Razorpay Test Mode
          </span>
          <h2 className="font-serif text-2xl font-bold text-brand-900 mt-3">Loop & Love Checkout</h2>
          <p className="text-xs text-gray-500 mt-1">Pay securely via official Razorpay test payment button</p>
        </div>

        <form ref={formRef} className="flex justify-center min-h-[45px] items-center" />

        <div className="pt-4 border-t border-canvas-border/80 flex items-center justify-between text-xs">
          <Link
            href="/checkout"
            className="text-brand-800 font-semibold hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart Checkout
          </Link>
          <span className="text-gray-400 flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL
          </span>
        </div>
      </div>
    </div>
  );
}
