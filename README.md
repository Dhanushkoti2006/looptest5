# LOOP & LOVE – Artisanal Crochet E-Commerce Platform

> **"Handmade with Love, Just for You."**

A complete, production-ready full-stack e-commerce platform designed and engineered for **LOOP & LOVE**, handcrafted around the official **Loop & Love** brand identity.

---

## 🌸 Brand Identity & Visual Design

Derived directly from the official **Loop & Love** circular emblem:
- **Brand Lilac / Lavender** (`#9D7BB0`, `#B697C8`, `#6B477F`): Signature brand color for primary buttons, active swatches, and accents.
- **Buttercream / Champagne Cream** (`#FBF5E5`, `#F5EAC8`): Warm, cozy highlight accents, badge labels, and borders.
- **Dusty Rose / Mauve** (`#C98B9E`, `#B06E83`): Romantic accents, wishlist hearts, and artisan tags.
- **Deep Plum Charcoal** (`#2E1D36`): Ultra-readable, luxurious typography and contrast elements.
- **Canvas Pearl** (`#FAF7F2`): Natural, warm background evoking organic cotton.
- **Typography**: Editorial serif headings (`Georgia` / `Playfair Display` aesthetic) paired with clean, accessible sans-serif body text (`Plus Jakarta Sans` / `Inter`).

---

## 🌟 Key Features & Capabilities

### 1. Customer Storefront
- **Top Announcement Bar**: Live promotional strip with Free Gift Box callout for orders above ₹999.
- **Interactive Hero Slideshow**: Seamless multi-slide showcase with CTA links to catalog collections and custom studio.
- **Shop by Category**: Highlighting Flowers & Bouquets, Granny Square Bags, Soft Toys, Keychains, Accessories, and Home Decor.
- **Product Catalog & Dynamic Filtering**:
  - Filter by category, price slider, and availability (In Stock / Sold Out).
  - Search with instant autocomplete.
  - Sort by newest, price low-high, price high-low, popularity, and customer rating.
  - One-click wishlist toggle.
- **Product Detail Studio**:
  - Multi-photo gallery and carousel preview.
  - Real-time color swatches and size pickers.
  - Preparation lead-time badge (e.g. 2-3 business days craft time).
  - Material specifications (100% Milk Cotton Yarn, wire stems, ceramic pots).
  - Detailed care guide (hand wash, flat dry).
  - **Sold Out & Restock Notification**: Automatically disables purchase when stock is 0 and opens a restock email registration form.
  - Customer review submission with 5-star ratings.
- **Dedicated Custom Crochet Order Studio**:
  - Custom request form: product type, description, color palette, dimensions, budget range, required delivery date, reference photo URL, and special packaging notes.
  - Automatic quote generation workflow.
- **Shopping Cart & Checkout**:
  - Free shipping progress bar (₹999 threshold).
  - Coupon discount system (`WELCOME10`, `LOVELOOP`, `FESTIVE15`).
  - Itemized calculation: subtotal, discount, shipping, and 5% GST.
  - Delivery address form with PIN code and instructions.
- **Secure Razorpay Payment Gateway**:
  - Official Razorpay checkout support for UPI (Google Pay, PhonePe, Paytm), Debit/Credit cards (RuPay, Visa, Mastercard), and 50+ NetBanking options.
  - High-fidelity sandbox simulation mode when API keys are not yet configured.
  - Server-side signature verification.
  - Automatic stock reduction upon confirmed payment.
- **Live Order Tracking**:
  - 13 distinct milestone statuses (*Order Placed*, *Payment Verified*, *Making Your Crochet Product*, *Quality Check*, *Packed*, *Shipped*, *Delivered*).
  - Tracking lookup by Order ID (e.g. `LL-2026-1001`).
- **PDF Tax Invoice Generation**:
  - Automated downloadable PDF invoice with Loop & Love logo, invoice number, itemized pricing, GST details, customer address, and artisan pledge.
