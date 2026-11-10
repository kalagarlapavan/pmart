import { describe, it, expect, beforeEach } from 'vitest';
import { 
  generateRequestCode, 
  generateCustomerWhatsAppLink, 
  generateAdminWhatsAppLink, 
  submitProductRequest, 
  submitCustomProductRequest, 
  getAllAdminRequests, 
  updateRequestStatus, 
  trackCustomerRequest,
  uploadReferenceImage,
  STORE_SETTINGS 
} from '../lib/supabase';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

describe('pmart Customer Product Request & Order Management System', () => {

  beforeEach(() => {
    // Clear localStorage for consistent test runs
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Request ID Generation', () => {
    it('should generate a unique, human-friendly request code following REQ-YYYYMM-XXXX format', () => {
      const code1 = generateRequestCode();
      const code2 = generateRequestCode();

      expect(code1).toMatch(/^REQ-\d{6}-\d{4}$/);
      expect(code2).toMatch(/^REQ-\d{6}-\d{4}$/);
      expect(code1).not.toBe(code2);
    });
  });

  describe('2. Field Validation & Submission for Catalog Product Requests', () => {
    const validProduct = SAMPLE_PRODUCTS[0];

    it('should reject request when customer name is missing or too short', async () => {
      const result = await submitProductRequest({
        customer_name: ' ',
        phone: '+919876543210',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 1,
        unit_price: validProduct.price,
        estimated_total: validProduct.price,
        delivery_address: '123 Test Street, Bengaluru, Karnataka'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Customer name is required');
    });

    it('should reject request when phone number is invalid or too short', async () => {
      const result = await submitProductRequest({
        customer_name: 'Johnathan Doe',
        phone: '123',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 1,
        unit_price: validProduct.price,
        estimated_total: validProduct.price,
        delivery_address: '123 Test Street, Bengaluru, Karnataka'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('valid mobile number');
    });

    it('should reject non-positive or non-integer requested quantity', async () => {
      const zeroQtyResult = await submitProductRequest({
        customer_name: 'Johnathan Doe',
        phone: '+919876543210',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 0,
        unit_price: validProduct.price,
        estimated_total: 0,
        delivery_address: '123 Test Street, Bengaluru, Karnataka'
      });
      expect(zeroQtyResult.success).toBe(false);

      const negativeQtyResult = await submitProductRequest({
        customer_name: 'Johnathan Doe',
        phone: '+919876543210',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: -3,
        unit_price: validProduct.price,
        estimated_total: 0,
        delivery_address: '123 Test Street, Bengaluru, Karnataka'
      });
      expect(negativeQtyResult.success).toBe(false);

      const decimalQtyResult = await submitProductRequest({
        customer_name: 'Johnathan Doe',
        phone: '+919876543210',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 2.5,
        unit_price: validProduct.price,
        estimated_total: validProduct.price * 2.5,
        delivery_address: '123 Test Street, Bengaluru, Karnataka'
      });
      expect(decimalQtyResult.success).toBe(false);
    });

    it('should reject request with incomplete delivery address', async () => {
      const result = await submitProductRequest({
        customer_name: 'Johnathan Doe',
        phone: '+919876543210',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 2,
        unit_price: validProduct.price,
        estimated_total: validProduct.price * 2,
        delivery_address: 'ABC'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Delivery address is required');
    });

    it('should successfully submit valid catalog request with initial status PENDING', async () => {
      const result = await submitProductRequest({
        customer_name: 'Vikram Seth',
        phone: '+91 9988776655',
        product_id: validProduct.id,
        product_name: validProduct.name,
        quantity: 3,
        unit_price: validProduct.price,
        estimated_total: validProduct.price * 3,
        delivery_address: '404 Tech Park, Sector 5, Kolkata, West Bengal - 700091',
        customer_message: 'Please deliver during business hours',
        stock_at_request: validProduct.stock
      });

      expect(result.success).toBe(true);
      expect(result.request_code).toMatch(/^REQ-\d{6}-\d{4}$/);
      expect(result.request_id).toBeDefined();

      // Verify request is saved in DB and readable by Admin
      const adminData = await getAllAdminRequests();
      const saved = adminData.standardRequests.find(r => r.request_code === result.request_code);
      expect(saved).toBeDefined();
      expect(saved?.customer_name).toBe('Vikram Seth');
      expect(saved?.quantity).toBe(3);
      expect(saved?.status).toBe('PENDING');
      expect(saved?.estimated_total).toBe(validProduct.price * 3);
    });
  });

  describe('3. Custom Product Requests (Unlisted Products)', () => {
    it('should validate required fields for custom sourcing requests', async () => {
      const missingName = await submitCustomProductRequest({
        customer_name: '',
        phone: '+919876543210',
        requested_product_name: 'Vintage Mechanical Clock',
        description: 'Antique brass table clock with Roman numerals',
        quantity: 1,
        delivery_address: '123 Main Street'
      });
      expect(missingName.success).toBe(false);

      const missingProduct = await submitCustomProductRequest({
        customer_name: 'Amitabh Kumar',
        phone: '+919876543210',
        requested_product_name: '',
        description: 'Antique brass table clock with Roman numerals',
        quantity: 1,
        delivery_address: '123 Main Street'
      });
      expect(missingProduct.success).toBe(false);

      const missingDesc = await submitCustomProductRequest({
        customer_name: 'Amitabh Kumar',
        phone: '+919876543210',
        requested_product_name: 'Vintage Mechanical Clock',
        description: 'Tiny',
        quantity: 1,
        delivery_address: '123 Main Street'
      });
      expect(missingDesc.success).toBe(false);
    });

    it('should successfully submit valid custom product request', async () => {
      const result = await submitCustomProductRequest({
        customer_name: 'Radhika Nair',
        phone: '+91 94441 23456',
        requested_product_name: 'Ergonomic Vertical Mouse Left-Handed',
        description: 'Wireless Bluetooth ergonomic vertical mouse with silent clicks and USB-C rechargeable battery for left-handed grip.',
        quantity: 2,
        expected_budget: 1800,
        delivery_address: 'Flat 102, Ocean Vista, Marine Drive, Kochi, Kerala - 682001',
        additional_requirements: 'Black or dark grey color'
      });

      expect(result.success).toBe(true);
      expect(result.isCustom).toBe(true);
      expect(result.request_code).toMatch(/^REQ-\d{6}-\d{4}$/);

      // Verify custom request table
      const adminData = await getAllAdminRequests();
      const savedCustom = adminData.customRequests.find(r => r.request_code === result.request_code);
      expect(savedCustom).toBeDefined();
      expect(savedCustom?.requested_product_name).toBe('Ergonomic Vertical Mouse Left-Handed');
      expect(savedCustom?.expected_budget).toBe(1800);
      expect(savedCustom?.status).toBe('PENDING');
    });

    it('should reject reference images exceeding size limit or invalid format', async () => {
      // Mock File larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'huge.jpg', { type: 'image/jpeg' });
      const sizeResult = await uploadReferenceImage(largeFile);
      expect(sizeResult.url).toBeNull();
      expect(sizeResult.error).toContain('5MB');

      // Mock File with invalid format (e.g. PDF or executable)
      const pdfFile = new File(['fake content'], 'doc.pdf', { type: 'application/pdf' });
      const formatResult = await uploadReferenceImage(pdfFile);
      expect(formatResult.url).toBeNull();
      expect(formatResult.error).toContain('Invalid file format');
    });
  });

  describe('4. Admin Dashboard Actions & Status Transitions', () => {
    it('should allow admin to accept a request and optionally adjust final confirmed price and quantity', async () => {
      // 1. Submit request
      const submission = await submitProductRequest({
        customer_name: 'Kavita Menon',
        phone: '+91 98111 22334',
        product_id: SAMPLE_PRODUCTS[1].id,
        product_name: SAMPLE_PRODUCTS[1].name,
        quantity: 2,
        unit_price: SAMPLE_PRODUCTS[1].price,
        estimated_total: SAMPLE_PRODUCTS[1].price * 2,
        delivery_address: 'Suite 210, Tech Boulevard, Pune, Maharashtra'
      });
      expect(submission.success).toBe(true);

      // 2. Admin accepts request with confirmed price discount
      const updateResult = await updateRequestStatus(false, submission.request_id!, {
        status: 'ACCEPTED',
        confirmed_quantity: 2,
        confirmed_price: 3100, // discounted from 3299
        admin_notes: 'Offered corporate volume discount of ₹199 per unit.'
      });
      expect(updateResult.success).toBe(true);

      // 3. Verify updated details
      const adminData = await getAllAdminRequests();
      const updated = adminData.standardRequests.find(r => r.id === submission.request_id);
      expect(updated?.status).toBe('ACCEPTED');
      expect(updated?.confirmed_quantity).toBe(2);
      expect(updated?.confirmed_price).toBe(3100);
      expect(updated?.admin_notes).toContain('corporate volume discount');
    });

    it('should allow admin to reject or mark request as completed', async () => {
      const submission = await submitProductRequest({
        customer_name: 'Deepak Chopra',
        phone: '+91 97777 88888',
        product_id: SAMPLE_PRODUCTS[2].id,
        product_name: SAMPLE_PRODUCTS[2].name,
        quantity: 1,
        unit_price: SAMPLE_PRODUCTS[2].price,
        estimated_total: SAMPLE_PRODUCTS[2].price,
        delivery_address: '77 Heritage Lane, Jaipur, Rajasthan'
      });

      // Reject
      await updateRequestStatus(false, submission.request_id!, {
        status: 'REJECTED',
        admin_notes: 'Product discontinued by manufacturer.'
      });

      let adminData = await getAllAdminRequests();
      let item = adminData.standardRequests.find(r => r.id === submission.request_id);
      expect(item?.status).toBe('REJECTED');

      // Complete
      await updateRequestStatus(false, submission.request_id!, {
        status: 'COMPLETED',
        admin_notes: 'Order delivered and verified.'
      });

      adminData = await getAllAdminRequests();
      item = adminData.standardRequests.find(r => r.id === submission.request_id);
      expect(item?.status).toBe('COMPLETED');
    });
  });

  describe('5. WhatsApp Direct Links Generation', () => {
    it('should generate pre-filled WhatsApp link for customer inquiry', () => {
      const link = generateCustomerWhatsAppLink('REQ-202611-9842', 'Mechanical Keyboard RGB', 'Priya', 2);
      expect(link).toContain(`https://wa.me/${STORE_SETTINGS.sellerWhatsAppNumber}?text=`);
      expect(link).toContain(encodeURIComponent('REQ-202611-9842'));
      expect(link).toContain(encodeURIComponent('Mechanical Keyboard RGB'));
      expect(link).toContain(encodeURIComponent('Priya'));
    });

    it('should generate WhatsApp link for admin to contact customer', () => {
      const customerPhone = '+91 98230-45678';
      const link = generateAdminWhatsAppLink(customerPhone, 'REQ-202611-9842', 'Priya', 'Mechanical Keyboard', 'ACCEPTED');
      expect(link).toContain('https://wa.me/919823045678?text=');
      expect(link).toContain(encodeURIComponent('Priya'));
      expect(link).toContain(encodeURIComponent('REQ-202611-9842'));
      expect(link).toContain(encodeURIComponent('ACCEPTED'));
    });
  });

  describe('6. Customer Self-Tracking Verification (Privacy Guard)', () => {
    it('should allow customer to track status with matching code AND phone', async () => {
      const submission = await submitProductRequest({
        customer_name: 'Meera Nambiar',
        phone: '+91 98989 12345',
        product_id: SAMPLE_PRODUCTS[0].id,
        product_name: SAMPLE_PRODUCTS[0].name,
        quantity: 1,
        unit_price: SAMPLE_PRODUCTS[0].price,
        estimated_total: SAMPLE_PRODUCTS[0].price,
        delivery_address: 'Plot 12, Indiranagar, Bengaluru'
      });

      // Positive lookup with correct phone
      const tracking = await trackCustomerRequest(submission.request_code!, '+91 98989 12345');
      expect(tracking.found).toBe(true);
      expect(tracking.request?.request_code).toBe(submission.request_code);
      expect(tracking.request?.status).toBe('PENDING');

      // Negative lookup with mismatched phone (protects customer privacy!)
      const wrongPhoneTracking = await trackCustomerRequest(submission.request_code!, '+91 11111 22222');
      expect(wrongPhoneTracking.found).toBe(false);
    });
  });

  describe('7. Business Rules Enforcement', () => {
    it('ensures requests do not automatically deduct catalog stock', async () => {
      const product = SAMPLE_PRODUCTS[0];
      const initialStock = product.stock;

      // Submit request for 5 units
      await submitProductRequest({
        customer_name: 'Test Buyer',
        phone: '+919999900000',
        product_id: product.id,
        product_name: product.name,
        quantity: 5,
        unit_price: product.price,
        estimated_total: product.price * 5,
        delivery_address: 'Test Street, New Delhi',
        stock_at_request: initialStock
      });

      // Product stock remains untouched!
      const currentProducts = await (await import('../lib/supabase')).fetchProducts();
      const p = currentProducts.find(item => item.id === product.id);
      expect(p?.stock).toBe(initialStock);
    });
  });

});

