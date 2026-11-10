import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CustomerRequest, CustomProductRequest, Product, RequestSubmissionResult, RequestStatus } from '../types';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

// Environment variables for Supabase (Safe anonymous client only - Never expose service role key)
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

// Create real Supabase client if configured
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Store configuration
export const STORE_SETTINGS = {
  storeName: 'pmart',
  sellerWhatsAppNumber: '919876543210', // Configurable seller WhatsApp number (international format without +)
  currency: '₹',
  maxUploadSizeBytes: 5 * 1024 * 1024, // 5MB limit
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp']
};

// Generate human-friendly Unique Request ID: e.g. REQ-202611-8291
export function generateRequestCode(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `REQ-${year}${month}-${randomPart}`;
}

// Generate standard UUID v4
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Generate pre-filled WhatsApp link for customer inquiry
export function generateCustomerWhatsAppLink(requestCode: string, productName: string, customerName: string, quantity: number): string {
  const message = `Hello pmart Team, I have submitted a product request (ID: ${requestCode}) for "${productName}" (Quantity: ${quantity}). Customer Name: ${customerName}. Could you please confirm availability and next steps? Thank you!`;
  return `https://wa.me/${STORE_SETTINGS.sellerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
}

// Generate WhatsApp link for Admin to contact customer directly
export function generateAdminWhatsAppLink(phone: string, requestCode: string, customerName: string, productName: string, status: string): string {
  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const message = `Hello ${customerName}, this is pmart customer support regarding your product request #${requestCode} for "${productName}". Your current status is: ${status}. Let us know if you have any questions or wish to confirm!`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

// ----------------------------------------------------------------------------
// Local Storage / In-Memory Mock Database Engine
// Provides 100% offline functionality, immediate demonstration, and full persistence
// ----------------------------------------------------------------------------
const STORAGE_KEYS = {
  CUSTOMER_REQUESTS: 'pmart_customer_requests_v1',
  CUSTOM_PRODUCT_REQUESTS: 'pmart_custom_product_requests_v1',
  PRODUCTS: 'pmart_products_v1'
};

// Initial sample seed requests for immediate demonstration
const INITIAL_SAMPLE_REQUESTS: CustomerRequest[] = [
  {
    id: 'c1000001-0000-0000-0000-000000000001',
    request_code: 'REQ-202611-4019',
    customer_name: 'Priya Sharma',
    phone: '+91 98230 45678',
    product_id: 'a0000001-0000-0000-0000-000000000001',
    product_name: 'Smart Wireless Noise-Cancelling Headphones Pro',
    product_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    quantity: 2,
    unit_price: 4499,
    estimated_total: 8998,
    delivery_address: 'Flat 402, Sunshine Heights, MG Road, Bengaluru, Karnataka - 560001',
    customer_message: 'Please deliver on a weekend if possible.',
    status: 'PENDING',
    admin_notes: 'Customer inquired via WhatsApp about warranty coverage.',
    stock_at_request: 15,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'c1000002-0000-0000-0000-000000000002',
    request_code: 'REQ-202611-1892',
    customer_name: 'Rahul Varma',
    phone: '+91 97112 34567',
    product_id: 'a0000003-0000-0000-0000-000000000003',
    product_name: 'Stainless Steel Thermal Water Flask (1 Litre)',
    product_image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    quantity: 5, // Exceeded available stock of 2!
    unit_price: 899,
    estimated_total: 4495,
    delivery_address: 'House #12, Sector 14, Gurugram, Haryana - 122001',
    customer_message: 'Need 5 pieces for our office team gifts.',
    status: 'PENDING',
    admin_notes: 'Bulk inquiry exceeding current inventory (2 units). Supplier restock expected next Tuesday.',
    stock_at_request: 2,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'c1000003-0000-0000-0000-000000000003',
    request_code: 'REQ-202611-8841',
    customer_name: 'Ananya Deshmukh',
    phone: '+91 99887 65432',
    product_id: 'a0000002-0000-0000-0000-000000000002',
    product_name: 'Ultra-Thin Mechanical Gaming Keyboard RGB',
    product_image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    quantity: 1,
    unit_price: 3299,
    estimated_total: 3299,
    delivery_address: 'Plot 88, Jubilee Hills, Hyderabad, Telangana - 500033',
    customer_message: 'Blue or brown switches preferred if available.',
    status: 'ACCEPTED',
    admin_notes: 'Confirmed stock with red switches. Customer agreed to ₹3,199 special promotional price.',
    confirmed_quantity: 1,
    confirmed_price: 3199,
    stock_at_request: 8,
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const INITIAL_SAMPLE_CUSTOM_REQUESTS: CustomProductRequest[] = [
  {
    id: 'cp000001-0000-0000-0000-000000000001',
    request_code: 'REQ-202611-7390',
    customer_name: 'Karthik Raja',
    phone: '+91 98401 23456',
    requested_product_name: 'Custom Walnut Wood Mechanical Keyboard Wrist Rest',
    description: 'TKL 87-key size wrist rest made of solid natural American walnut wood with beveled ergonomic angle and non-slip rubber feet.',
    quantity: 3,
    expected_budget: 3500,
    delivery_address: 'No 45, Anna Nagar West, Chennai, Tamil Nadu - 600040',
    reference_image_url: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
    additional_requirements: 'Matte oil coating finish, no glossy varnish.',
    status: 'PENDING',
    admin_notes: 'Contacted artisan carpenter for quotation.',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Helper to get from storage or in-memory fallback
const inMemoryStore = new Map<string, any>();

function getStored<T>(key: string, defaultValue: T): T {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  if (!inMemoryStore.has(key)) {
    inMemoryStore.set(key, JSON.parse(JSON.stringify(defaultValue)));
  }
  return inMemoryStore.get(key);
}

function setStored<T>(key: string, value: T): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore
  }
  inMemoryStore.set(key, JSON.parse(JSON.stringify(value)));
}

// ----------------------------------------------------------------------------
// Unified Data API (Supports both Supabase & Local DB transparently)
// ----------------------------------------------------------------------------

export async function fetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (!error && data && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          description: p.description || '',
          price: Number(p.price),
          stock: Number(p.stock),
          imageUrl: p.image_url || '',
          rating: 4.8
        }));
      }
    } catch (e) {
      console.warn('Supabase fetch products error, falling back to local catalog:', e);
    }
  }

  return getStored<Product[]>(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
}

