# Loop & Love — End-to-End Testing & Supabase Verification Guide

This document outlines the end-to-end verification checklist and architecture for the **Loop & Love** artisanal crochet e-commerce platform.

---

## 🏗️ Architecture & Single Source of Truth

- **Database**: Supabase PostgreSQL (17 relational tables with Foreign Keys, Cascades, and Indexes).
- **Authentication**: Supabase Auth (Email OTP tokens with 6–8 digit support, Magic Link callback, Cloudflare Turnstile bot protection).
- **Storage**: Supabase Storage Buckets (`product-images` for catalog media, `custom-request-refs` for custom brief attachments).
- **Security**: Row Level Security (RLS) enabled on all 17 tables, admin role verification in PostgreSQL trigger and Next.js middleware, service-role key restricted strictly to `server-only` code (`lib/supabase/admin.ts`).
- **No Mock Stores**: All references to `localStorage.getItem('loop_custom_products')` and in-memory databases have been completely removed. Supabase is the sole source of truth.

---

## 📋 Comprehensive Phase Verification Checklist

### Phase 1: Setup & Client Isolation
- [x] `@supabase/supabase-js`, `@supabase/ssr`, and `server-only` installed.
- [x] Client helper `lib/supabase/client.ts` uses `createBrowserClient`.
- [x] Server helper `lib/supabase/server.ts` uses `createServerClient` with Next.js cookies.
- [x] Admin helper `lib/supabase/admin.ts` uses `createClient` with `SUPABASE_SERVICE_ROLE_KEY` and is protected by `server-only`.
- [x] Next.js `middleware.ts` handles cookie session refreshes and blocks unauthenticated users from `/admin/*` and `/account/*`.
- [x] `.env.example` lists all required environment variables.

### Phase 2: Database Schema & TypeScript Types
- [x] Migration `0001_initial_schema.sql` creates all 17 public tables:
  1. `profiles`
  2. `categories`
  3. `products`
  4. `product_images`
  5. `addresses`
  6. `carts`
  7. `cart_items`
  8. `delivery_zones`
  9. `couriers`
  10. `orders`
  11. `order_items`
  12. `order_status_history`
  13. `custom_requests`
  14. `reviews`
  15. `wishlist`
  16. `newsletter_subscribers`
  17. `notify_me_requests`
- [x] Auto-updating `updated_at` triggers and `on_auth_user_created` trigger.
- [x] Full TypeScript interfaces defined in `lib/supabase/database.types.ts`.

### Phase 3: Row Level Security & Storage
- [x] Migration `0002_row_level_security.sql` enables RLS on every table.
- [x] Helper function `public.is_admin()` defined with `SECURITY DEFINER`.
- [x] Profiles role escalation trigger blocks regular users from setting `role = 'admin'`.
- [x] Storage buckets `product-images` (public read, admin write) and `custom-request-refs` (authenticated write, owner/admin read) created.
- [x] Migration guide and SQL execution steps documented in `supabase/README.md`.

### Phase 4: Authentication & Roles
- [x] Separate **Sign In** and **Create Account** forms in `/login`.
- [x] Create Account collects `Full Name` and `Phone Number` and records them into `public.profiles`.
- [x] Input supports 6 to 8-digit OTP codes sent by Supabase Auth email.
- [x] Resend cooldown timer (60s).
- [x] Magic Link / confirmation click handler in `app/auth/callback/route.ts`.
- [x] Cloudflare Turnstile bot verification (`components/Turnstile.tsx`) with auto-pass for local development.
- [x] Admin login (`/admin/login`) verifies `role === 'admin'` before allowing dashboard entry.

### Phase 5: Products & Shop Catalog
- [x] `/api/products` queries Supabase `products`, `product_images`, and `categories`.
- [x] Soft-delete filter (`is_active = true` for customers; all products visible for admins).
- [x] Admin product management (`/admin/products`): Add, edit, and soft-delete products.
- [x] Direct image upload to Supabase Storage bucket `product-images` via `/api/upload`.
- [x] Cache revalidation (`revalidatePath`) triggered on catalog changes.
- [x] Fully removed `loop_custom_products` localStorage hijacks.

