import React from 'react';
import { siteConfig } from '@/src/config/site';

export default function ReturnsPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-6">
      <h1 className="font-serif text-3xl font-bold text-brand-900">Return, Exchange & Refund Policy</h1>
      <div className="bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy text-xs text-gray-700 leading-relaxed space-y-4">
        <p><strong>Artisanal Quality Commitment</strong></p>
        <p>
          Because every Loop & Love creation is individually hand-hooked and customized, slight variations in stitch tension or color hues are natural hallmarks of authentic handmade artistry.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">1. Transit Damage or Defects</h3>
        <p>
          In the rare event that your product arrives damaged in transit or defective, please contact our support team at <strong>{siteConfig.contactEmail}</strong> or WhatsApp <strong>+91 98765 43210</strong> within 48 hours of delivery along with an unboxing photo or video. We will promptly dispatch a replacement or issue a full refund.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">2. Custom & Personalized Items</h3>
        <p>
          Bespoke custom orders made to customer-specific names or custom dimensions cannot be returned once approved and shipped, unless damaged in transit.
        </p>
        <h3 className="font-serif font-bold text-base text-brand-900 pt-2">3. Refund Processing</h3>
        <p>
          Approved refunds are credited directly back to the original payment method (Razorpay UPI, Card, NetBanking) within 5-7 business days.
        </p>
      </div>
    </div>
  );
}