export async function createProduct(payload: {
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  tags?: string[];
}): Promise<{ success: boolean; product?: Product; error?: string }> {
  if (!payload.name || payload.name.trim().length < 2) {
    return { success: false, error: 'Product name is required.' };
  }
  if (!payload.category || payload.category.trim().length < 2) {
    return { success: false, error: 'Category is required.' };
  }
  if (isNaN(payload.price) || payload.price < 0) {
    return { success: false, error: 'Price must be a valid positive number.' };
  }
  if (!Number.isInteger(payload.stock) || payload.stock < 0) {
    return { success: false, error: 'Stock must be a non-negative integer.' };
  }

  const id = generateUUID();
  const newProduct: Product = {
    id,
    name: payload.name.trim(),
    category: payload.category.trim(),
    description: payload.description.trim(),
    price: payload.price,
    stock: payload.stock,
    imageUrl: payload.imageUrl?.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
    rating: 5.0,
    tags: payload.tags && payload.tags.length > 0 ? payload.tags : ['New Arrival']
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('products').insert([
        {
          id: newProduct.id,
          name: newProduct.name,
          category: newProduct.category,
          description: newProduct.description,
          price: newProduct.price,
          stock: newProduct.stock,
          image_url: newProduct.imageUrl,
          is_active: true
        }
      ]);
      if (!error) {
        return { success: true, product: newProduct };
      }
    } catch (e) {
      console.warn('Supabase product insert error, falling back to local DB:', e);
    }
  }

  const list = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, SAMPLE_PRODUCTS);
  list.unshift(newProduct);
  setStored(STORAGE_KEYS.PRODUCTS, list);

  return { success: true, product: newProduct };
}

