import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-brand-900">Shipping & Delivery Policy</h1>
      <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-xs text-gray-700 leading-relaxed space-y-4">
        <p><strong>Last Updated: November 2026</strong></p>
        <p>
          At <strong>Loop & Love</strong>, every single product is meticulously handcrafted by skilled women artisans. We take pride in delivering our creations safely and beautifully wrapped across all deliverable PIN codes in India.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">1. Preparation & Crafting Time</h3>
        <p>
          - Ready-to-ship catalog items: Prepared and dispatched within <strong>2 to 3 business days</strong>.<br />
          - Custom and personalized orders: Crafted within <strong>7 to 10 business days</strong> depending on design complexity.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">2. Shipping Charges & Free Shipping Threshold</h3>
        <p>
          - <strong>Free Shipping:</strong> Available on all orders with a net payable subtotal of ₹999 or above.<br />
          - Flat rate express shipping of ₹99 applies to orders under ₹999.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">3. Courier Partners & Tracking</h3>
        <p>
          All orders are shipped via trusted express courier partners (BlueDart, Delhivery, DTDC). A live tracking link is emailed and available inside your Loop & Love account dashboard.
        </p>
      </div>
    </div>
  );
}
