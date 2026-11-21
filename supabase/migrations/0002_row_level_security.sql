-- ====================================================================
-- LOOP & LOVE CROCHET - SUPABASE DATABASE MIGRATION
-- Migration: 0002_row_level_security.sql
-- Complete Row Level Security (RLS) & Supabase Storage Policies
-- ====================================================================

-- ====================================================================
-- 1. SECURITY DEFINER: is_admin() FUNCTION
-- ====================================================================
-- Secure function to check whether the current caller is an admin.
-- Runs with elevated definer privileges to safely query profiles without recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Prevent regular customers from modifying their own role column
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_role();

-- ====================================================================
-- 2. ENABLE ROW LEVEL SECURITY ON EVERY TABLE (Deny all by default)
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notify_me_requests ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 3. PUBLIC VIEW: active_couriers
-- ====================================================================
CREATE OR REPLACE VIEW public.active_couriers AS
  SELECT id, name, tracking_url_template
  FROM public.couriers
  WHERE is_active = true;

GRANT SELECT ON public.active_couriers TO anon, authenticated;

-- ====================================================================
-- 4. TABLE POLICIES
-- ====================================================================

-- --------------------------------------------------------------------
-- A. PROFILES
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Customers can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- B. CATEGORIES
-- --------------------------------------------------------------------
CREATE POLICY "Public can view active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to categories"
  ON public.categories FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- C. PRODUCTS
-- --------------------------------------------------------------------
CREATE POLICY "Public can view active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to products"
  ON public.products FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- D. PRODUCT IMAGES
-- --------------------------------------------------------------------
CREATE POLICY "Public can view images of active products"
  ON public.product_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id AND p.is_active = true
    )
  );

CREATE POLICY "Admins have full access to product images"
  ON public.product_images FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- E. ADDRESSES
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their own active addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Customers can insert their own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to addresses"
  ON public.addresses FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- F. CARTS & CART ITEMS
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their own cart"
  ON public.carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can create their own cart"
  ON public.carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own cart"
  ON public.carts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can delete their own cart"
  ON public.carts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can view their cart items"
  ON public.cart_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can insert into their cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can update their cart items"
  ON public.cart_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can delete their cart items"
  ON public.cart_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to carts"
  ON public.carts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins have full access to cart items"
  ON public.cart_items FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- G. DELIVERY ZONES
-- --------------------------------------------------------------------
CREATE POLICY "Public can view active delivery zones"
  ON public.delivery_zones FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to delivery zones"
  ON public.delivery_zones FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- H. COURIERS
-- --------------------------------------------------------------------
CREATE POLICY "Public can view active couriers"
  ON public.couriers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins have full access to couriers"
  ON public.couriers FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- I. ORDERS
-- --------------------------------------------------------------------
-- Customers can view only their own orders
CREATE POLICY "Customers can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Customers CANNOT insert or update orders directly; only the server with the service role client does this.
CREATE POLICY "Admins have full access to orders"
  ON public.orders FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- J. ORDER ITEMS
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to order items"
  ON public.order_items FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- K. ORDER STATUS HISTORY
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their order status history"
  ON public.order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to order status history"
  ON public.order_status_history FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- L. REVIEWS (Verified Purchasers Only)
-- --------------------------------------------------------------------
CREATE POLICY "Public can view approved reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Verified purchasers can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      WHERE o.user_id = auth.uid()
        AND o.status = 'delivered'
        AND oi.product_id = reviews.product_id
    )
  );

CREATE POLICY "Admins have full access to reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- M. WISHLIST
-- --------------------------------------------------------------------
CREATE POLICY "Customers can view their own wishlist"
  ON public.wishlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can insert into their wishlist"
  ON public.wishlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can delete from their wishlist"
  ON public.wishlist FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full access to wishlist"
  ON public.wishlist FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- N. CUSTOM REQUESTS
-- --------------------------------------------------------------------
-- Anyone can submit a custom crochet commission request
CREATE POLICY "Public can insert custom requests"
  ON public.custom_requests FOR INSERT
  WITH CHECK (true);

-- Customers can view only their own requests
CREATE POLICY "Customers can view their own custom requests"
  ON public.custom_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view and manage all custom requests
CREATE POLICY "Admins have full access to custom requests"
  ON public.custom_requests FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- O. NEWSLETTER SUBSCRIBERS
-- --------------------------------------------------------------------
CREATE POLICY "Public can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins have full access to newsletter subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (public.is_admin());

-- --------------------------------------------------------------------
-- P. NOTIFY ME REQUESTS
-- --------------------------------------------------------------------
CREATE POLICY "Public can submit restock alert requests"
  ON public.notify_me_requests FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins have full access to notify me requests"
  ON public.notify_me_requests FOR ALL
  USING (public.is_admin());

-- ====================================================================
-- 5. SUPABASE STORAGE BUCKETS & POLICIES
-- ====================================================================

-- Create Storage Buckets (product-images: public, custom-request-refs: private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  ),
  (
    'custom-request-refs',
    'custom-request-refs',
    false, -- Private bucket: signed URLs only
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for product-images (Public Read, Admin Write)
CREATE POLICY "Public can view product images in storage"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.is_admin());

-- Storage Policies for custom-request-refs (Private, Signed URLs, Owner & Admin Only)
CREATE POLICY "Owner and admin can read custom request reference images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'custom-request-refs'
    AND (
      public.is_admin()
      OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
    )
  );

CREATE POLICY "Users can upload custom request reference images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'custom-request-refs'
    AND (
      public.is_admin()
      OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
      OR auth.role() = 'anon'
    )
  );