- **Customer Account Portal**:
  - Mobile / Email OTP verification with cooldown timer and dev bypass mode.
  - Customer profile, order history, custom requests, and saved addresses.
- **Floating WhatsApp Button**:
  - Quick action floating contact button with direct WhatsApp chat dialog.

---

### 2. Complete Admin Dashboard
Access URL: `/admin` (Pre-seeded Super Admin account ready)
- **Overview & Business Analytics**:
  - Real-time KPIs: Total Revenue, Total Orders Placed, Active Production Queue, Custom Orders, Average Order Value.
  - Interactive 7-Day Revenue Trend graph.
  - Best-selling products leaderboard with pieces sold and revenue.
  - Recent orders queue with one-click status updater.
  - Date filtering: *Today*, *Last 7 Days*, *Last 30 Days*, *All Time*.
- **Product & Stock Management (`/admin/products`)**:
  - Add new products modal with photo URLs, tags, prep time, and materials.
  - Inline stock level adjustment with automatic Sold Out status toggling.
  - Edit and archive products.
- **Order Fulfillment & Tracking (`/admin/orders`)**:
  - Search orders by ID, customer name, or phone.
  - Filter orders by milestone status.
  - Update milestone with custom artisan notes and courier tracking numbers.
  - Download PDF invoices.
  - Export all orders to CSV.
- **Custom Order Management (`/admin/custom-orders`)**:
  - Review custom briefs and uploaded reference images.
  - Create and dispatch custom quotations with price breakdown and crafting days.
  - Update status (`QUOTED`, `PAID_IN_PRODUCTION`, `COMPLETED`).
- **Database Visibility & Raw Inspector (`/admin/database`)**:
  - Direct live inspection of database tables: `orders`, `products`, `users`, `customOrders`, `coupons`, `notifications`.
  - Search and filter records.
  - Real-time raw JSON object viewer.
  - Export tables to JSON.

---

## 🛠️ Technology Architecture

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend & APIs**: Next.js Route Handlers (`/api/products`, `/api/orders`, `/api/custom-orders`, `/api/coupons`, `/api/analytics`, `/api/auth/otp`).
- **Database Layer**:
  - **Local Zero-Config Engine**: File-backed persistent ACID database stored in `.data/db.json` with concurrency control.
  - **Production PostgreSQL / Supabase Schema**: Complete SQL migration script provided in `supabase_schema.sql` with full Row-Level Security (RLS) policies.
- **Payment Processing**: Razorpay REST API + Server-side HMAC-SHA256 signature verification.
- **Invoice Engine**: `jspdf` server-side PDF generator.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js LTS (v18+ or v20+)
- npm or pnpm

### 2. Running Locally

```bash
# 1. Start the Next.js development server
npm run dev

# 2. Or start the optimized production server
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Demo Credentials
- **Admin Console**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Pre-seeded Admin**: `admin@loopandlove.com` (Super Admin mode accessible with one-click switcher or OTP `123456`)
- **Customer Account**: `priya@example.com`
- **Sample Order ID**: `LL-2026-1001` (Pre-loaded with live tracking timeline and PDF invoice)
- **Active Promotional Coupons**:
  - `WELCOME10`: 10% off on orders above ₹999 (Max ₹300)
  - `LOVELOOP`: Flat ₹200 off on orders above ₹1,499
  - `FESTIVE15`: 15% off on orders above ₹2,499 (Max ₹600)

---

## 💳 Payment Gateway Setup (Razorpay)

By default, the platform runs in **Sandbox Test Mode** so you can test orders, stock deductions, and invoices without configuring credentials.

To enable live Razorpay transactions:
1. Sign up at [https://razorpay.com](https://razorpay.com).
2. Generate API Keys in **Settings → API Keys**.
3. Add them to `.env.local`:
```env
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_yourKeyHere
RAZORPAY_KEY_SECRET=yourSecretHere
RAZORPAY_WEBHOOK_SECRET=yourWebhookSecretHere
```

---

## 🗄️ Supabase Production Migration

To connect to a managed Supabase PostgreSQL instance:
1. Create a project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase.
3. Paste the contents of `supabase_schema.sql` and click **Run**.
4. Configure your Supabase credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=yourAnonKeyHere
SUPABASE_SERVICE_ROLE_KEY=yourServiceRoleKeyHere
```