### Phase 6: Cart, Checkout, Delivery Zones & Orders
- [x] **Pincode Verification**: Live check against `/api/delivery-zone/check?pincode=...`. Displays delivery method (`Local Hand Delivery` vs `Courier Delivery`), fee, and estimated days.
- [x] **Unserved PIN Blocking**: Blocks checkout submission if PIN code is not served and displays inline "Notify Me When Available" form.
- [x] **Prepaid Only**: Cash on Delivery (COD) removed completely. Payments routed through Razorpay (UPI, Cards, Net Banking).
- [x] **Server-side Security**: `/api/orders` recalculates product prices, validates stock, and validates delivery zone server-side.
- [x] **Order Cancellation**: Customers can cancel orders from `/account` **only** while in the confirmed stage (`paid`, `confirmed`, `order confirmed`).
- [x] **Inventory Restock**: Cancelling an order automatically restores item stock in `public.products` and logs to `order_status_history`.
- [x] **Cart Sync**: `CartContext` synchronizes items and wishlist with Supabase `carts`, `cart_items`, and `wishlist` for logged-in users, merging guest items seamlessly upon login.
- [x] **Admin Fulfillment**: `/admin/orders` supports milestone advancement, local delivery person assignment, courier tracking numbers, and live CSV export.

### Phase 7: Custom Orders, Newsletter, Notify-Me, Reviews & Wishlist
- [x] **Custom Orders**: `/custom-orders` and `/api/custom-orders` persist custom crochet briefs to Supabase `custom_requests` table with reference image upload.
- [x] **Newsletter**: `/api/newsletter` saves email subscriptions to `newsletter_subscribers` table.
- [x] **Restock & Unserved PIN Alerts**: `/api/notify-me` saves alerts into `notify_me_requests`.
- [x] **Artisan Reviews**: `/api/reviews` fetches approved reviews and records customer feedback into `reviews` table.
- [x] **Wishlist**: Synchronized with Supabase `wishlist` table when logged in.

### Phase 8: Hardening & Build Verification
- [x] `SUPABASE_SERVICE_ROLE_KEY` is strictly confined to `lib/supabase/admin.ts` with `server-only`.
- [x] Security headers configured in `next.config.js` (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
- [x] `npm run build` compiles with 0 errors.

### Phase 9: Hero Slideshow & Media Storage Verification
- [ ] **Add a Slide**: In Admin (`/admin/hero`), add a new slide with custom image, headline, and link; click **Save & Publish Live**.
- [ ] **Incognito & Mobile Verification**: Open the homepage in an incognito window and across mobile network data.
- [ ] **Zero-Flicker Reload Test**: Reload the homepage 5 consecutive times; confirm there is no content flicker, no layout shift, and slides render instantly from the server without resetting.
- [ ] **Edit, Reorder & Delete**: In Admin (`/admin/hero`), edit slide text, reorder using Move Up/Down arrows, or delete a slide; verify the storefront updates immediately on the next visit via `revalidatePath('/')`.
- [ ] **Non-Admin Security Verification**:
  - Verify that an unauthenticated user or customer profile CANNOT write, insert, update, or delete in `public.hero_slides` via the Supabase client.
  - Verify that non-admins CANNOT upload or delete files in the `hero-images` storage bucket.
- [ ] **Zero Unsplash URLs**: Confirm no Unsplash image URLs remain anywhere in the hero slideshow codebase or in the built production output (`.next`). Zero active slides displays the neutral branded fallback with logo, never stock photos.

---

## 🔑 Configuration & Placeholders Status

| Service / Variable | Status | Description |
|-------------------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Connected | Live Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connected | Public client key for browser auth & queries |
| `SUPABASE_SERVICE_ROLE_KEY` | Connected | Private backend admin key for server routes |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Sandbox / Placeholder | Ready for production Razorpay Live Key ID (`rzp_live_...`) |
| `RAZORPAY_KEY_SECRET` | Sandbox / Placeholder | Ready for production Razorpay Key Secret |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sandbox / Optional | Ready for Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Sandbox / Optional | Ready for Cloudflare Turnstile secret key |
| Custom SMTP (Resend / Gmail) | Configured in Supabase | Used for email OTP & signup confirmations |
