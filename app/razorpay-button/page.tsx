'use client';

import Script from 'next/script';

export default function RazorpayButton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-12 px-4">
      <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-center max-w-md w-full">
        <h2 className="font-serif text-xl font-bold text-brand-900 mb-2">Loop & Love Instant Checkout</h2>
        <p className="text-xs text-gray-500 mb-6">Complete your payment securely via official Razorpay gateway</p>
        <form className="flex justify-center">
          <Script
            src="https://checkout.razorpay.com/v1/payment-button.js"
            data-payment_button_id="pl_U25DhYhGoNUrLa"
            async
            strategy="lazyOnload"
          />
        </form>
      </div>
    </div>
  );
}
