import { Product } from '../types';

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'a0000001-0000-0000-0000-000000000001',
    name: 'Smart Wireless Noise-Cancelling Headphones Pro',
    category: 'Electronics',
    description: 'Ultra-crisp 40mm acoustic drivers with hybrid active noise cancellation, 35-hour battery life, multi-device Bluetooth 5.3, and ergonomic memory foam earcups.',
    price: 4499,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    rating: 4.8,
    tags: ['Best Seller', 'ANC', 'Wireless']
  },
  {
    id: 'a0000002-0000-0000-0000-000000000002',
    name: 'Ultra-Thin Mechanical Gaming Keyboard RGB',
    category: 'Computers',
    description: 'Custom linear red switches with ultra-responsive 1ms actuation, per-key RGB backlighting, aircraft-grade aluminum top plate, and detachable braided USB-C cable.',
    price: 3299,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    tags: ['Mechanical', 'RGB', 'Gaming']
  },
  {
    id: 'a0000003-0000-0000-0000-000000000003',
    name: 'Stainless Steel Thermal Water Flask (1 Litre)',
    category: 'Home & Living',
    description: 'Double-wall vacuum insulation keeps beverages cold for 24 hours or piping hot for 12 hours. Sweat-proof matte powder finish with wide-mouth leakproof lid.',
    price: 899,
    stock: 2, // Low stock: excellent for testing stock excess warning
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    tags: ['Eco-friendly', 'Insulated', 'Low Stock']
  },
  {
    id: 'a0000004-0000-0000-0000-000000000004',
    name: '4K Ultra-HD Action Camera with Waterproof Gimbal',
    category: 'Cameras',
    description: 'Native 4K 60FPS video recording with 6-axis electronic image stabilization, dual color touchscreens, voice control, and 40m waterproof housing included.',
    price: 7999,
    stock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80',
    rating: 4.6,
    tags: ['4K Video', 'Waterproof']
  },
  {
    id: 'a0000005-0000-0000-0000-000000000005',
    name: 'Ergonomic Breathable Mesh Executive Chair',
    category: 'Office & Furniture',
    description: 'Engineered for all-day comfort with dynamic lumbar support, 3D adjustable armrests, recline lock up to 135°, and breathable Korean mesh backrest.',
    price: 8499,
    stock: 0, // Out of stock: tests customer product request when inventory is zero!
    imageUrl: 'https://images.unsplash.com/photo-1580481077195-c3a821a58875?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    tags: ['Ergonomic', 'Work From Home', 'Out of Stock']
  },
  {
    id: 'a0000006-0000-0000-0000-000000000006',
    name: 'Organic Arabica Dark Roast Artisan Coffee Beans (500g)',
    category: 'Food & Grocery',
    description: 'Single-origin highland Arabica beans slow-roasted in small batches. Rich chocolate and roasted hazelnut flavor profile with balanced acidity.',
    price: 650,
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
    rating: 4.9,
    tags: ['Organic', 'Single Origin']
  },
  {
    id: 'a0000007-0000-0000-0000-000000000007',
    name: 'Fast Wireless Magnetic Charging Stand 3-in-1',
    category: 'Electronics',
    description: 'Simultaneously fast-charge your phone, smartwatch, and earbuds with sleek weighted aluminum base and intelligent temperature safety management.',
    price: 2199,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80',
    rating: 4.5,
    tags: ['3-in-1', 'Fast Charge']
  },
  {
    id: 'a0000008-0000-0000-0000-000000000008',
    name: 'Minimalist Water-Resistant Everyday Backpack (22L)',
    category: 'Fashion & Bags',
    description: 'Weatherproof recycled nylon fabric with dedicated 16-inch padded laptop sleeve, hidden anti-theft passport pocket, and luggage pass-through strap.',
    price: 1899,
    stock: 9,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    rating: 4.7,
    tags: ['Waterproof', 'Travel', 'Laptop']
  }
];

