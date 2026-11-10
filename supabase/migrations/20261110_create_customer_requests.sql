-- ==============================================================================
-- pmart: Customer Product Request and Order Management System
-- Migration: 20261110_create_customer_requests.sql
-- ==============================================================================

-- 1. Enable UUID Extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table (Store Catalog)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for product browsing
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- 3. Customer Requests Table (Catalog Product Requests)
CREATE TABLE IF NOT EXISTS public.customer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(32) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL CHECK (length(trim(customer_name)) >= 2),
    phone VARCHAR(30) NOT NULL CHECK (length(trim(phone)) >= 7),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    estimated_total NUMERIC(12, 2) NOT NULL CHECK (estimated_total >= 0),
    delivery_address TEXT NOT NULL CHECK (length(trim(delivery_address)) >= 5),
    customer_message TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    admin_notes TEXT,
    confirmed_quantity INTEGER CHECK (confirmed_quantity IS NULL OR confirmed_quantity > 0),
    confirmed_price NUMERIC(12, 2) CHECK (confirmed_price IS NULL OR confirmed_price >= 0),
    stock_at_request INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for request management
CREATE INDEX IF NOT EXISTS idx_customer_requests_status ON public.customer_requests(status);
CREATE INDEX IF NOT EXISTS idx_customer_requests_created_at ON public.customer_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_requests_code ON public.customer_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_customer_requests_phone ON public.customer_requests(phone);

-- 4. Custom Product Requests Table (Unlisted / Sourcing Requests)
CREATE TABLE IF NOT EXISTS public.custom_product_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(32) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL CHECK (length(trim(customer_name)) >= 2),
    phone VARCHAR(30) NOT NULL CHECK (length(trim(phone)) >= 7),
    requested_product_name VARCHAR(255) NOT NULL CHECK (length(trim(requested_product_name)) >= 2),
    description TEXT NOT NULL CHECK (length(trim(description)) >= 5),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    expected_budget NUMERIC(12, 2) CHECK (expected_budget IS NULL OR expected_budget >= 0),
    delivery_address TEXT NOT NULL CHECK (length(trim(delivery_address)) >= 5),
    reference_image_url TEXT,
    additional_requirements TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
    admin_notes TEXT,
    confirmed_quantity INTEGER CHECK (confirmed_quantity IS NULL OR confirmed_quantity > 0),
    confirmed_price NUMERIC(12, 2) CHECK (confirmed_price IS NULL OR confirmed_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for custom requests
CREATE INDEX IF NOT EXISTS idx_custom_product_requests_status ON public.custom_product_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_product_requests_created_at ON public.custom_product_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_product_requests_code ON public.custom_product_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_custom_product_requests_phone ON public.custom_product_requests(phone);

-- 5. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_requests_updated_at ON public.customer_requests;
CREATE TRIGGER trg_customer_requests_updated_at
    BEFORE UPDATE ON public.customer_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_custom_product_requests_updated_at ON public.custom_product_requests;
CREATE TRIGGER trg_custom_product_requests_updated_at
    BEFORE UPDATE ON public.custom_product_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. Row Level Security (RLS) Configuration
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_product_requests ENABLE ROW LEVEL SECURITY;

-- Products Policies: Public can read active products; Admins can manage
CREATE POLICY "Public read active products"
    ON public.products
    FOR SELECT
    USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Admin manage products"
    ON public.products
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

-- Customer Requests Policies:
-- 1. Public can insert new requests (no login required)
CREATE POLICY "Public anonymous insert customer requests"
    ON public.customer_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        quantity > 0 AND
        length(trim(customer_name)) >= 2 AND
        length(trim(phone)) >= 7 AND
        length(trim(delivery_address)) >= 5 AND
        status = 'PENDING'
    );

-- 2. Only authorized admins can view customer requests (protects customer phone & address)
CREATE POLICY "Admin select customer requests"
    ON public.customer_requests
    FOR SELECT
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
        OR auth.role() = 'service_role'
    );

-- 3. Only admins can update request status or add notes
CREATE POLICY "Admin update customer requests"
    ON public.customer_requests
    FOR UPDATE
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
        OR auth.role() = 'service_role'
    );

-- Custom Product Requests Policies:
-- 1. Public can insert custom requests
CREATE POLICY "Public anonymous insert custom product requests"
    ON public.custom_product_requests
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        quantity > 0 AND
        length(trim(customer_name)) >= 2 AND
        length(trim(phone)) >= 7 AND
        length(trim(requested_product_name)) >= 2 AND
        length(trim(delivery_address)) >= 5 AND
        status = 'PENDING'
    );

