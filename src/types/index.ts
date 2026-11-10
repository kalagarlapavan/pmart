export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl: string;
  rating?: number;
  tags?: string[];
}

export interface CustomerRequest {
  id: string;
  request_code: string;
  customer_name: string;
  phone: string;
  product_id: string | null;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  estimated_total: number;
  delivery_address: string;
  customer_message?: string;
  status: RequestStatus;
  admin_notes?: string;
  confirmed_quantity?: number;
  confirmed_price?: number;
  stock_at_request?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomProductRequest {
  id: string;
  request_code: string;
  customer_name: string;
  phone: string;
  requested_product_name: string;
  description: string;
  quantity: number;
  expected_budget?: number | null;
  delivery_address: string;
  reference_image_url?: string | null;
  additional_requirements?: string;
  status: RequestStatus;
  admin_notes?: string;
  confirmed_quantity?: number;
  confirmed_price?: number;
  created_at: string;
  updated_at?: string;
}

export interface RequestSubmissionResult {
  success: boolean;
  request_id?: string;
  request_code?: string;
  error?: string;
  isCustom?: boolean;
}