---

## 📦 Directory Structure

```
c:\Users\AKASH\3D Objects\loop\
├── app/
│   ├── layout.tsx                # Root layout with Cart/Auth providers & Razorpay script
│   ├── page.tsx                  # Premium Homepage (hero, collections, custom callout, reviews)
│   ├── shop/page.tsx             # Catalog with category, price, and availability filters
│   ├── product/[slug]/page.tsx   # Product detail page, swatches, reviews, restock notify
│   ├── custom-orders/page.tsx    # Bespoke custom crochet design request studio
│   ├── cart/page.tsx             # Shopping cart, free shipping meter, coupon system
│   ├── checkout/page.tsx         # Delivery addresses, Razorpay gateway integration
│   ├── order-success/page.tsx    # Confetti celebration, order summary, PDF invoice
│   ├── track-order/page.tsx      # Live order tracking with 13-stage milestone stepper
│   ├── account/
│   │   ├── page.tsx              # Customer profile, order history, custom requests
│   │   └── auth/page.tsx         # OTP verification login & registration
│   ├── about/page.tsx            # Brand story & crochet philosophy
│   ├── contact/page.tsx          # Contact inquiry form, FAQs, WhatsApp direct link
│   ├── policies/                 # Shipping, returns, privacy policies
│   ├── admin/
│   │   ├── layout.tsx            # Admin sidebar & role-based authentication check
│   │   ├── page.tsx              # Analytics dashboard, revenue chart, order funnel
│   │   ├── products/page.tsx     # Add/edit products, stock adjuster, sold-out toggles
│   │   ├── orders/page.tsx       # Order management, courier tracking number, CSV export
│   │   ├── custom-orders/page.tsx# Custom requests review, reference photos, quotations
│   │   └── database/page.tsx     # Raw database table inspector & JSON object viewer
│   └── api/                      # Full REST API endpoints (orders, products, coupons, etc.)
├── components/
│   ├── Navbar.tsx                # Announcement bar, logo, search, cart/wishlist badges
│   ├── Footer.tsx                # Brand values, quick links, newsletter, payment badges
│   ├── ProductCard.tsx           # Luxury card with sold out overlay, price discount, swatches
│   └── WhatsAppButton.tsx        # Floating WhatsApp customer support button
├── lib/
│   ├── types.ts                  # TypeScript data interfaces
│   ├── db.ts                     # Database query & mutation methods
│   ├── seedData.ts               # Curated starter products, categories, admin users
│   ├── razorpay.ts               # Razorpay order creator & signature verifier
│   ├── invoice.ts                # PDF Tax Invoice generator (jspdf)
│   ├── CartContext.tsx           # Cart state, wishlist, coupons, tax calculations
│   └── AuthContext.tsx           # OTP authentication, session management, user roles
├── public/
│   └── images/
│       └── loop-and-love-logo.jpg# Official Loop & Love brand logo
├── .data/
│   └── db.json                   # Local persistent database
├── supabase_schema.sql           # Complete Supabase PostgreSQL relational schema
├── tailwind.config.js            # Custom brand color theme (lilac, cream, mauve, plum)
└── package.json                  # Next.js 14, React 18, TypeScript, Tailwind, Lucide
```

---

## 🌸 Artisan Support
For inquiries, design questions, or custom requests:
- **Email**: `contact@loopandlove.com`
- **WhatsApp Support**: `+91 98765 43210`
- **Location**: Bengaluru, Karnataka, India

<!-- otp and admin changes -->