-- 2. Only admins can view custom requests
CREATE POLICY "Admin select custom product requests"
    ON public.custom_product_requests
    FOR SELECT
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
        OR auth.role() = 'service_role'
    );

-- 3. Only admins can update custom requests
CREATE POLICY "Admin update custom product requests"
    ON public.custom_product_requests
    FOR UPDATE
    TO authenticated, service_role
    USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
        OR auth.role() = 'service_role'
    );

-- 7. Secure Verification Function for Customer Self-Tracking
-- Allows customer to view ONLY their own request status by providing request_code AND phone
CREATE OR REPLACE FUNCTION public.track_customer_request(
    p_code TEXT,
    p_phone TEXT
)
RETURNS TABLE (
    request_code VARCHAR(32),
    product_name VARCHAR(255),
    quantity INTEGER,
    status VARCHAR(20),
    created_at TIMESTAMPTZ,
    confirmed_quantity INTEGER,
    confirmed_price NUMERIC(12, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.request_code,
        cr.product_name,
        cr.quantity,
        cr.status,
        cr.created_at,
        cr.confirmed_quantity,
        cr.confirmed_price
    FROM public.customer_requests cr
    WHERE cr.request_code = trim(p_code)
      AND (
          cr.phone = trim(p_phone)
          OR replace(replace(replace(cr.phone, ' ', ''), '-', ''), '+', '') = replace(replace(replace(p_phone, ' ', ''), '-', ''), '+', '')
      )
    UNION ALL
    SELECT 
        cpr.request_code,
        cpr.requested_product_name AS product_name,
        cpr.quantity,
        cpr.status,
        cpr.created_at,
        cpr.confirmed_quantity,
        cpr.confirmed_price
    FROM public.custom_product_requests cpr
    WHERE cpr.request_code = trim(p_code)
      AND (
          cpr.phone = trim(p_phone)
          OR replace(replace(replace(cpr.phone, ' ', ''), '-', ''), '+', '') = replace(replace(replace(p_phone, ' ', ''), '-', ''), '+', '')
      );
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_customer_request(TEXT, TEXT) TO anon, authenticated;

-- 8. Seed Initial Catalog Products for pmart
INSERT INTO public.products (id, name, slug, description, category, price, stock, image_url)
VALUES
    ('a0000001-0000-0000-0000-000000000001', 'Smart Wireless Noise-Cancelling Headphones Pro', 'smart-wireless-headphones-pro', 'Ultra-crisp acoustic drivers with active 40dB noise cancellation, 35-hour battery life and fast charging.', 'Electronics', 4499.00, 18, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'),
    ('a0000002-0000-0000-0000-000000000002', 'Ultra-Thin Mechanical Gaming Keyboard RGB', 'ultra-thin-mechanical-keyboard', 'Custom linear mechanical switches with low-profile keycaps, per-key RGB backlighting and Bluetooth 5.2.', 'Computers', 3299.00, 8, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'),
    ('a0000003-0000-0000-0000-000000000003', 'Stainless Steel Thermal Water Flask (1 Litre)', 'thermal-water-flask-1l', 'Double-wall vacuum insulation keeps drinks chilled for 24h or hot for 12h. Matte powder finish with leak-proof cap.', 'Home & Living', 899.00, 2, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'),
    ('a0000004-0000-0000-0000-000000000004', '4K Ultra-HD Action Camera with Waterproof Gimbal', '4k-uhd-action-camera', 'Captures 4K @ 60FPS with 6-axis gyro stabilization, dual touch screens, and waterproof case up to 40 meters.', 'Cameras', 7999.00, 5, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'),
    ('a0000005-0000-0000-0000-000000000005', 'Ergonomic Breathable Mesh Executive Chair', 'ergonomic-mesh-chair', 'Multi-tilt lock mechanism, adjustable lumbar support, 3D armrests, and high-density breathable mesh back.', 'Office & Furniture', 8499.00, 0, 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=600&auto=format&fit=crop&q=80'),
    ('a0000006-0000-0000-0000-000000000006', 'Organic Arabica Dark Roast Artisan Coffee Beans (500g)', 'organic-arabica-coffee-beans', 'Single-origin highland coffee beans ethically sourced and freshly slow-roasted with notes of cocoa and toasted nuts.', 'Food & Grocery', 650.00, 24, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