export async function submitProductRequest(payload: {
  customer_name: string;
  phone: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  estimated_total: number;
  delivery_address: string;
  customer_message?: string;
  stock_at_request?: number;
}): Promise<RequestSubmissionResult> {
  // Validate Fields Server/Client Side
  if (!payload.customer_name || payload.customer_name.trim().length < 2) {
    return { success: false, error: 'Customer name is required (minimum 2 characters).' };
  }
  if (!payload.phone || payload.phone.trim().length < 7) {
    return { success: false, error: 'A valid mobile number is required.' };
  }
  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    return { success: false, error: 'Requested quantity must be a positive integer.' };
  }
  if (!payload.delivery_address || payload.delivery_address.trim().length < 5) {
    return { success: false, error: 'Delivery address is required (minimum 5 characters).' };
  }

  const requestCode = generateRequestCode();
  const id = generateUUID();
  const now = new Date().toISOString();

  const newRequest: CustomerRequest = {
    id,
    request_code: requestCode,
    customer_name: payload.customer_name.trim(),
    phone: payload.phone.trim(),
    product_id: payload.product_id,
    product_name: payload.product_name,
    product_image: payload.product_image,
    quantity: Math.floor(payload.quantity),
    unit_price: payload.unit_price,
    estimated_total: payload.unit_price * Math.floor(payload.quantity),
    delivery_address: payload.delivery_address.trim(),
    customer_message: payload.customer_message?.trim() || '',
    status: 'PENDING',
    stock_at_request: payload.stock_at_request ?? 0,
    created_at: now,
    updated_at: now
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('customer_requests').insert([
        {
          id: newRequest.id,
          request_code: newRequest.request_code,
          customer_name: newRequest.customer_name,
          phone: newRequest.phone,
          product_id: newRequest.product_id,
          product_name: newRequest.product_name,
          product_image: newRequest.product_image,
          quantity: newRequest.quantity,
          unit_price: newRequest.unit_price,
          estimated_total: newRequest.estimated_total,
          delivery_address: newRequest.delivery_address,
          customer_message: newRequest.customer_message,
          status: 'PENDING',
          stock_at_request: newRequest.stock_at_request
        }
      ]);

      if (error) {
        console.error('Supabase insert customer_request error:', error);
        // Fall back to local storage if network or RLS permission issue occurs
      } else {
        return { success: true, request_id: newRequest.id, request_code: newRequest.request_code };
      }
    } catch (err) {
      console.warn('Supabase request submission error, falling back to local DB:', err);
    }
  }

  // Local persistence fallback
  const requests = getStored<CustomerRequest[]>(STORAGE_KEYS.CUSTOMER_REQUESTS, INITIAL_SAMPLE_REQUESTS);
  requests.unshift(newRequest);
  setStored(STORAGE_KEYS.CUSTOMER_REQUESTS, requests);

  return {
    success: true,
    request_id: newRequest.id,
    request_code: newRequest.request_code
  };
}

