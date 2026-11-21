-- ====================================================================
-- LOOP & LOVE CROCHET BOUTIQUE — COMPLETE CONSOLIDATED SUPABASE SCHEMA
-- Matches All Data Specifications: Categories, Products, Images, Profiles,
-- Addresses, Orders, Order Items, Order Status History, Carts & RLS.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile row on user registration via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'customer'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    discount_price NUMERIC(10, 2),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    materials TEXT DEFAULT '100% Premium Milk Cotton Yarn',
    dimensions TEXT,
    prep_time_days INT NOT NULL DEFAULT 2,
    care_instructions TEXT DEFAULT 'Hand wash gently in cold water. Lay flat to dry.',
    highlights TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. PRODUCT IMAGES
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    image_url TEXT, -- Backward compatibility alias
    sort_order INT NOT NULL DEFAULT 0,
    display_order INT NOT NULL DEFAULT 0, -- Backward compatibility alias
    alt_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to keep url/image_url and sort_order/display_order in sync
CREATE OR REPLACE FUNCTION public.sync_product_images_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.url IS NULL AND NEW.image_url IS NOT NULL THEN
        NEW.url = NEW.image_url;
    ELSIF NEW.image_url IS NULL AND NEW.url IS NOT NULL THEN
        NEW.image_url = NEW.url;
    END IF;

    IF NEW.sort_order = 0 AND NEW.display_order <> 0 THEN
        NEW.sort_order = NEW.display_order;
    ELSIF NEW.display_order = 0 AND NEW.sort_order <> 0 THEN
        NEW.display_order = NEW.sort_order;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_product_images_trg ON public.product_images;
CREATE TRIGGER sync_product_images_trg
    BEFORE INSERT OR UPDATE ON public.product_images
    FOR EACH ROW EXECUTE FUNCTION public.sync_product_images_columns();

-- 5. SAVED CUSTOMER ADDRESSES
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    line1 TEXT NOT NULL,
    line2 TEXT DEFAULT '',
    street_address TEXT, -- Backward compatibility alias
    apartment TEXT,      -- Backward compatibility alias
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to keep line1/street_address and line2/apartment in sync
CREATE OR REPLACE FUNCTION public.sync_addresses_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.line1 IS NULL AND NEW.street_address IS NOT NULL THEN
        NEW.line1 = NEW.street_address;
    ELSIF NEW.street_address IS NULL AND NEW.line1 IS NOT NULL THEN
        NEW.street_address = NEW.line1;
    END IF;

    IF NEW.line2 IS NULL AND NEW.apartment IS NOT NULL THEN
        NEW.line2 = NEW.apartment;
    ELSIF NEW.apartment IS NULL AND NEW.line2 IS NOT NULL THEN
        NEW.apartment = NEW.line2;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_addresses_trg ON public.addresses;
CREATE TRIGGER sync_addresses_trg
    BEFORE INSERT OR UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.sync_addresses_columns();

DROP TRIGGER IF EXISTS set_addresses_updated_at ON public.addresses;
CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON public.addresses
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. CARTS & CART ITEMS (Database persistence for logged-in users)
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    variant_color TEXT DEFAULT 'Standard',
    variant_size TEXT DEFAULT 'Standard',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_id)
);

-- 7. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'paid' CHECK (
        status IN ('pending_payment', 'paid', 'making', 'packed', 'out_for_delivery', 'shipped', 'delivered', 'cancelled')
    ),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed', 'refunded')
    ),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_refund_id TEXT,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (delivery_fee >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    delivery_method TEXT NOT NULL DEFAULT 'local_own' CHECK (delivery_method IN ('local_own', 'courier_manual')),
    
    -- Address Snapshot Fields (Preserved permanently even if user deletes address)
    shipping_full_name TEXT NOT NULL,
    shipping_phone TEXT NOT NULL,
    shipping_line1 TEXT NOT NULL,
    shipping_line2 TEXT DEFAULT '',
    shipping_street_address TEXT,
    shipping_apartment TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_pincode TEXT NOT NULL,
    
    -- Cancellation & Notes
    customer_note TEXT,
    cancel_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    
    -- Delivery coordination
    delivery_person_name TEXT,
    delivery_person_phone TEXT,
    courier_name TEXT,
    tracking_number TEXT,
    tracking_url TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. ORDER ITEMS (Item Snapshots)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    image_url TEXT, -- Snapshot of product image at time of purchase
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ORDER STATUS HISTORY (Audit Trail)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. INDEXES FOR HIGH-PERFORMANCE QUERIES
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES RLS
DROP POLICY IF EXISTS "Public can view own profile" ON public.profiles;
CREATE POLICY "Public can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- CATEGORIES RLS
DROP POLICY IF EXISTS "Public can read active categories" ON public.categories;
CREATE POLICY "Public can read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to categories" ON public.categories;
CREATE POLICY "Admins have full access to categories"
    ON public.categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- PRODUCTS RLS
DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
    ON public.products FOR SELECT
    USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admins have full access to products" ON public.products;
CREATE POLICY "Admins have full access to products"
    ON public.products FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- PRODUCT IMAGES RLS
DROP POLICY IF EXISTS "Public can read images of active products" ON public.product_images;
CREATE POLICY "Public can read images of active products"
    ON public.product_images FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_images.product_id
              AND (p.is_active = true OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Admins have full access to product images" ON public.product_images;
CREATE POLICY "Admins have full access to product images"
    ON public.product_images FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ADDRESSES RLS
DROP POLICY IF EXISTS "Customers can manage own addresses" ON public.addresses;
CREATE POLICY "Customers can manage own addresses"
    ON public.addresses FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- CARTS & CART ITEMS RLS
DROP POLICY IF EXISTS "Customers can manage own cart" ON public.carts;
CREATE POLICY "Customers can manage own cart"
    ON public.carts FOR ALL
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Customers can manage own cart items" ON public.cart_items;
CREATE POLICY "Customers can manage own cart items"
    ON public.cart_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.id = cart_items.cart_id
              AND (c.user_id = auth.uid() OR public.is_admin())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts c
            WHERE c.id = cart_items.cart_id
              AND (c.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ORDERS RLS
DROP POLICY IF EXISTS "Customers can read own orders" ON public.orders;
CREATE POLICY "Customers can read own orders"
    ON public.orders FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ORDER ITEMS RLS
DROP POLICY IF EXISTS "Customers can read own order items" ON public.order_items;
CREATE POLICY "Customers can read own order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
              AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ORDER STATUS HISTORY RLS
DROP POLICY IF EXISTS "Customers can read own order history" ON public.order_status_history;
CREATE POLICY "Customers can read own order history"
    ON public.order_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
              AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

-- ====================================================================
-- SUPABASE STORAGE BUCKET: 'product-images'
-- ====================================================================

-- 1. Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    10485760, -- 10 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Storage Policies
DROP POLICY IF EXISTS "Public can view product images in storage" ON storage.objects;
CREATE POLICY "Public can view product images in storage"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'product-images' AND public.is_admin());
