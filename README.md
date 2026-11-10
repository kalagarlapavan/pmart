# pmart - Customer Product Request & Order Management System

A modern, full-stack e-commerce system with a complete **Customer Product Request & Sourcing Engine**.

Customers can directly submit product inquiries and order requests without needing prior contact with the seller, browse in-stock or custom sourcing items, receive instant unique Request IDs, and communicate seamlessly via WhatsApp. Store administrators can review, accept (with optional price/quantity adjustments), reject, and track inquiries in an Admin Dashboard.

---

## 🌟 Key Features

### 1. Customer Product Request (Catalog Items)
- **"Request This Product" Button**: Available on every product card in the catalog grid and within the Product Details modal.
- **Auto-Populated Context**: Automatically binds the product ID, product name, reference image, unit price, and available inventory.
- **Form Fields**:
  - Full Name (required, min 2 chars)
  - Mobile Number (required, format validated)
  - Product ID & Name (read-only auto selection)
  - Requested Quantity (required, positive integer $\ge 1$)
  - Delivery Address (required)
  - Additional Instructions (optional)
- **Live Calculations**: Displays dynamic estimated total (`price × quantity`).
- **Stock Alert Notice**: If the requested quantity exceeds currently available stock, customers receive a clear notice:
  > *"You requested X units, which exceeds our currently available stock of Y units. Availability and procurement timelines will require seller confirmation."*
- **Double-Click & Idempotency Protection**: Disables submit button with loading spinner during processing to prevent duplicate submissions.
- **Zero Automatic Charges / No Stock Reduction**: Submitting an inquiry is not a payment and does not decrease inventory until admin verification.

### 2. Custom Product Requests ("Request a Product Not Listed")
- Allows customers to source products not currently available in the catalog.
- **Fields**: Product name, detailed specifications, desired quantity, expected budget, customer name, mobile number, delivery address, and additional notes.
- **Reference Image Upload**: Drag-and-drop or file picker with client & server-side validation:
  - File size restricted to **5 MB maximum**.
  - Allowed file types: `image/jpeg`, `image/png`, `image/webp`.
- Stored in a dedicated `custom_product_requests` table.

### 3. Immediate Confirmation & Status Tracking
- **Unique Request ID**: Generates a human-readable identifier (e.g., `REQ-202611-4821`) alongside standard UUIDs.
- **Initial Status**: Set immediately to `PENDING`.
- **Direct WhatsApp Link**: Generates a pre-filled WhatsApp message URL directed to the seller's WhatsApp number with all inquiry details.
- **Customer Self-Tracking**: Customers can enter their Request ID and phone number to verify their live status and seller notes without exposing personal details to other users.

### 4. Admin Request Dashboard
- **Section**: "Customer Requests" accessible via the top-right Admin Portal toggle.
- **KPI Metrics**: Real-time counters for Total Inquiries, Pending Review, Accepted, Completed, and Estimated Pipeline Value.
- **Filter Tabs**:
  - Filter by status: *All*, *Pending*, *Accepted*, *Rejected*, *Completed*.
  - Filter by type: *All Types*, *Store Catalog*, *Custom Sourcing*.
  - Live search by Request Code, customer name, phone number, or product name.
- **Admin Actions**:
  - **View Full Details**: Inspect full address, notes, stock snapshot at request time, and reference photos.
  - **Accept Request**: Opens a confirmation dialog allowing the admin to adjust or confirm final agreed quantity and price.
  - **Reject Request**: Records rejection reason and updates status.
  - **Mark Completed**: Marks fulfilled requests.
  - **Internal Admin Notes**: Private notes field saved directly to the database.
  - **Direct WhatsApp Customer**: One-click button opening WhatsApp with the customer's phone number and pre-filled message.
- **Guaranteed Business Rule**: Never automatically marks requests as paid.

---

## 🏗️ Database Architecture & SQL Schema

The database is built on PostgreSQL / Supabase with Row Level Security (RLS) enabled.

The SQL script is located at:
`supabase/migrations/20261110_create_customer_requests.sql`

### Tables

#### 1. `products`
```sql
CREATE TABLE public.products (
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
```

#### 2. `customer_requests`
```sql
CREATE TABLE public.customer_requests (
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
```

#### 3. `custom_product_requests`
```sql
CREATE TABLE public.custom_product_requests (
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
```

### Row Level Security (RLS) Policies
- **Anonymous Public Insert**: Allows public customers to submit product requests and custom product requests without an account.
- **Protected Select**: Public users cannot read customer phone numbers, addresses, or requests belonging to other people.
- **Admin Select & Update**: Only authenticated administrators (or service role) can view all requests and update status/notes.
- **Customer Status RPC (`track_customer_request`)**: Secure `SECURITY DEFINER` function allowing customers to check status by providing matching `request_code` AND `phone` without leaking private data.

---

## ⚙️ Setup & Deployment

### 1. Dual-Mode Flexibility
`pmart` comes with **Dual-Mode support**:
- **Offline / Local Demo Mode (Default)**: Runs immediately out of the box with an in-memory & local persistence engine. Pre-seeded with sample catalog items and requests so you can test all flows without cloud configuration.
- **Supabase Cloud Mode**: Seamlessly switches to Supabase when you provide credentials in `.env`.

### 2. Supabase Configuration (When connecting to live Supabase)
1. Open the [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** and run the contents of:
   `supabase/migrations/20261110_create_customer_requests.sql`
3. In **Storage**, create a public bucket named `request-images`.
4. Copy your **Project URL** and **Anon Key** into `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   > ⚠️ **Security Notice**: Never put your Supabase `service_role` secret key into frontend `.env` files. Only use the public `anon` key.

### 3. Local Development Commands

```bash
# Navigate to the project directory
cd "C:\Users\kalag\.gemini\antigravity\scratch\pmart"

# Install dependencies
npm install

# Run automated test suite
npm test

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🧪 Automated Test Suite

A complete Vitest test suite (`src/test/request_system.test.ts`) verifies all 15 core business rules:
- Format verification of generated Request IDs (`REQ-YYYYMM-XXXX`)
- Mandatory field validations (names, mobile number, delivery address)
- Positive integer quantity enforcement
- Custom product request descriptions and image validation (5MB max, JPEG/PNG/WEBP)
- Admin status updates with price and quantity adjustments
- WhatsApp URL generator with correct customer and order encoding
- Customer privacy verification during request tracking
- Stock non-deduction guarantee