export async function submitCustomProductRequest(payload: {
  customer_name: string;
  phone: string;
  requested_product_name: string;
  description: string;
  quantity: number;
  expected_budget?: number | null;
  delivery_address: string;
  reference_image_url?: string | null;
  additional_requirements?: string;
}): Promise<RequestSubmissionResult> {
  // Validate Fields
  if (!payload.customer_name || payload.customer_name.trim().length < 2) {
    return { success: false, error: 'Customer name is required.' };
  }
  if (!payload.phone || payload.phone.trim().length < 7) {
    return { success: false, error: 'A valid mobile number is required.' };
  }
  if (!payload.requested_product_name || payload.requested_product_name.trim().length < 2) {
    return { success: false, error: 'Product name is required.' };
  }
  if (!payload.description || payload.description.trim().length < 5) {
    return { success: false, error: 'Product description is required (min 5 characters).' };
  }
  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) {
    return { success: false, error: 'Desired quantity must be a positive integer.' };
  }
  if (!payload.delivery_address || payload.delivery_address.trim().length < 5) {
    return { success: false, error: 'Delivery address is required.' };
  }

  const requestCode = generateRequestCode();
  const id = generateUUID();
  const now = new Date().toISOString();

  const newRequest: CustomProductRequest = {
    id,
    request_code: requestCode,
    customer_name: payload.customer_name.trim(),
    phone: payload.phone.trim(),
    requested_product_name: payload.requested_product_name.trim(),
    description: payload.description.trim(),
    quantity: Math.floor(payload.quantity),
    expected_budget: payload.expected_budget ? Number(payload.expected_budget) : null,
    delivery_address: payload.delivery_address.trim(),
    reference_image_url: payload.reference_image_url || null,
    additional_requirements: payload.additional_requirements?.trim() || '',
    status: 'PENDING',
    created_at: now,
    updated_at: now
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('custom_product_requests').insert([
        {
          id: newRequest.id,
          request_code: newRequest.request_code,
          customer_name: newRequest.customer_name,
          phone: newRequest.phone,
          requested_product_name: newRequest.requested_product_name,
          description: newRequest.description,
          quantity: newRequest.quantity,
          expected_budget: newRequest.expected_budget,
          delivery_address: newRequest.delivery_address,
          reference_image_url: newRequest.reference_image_url,
          additional_requirements: newRequest.additional_requirements,
          status: 'PENDING'
        }
      ]);

      if (error) {
        console.error('Supabase custom_product_requests error:', error);
      } else {
        return { success: true, request_id: newRequest.id, request_code: newRequest.request_code, isCustom: true };
      }
    } catch (err) {
      console.warn('Supabase custom request error, using local DB:', err);
    }
  }

  // Local persistence fallback
  const customRequests = getStored<CustomProductRequest[]>(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, INITIAL_SAMPLE_CUSTOM_REQUESTS);
  customRequests.unshift(newRequest);
  setStored(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, customRequests);

  return {
    success: true,
    request_id: newRequest.id,
    request_code: newRequest.request_code,
    isCustom: true
  };
}

// Admin: Get all requests
export async function getAllAdminRequests(): Promise<{
  standardRequests: CustomerRequest[];
  customRequests: CustomProductRequest[];
}> {
  if (isSupabaseConfigured && supabase) {
    try {
      const [resStd, resCust] = await Promise.all([
        supabase.from('customer_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('custom_product_requests').select('*').order('created_at', { ascending: false })
      ]);

      if (!resStd.error && !resCust.error && (resStd.data || resCust.data)) {
        return {
          standardRequests: resStd.data || [],
          customRequests: resCust.data || []
        };
      }
    } catch (e) {
      console.warn('Supabase admin fetch error, using local data:', e);
    }
  }

  return {
    standardRequests: getStored<CustomerRequest[]>(STORAGE_KEYS.CUSTOMER_REQUESTS, INITIAL_SAMPLE_REQUESTS),
    customRequests: getStored<CustomProductRequest[]>(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, INITIAL_SAMPLE_CUSTOM_REQUESTS)
  };
}

// Admin: Update status & details
export async function updateRequestStatus(
  isCustom: boolean,
  id: string,
  updates: {
    status: RequestStatus;
    admin_notes?: string;
    confirmed_quantity?: number;
    confirmed_price?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const table = isCustom ? 'custom_product_requests' : 'customer_requests';
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from(table)
        .update({
          ...updates,
          updated_at: now
        })
        .eq('id', id);

      if (!error) {
        return { success: true };
      }
    } catch (e) {
      console.warn('Supabase update error, falling back to local DB:', e);
    }
  }

  // Local storage update
  if (isCustom) {
    const list = getStored<CustomProductRequest[]>(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, INITIAL_SAMPLE_CUSTOM_REQUESTS);
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updated_at: now
      };
      setStored(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, list);
      return { success: true };
    }
  } else {
    const list = getStored<CustomerRequest[]>(STORAGE_KEYS.CUSTOMER_REQUESTS, INITIAL_SAMPLE_REQUESTS);
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        ...updates,
        updated_at: now
      };
      setStored(STORAGE_KEYS.CUSTOMER_REQUESTS, list);
      return { success: true };
    }
  }

  return { success: false, error: 'Request not found' };
}

