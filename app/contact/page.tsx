'use client';

import React, { useState } from 'react';
import { siteConfig } from '@/src/config/site';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, HelpCircle } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
    setTimeout(() => setSubmitted(false), 4000);
  };

  const faqs = [
    {
      q: 'How long does it take to make and deliver my crochet order?',
      a: 'Since each piece is hand-crocheted by our artisans, standard catalog creations typically take 2-3 business days to prepare, followed by 3-5 days for All-India express shipping. Custom orders take 7-10 crafting days.',
    },
    {
      q: 'Can I wash or clean my crochet products?',
      a: 'Yes! Spot cleaning with a damp cloth and mild soap is ideal. For our plush amigurumi toys and granny square bags, you can gently hand wash in cold water with mild baby detergent, reshape while damp, and flat-dry in the shade. Do not bleach or wring.',
    },
    {
      q: 'Can I request specific wedding bouquet or bridesmaid colors?',
      a: 'Absolutely! Our Custom Order Studio lets you pick your exact color theme (or upload a swatch photo of your wedding outfit). We will match yarns accordingly and send photo previews before shipping.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all secure payments powered by Razorpay: UPI (Google Pay, PhonePe, Paytm, BHIM), all major Credit/Debit Cards (RuPay, Visa, Mastercard), and 50+ NetBanking options.',
    },
    {
      q: 'Do you deliver across India?',
      a: 'Yes, we provide safe, crush-proof express delivery across all PIN codes in India. Orders above ₹999 enjoy 100% Free Shipping!',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      <div className="text-center max-w-xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Get in Touch</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900 mt-1">We Would Love to Hear From You</h1>
        <p className="text-sm text-gray-500 mt-2">
          Have a query about product care, wholesale orders, or custom designs? Our artisan support team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info (1 col) */}
        <div className="bg-brand-900 text-cream-100 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-serif text-2xl font-bold text-white">Artisan Studio</h3>
            <p className="text-xs text-cream-200/80 leading-relaxed">
              Every stitch is handcrafted at our partner home workshops across India.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-brand-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Email Us</span>
                  <a href={`mailto:${siteConfig.contactEmail}`} className="hover:underline text-cream-200">
                    {siteConfig.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">WhatsApp Direct</span>
                  <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="hover:underline text-cream-200">
                    +91 98765 43210 (10 AM - 7 PM)
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-white">Studio Address</span>
                  <span className="text-cream-200">Loop & Love Handmade Studio, Indiranagar, Bengaluru, KA 560038</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-800/80 rounded-2xl border border-brand-700/60 text-[11px] text-cream-300">
            🌸 <strong>Artisan Pledge:</strong> We respond to all inquiries and custom request drafts within 24 business hours.
          </div>
        </div>

        {/* Contact Form (2 cols) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-canvas-border shadow-cozy space-y-6">
          <h3 className="font-serif font-bold text-xl text-brand-900 pb-2 border-b border-canvas-border">
            Send an Inquiry Message
          </h3>

          {submitted && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Thank you! Your message has been sent to our artisan team. We will get back to you shortly.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Question about bouquet care or wholesale gifting"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Message *</label>
              <textarea
                required
                rows={4}
                placeholder="How can we assist you with our handmade creations?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-3 bg-canvas-subtle border border-canvas-border rounded-xl focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-cozy transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Send Message
            </button>
          </form>
        </div>
      </div>

      {/* FAQS */}
      <section className="pt-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500">Got Questions?</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-900 mt-1">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <div key={i} className="p-6 bg-white rounded-3xl border border-canvas-border shadow-2xs space-y-2">
              <h4 className="font-serif font-bold text-base text-brand-900 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
                {faq.q}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed pl-6">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