// Customer Self-Tracking: Matches request code and mobile number
export async function trackCustomerRequest(
  requestCode: string,
  phone: string
): Promise<{
  found: boolean;
  request?: {
    request_code: string;
    product_name: string;
    quantity: number;
    status: RequestStatus;
    created_at: string;
    confirmed_quantity?: number;
    confirmed_price?: number;
    estimated_total?: number;
    isCustom?: boolean;
    admin_notes?: string;
  };
  error?: string;
}> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const code = requestCode.trim().toUpperCase();

  // If using Supabase RPC or Direct match
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('track_customer_request', {
        p_code: code,
        p_phone: phone.trim()
      });
      if (!error && data && data.length > 0) {
        const item = data[0];
        return {
          found: true,
          request: {
            request_code: item.request_code,
            product_name: item.product_name,
            quantity: item.quantity,
            status: item.status,
            created_at: item.created_at,
            confirmed_quantity: item.confirmed_quantity,
            confirmed_price: item.confirmed_price
          }
        };
      }
    } catch (err) {
      console.warn('Supabase RPC tracking error, trying local check:', err);
    }
  }

  // Local storage lookup
  const std = getStored<CustomerRequest[]>(STORAGE_KEYS.CUSTOMER_REQUESTS, INITIAL_SAMPLE_REQUESTS);
  const matchStd = std.find(r => 
    r.request_code.toUpperCase() === code && 
    r.phone.replace(/[^0-9]/g, '').includes(cleanPhone)
  );

  if (matchStd) {
    return {
      found: true,
      request: {
        request_code: matchStd.request_code,
        product_name: matchStd.product_name,
        quantity: matchStd.quantity,
        status: matchStd.status,
        created_at: matchStd.created_at,
        confirmed_quantity: matchStd.confirmed_quantity,
        confirmed_price: matchStd.confirmed_price,
        estimated_total: matchStd.estimated_total,
        isCustom: false,
        admin_notes: matchStd.status !== 'PENDING' ? matchStd.admin_notes : undefined
      }
    };
  }

  const custom = getStored<CustomProductRequest[]>(STORAGE_KEYS.CUSTOM_PRODUCT_REQUESTS, INITIAL_SAMPLE_CUSTOM_REQUESTS);
  const matchCustom = custom.find(r => 
    r.request_code.toUpperCase() === code && 
    r.phone.replace(/[^0-9]/g, '').includes(cleanPhone)
  );

  if (matchCustom) {
    return {
      found: true,
      request: {
        request_code: matchCustom.request_code,
        product_name: matchCustom.requested_product_name,
        quantity: matchCustom.quantity,
        status: matchCustom.status,
        created_at: matchCustom.created_at,
        confirmed_quantity: matchCustom.confirmed_quantity,
        confirmed_price: matchCustom.confirmed_price,
        isCustom: true,
        admin_notes: matchCustom.status !== 'PENDING' ? matchCustom.admin_notes : undefined
      }
    };
  }

  return { found: false, error: 'No matching request found for this Request ID and Phone Number combination.' };
}

// Upload reference image with validation (Max 5MB, JPG/PNG/WEBP only)
export async function uploadReferenceImage(file: File): Promise<{ url: string | null; error?: string }> {
  // Validate File Size (5MB limit)
  if (file.size > STORE_SETTINGS.maxUploadSizeBytes) {
    return { url: null, error: 'File size exceeds maximum allowed limit of 5MB.' };
  }

  // Validate File Type
  if (!STORE_SETTINGS.allowedImageTypes.includes(file.type)) {
    return { url: null, error: 'Invalid file format. Please upload JPG, PNG, or WEBP images only.' };
  }

  // Try Supabase Storage if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `custom-requests/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('request-images')
        .upload(filePath, file);

      if (!uploadError) {
        const { data } = supabase.storage.from('request-images').getPublicUrl(filePath);
        return { url: data.publicUrl };
      }
    } catch (e) {
      console.warn('Supabase storage upload failed, converting to local preview URL:', e);
    }
  }

  // Local fallback: read file as Base64 Data URL for standalone offline operation
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ url: reader.result as string });
    };
    reader.onerror = () => {
      resolve({ url: null, error: 'Failed to read image file.' });
    };
    reader.readAsDataURL(file);
  });
}
