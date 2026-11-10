import React, { useState, useEffect } from 'react';
import { Product, RequestSubmissionResult } from '../types';
import { STORE_SETTINGS, submitProductRequest } from '../lib/supabase';
import { X, Send, AlertTriangle, Info, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ProductRequestModalProps {
  product: Product | null;
  onClose: () => void;
  onSuccess: (result: RequestSubmissionResult, details: {
    productName: string;
    customerName: string;
    quantity: number;
    estimatedTotal: number;
    deliveryAddress: string;
  }) => void;
}

export const ProductRequestModal: React.FC<ProductRequestModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  if (!product) return null;

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');

  // UI / Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Calculate live estimated total
  const estimatedTotal = (Number(quantity) || 0) * product.price;

  // Check if requested quantity exceeds current inventory
  const exceedsStock = (Number(quantity) || 0) > product.stock;

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Please enter your full name (minimum 2 characters).';
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      newErrors.phone = 'Please enter a valid mobile number with area/country code.';
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      newErrors.quantity = 'Quantity must be a positive whole number (at least 1).';
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      newErrors.deliveryAddress = 'Please provide a complete delivery address (street, city, pin code).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent accidental double clicks
    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitProductRequest({
        customer_name: customerName,
        phone: phone,
        product_id: product.id,
        product_name: product.name,
        product_image: product.imageUrl,
        quantity: Math.floor(Number(quantity)),
        unit_price: product.price,
        estimated_total: estimatedTotal,
        delivery_address: deliveryAddress,
        customer_message: customerMessage,
        stock_at_request: product.stock
      });

      if (result.success) {
        onSuccess(result, {
          productName: product.name,
          customerName: customerName.trim(),
          quantity: Math.floor(Number(quantity)),
          estimatedTotal,
          deliveryAddress: deliveryAddress.trim()
        });
      } else {
        setSubmitError(result.error || 'Failed to submit request. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Customer Product Request</h3>
              <p className="text-xs text-slate-500">Submit an inquiry directly without prepayment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Product Summary Card */}
        <div className="p-4 sm:p-6 bg-blue-50/40 border-b border-blue-100/70">
          <div className="flex gap-4 items-center">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-2xl border border-blue-200 shadow-sm flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-mono text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md inline-block mb-1">
                Product ID: #{product.id.slice(0, 8)}
              </span>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate" title={product.name}>
                {product.name}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-600">
                <span>
                  Unit Price:{' '}
                  <strong className="text-slate-900 font-bold">
                    {STORE_SETTINGS.currency}{product.price.toLocaleString()}
                  </strong>
                </span>
                <span>
                  Current Stock:{' '}
                  <strong className={`font-bold ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {product.stock} units
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Request Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Customer Name & Phone */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. Johnathan Doe"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors({ ...errors, customerName: '' });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                  errors.customerName
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.customerName && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                disabled={isSubmitting}
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors({ ...errors, phone: '' });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                  errors.phone
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.phone && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Requested Quantity & Live Total Calculation */}
          <div className="grid sm:grid-cols-2 gap-4 items-center p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Requested Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting || quantity <= 1}
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center transition disabled:opacity-40"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  disabled={isSubmitting}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(val);
                    if (errors.quantity) setErrors({ ...errors, quantity: '' });
                  }}
                  className={`w-24 text-center px-3 py-2 rounded-xl border font-bold text-base transition outline-none ${
                    errors.quantity
                      ? 'border-rose-400 bg-rose-50 focus:border-rose-500'
                      : 'border-slate-300 focus:border-blue-500 bg-white'
                  }`}
                />
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center transition"
                >
                  +
                </button>
              </div>
              {errors.quantity && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.quantity}</p>
              )}
            </div>

            {/* Live Estimated Total Display */}
            <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
              <span className="text-xs text-slate-500 font-medium block">
                Estimated Total ({quantity} × {STORE_SETTINGS.currency}{product.price.toLocaleString()})
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {STORE_SETTINGS.currency}{estimatedTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                (Final price subject to seller confirmation)
              </span>
            </div>
          </div>

          {/* Stock Excess Alert Notification */}
          {exceedsStock && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block">Availability Notice</strong>
                <span>
                  You requested <strong>{quantity} units</strong>, which exceeds our currently available stock of <strong>{product.stock} units</strong>. You can still submit this request, but our team will need to confirm procurement timelines before acceptance.
                </span>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Delivery Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              disabled={isSubmitting}
              placeholder="Flat/House No, Building, Street, City, State, PIN Code"
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                if (errors.deliveryAddress) setErrors({ ...errors, deliveryAddress: '' });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none resize-none ${
                errors.deliveryAddress
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-4 focus:ring-rose-100'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
            />
            {errors.deliveryAddress && (
              <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.deliveryAddress}</p>
            )}
          </div>

          {/* Additional Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Instructions / Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Specific color preference, preferred delivery slot, urgent requirement"
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm transition outline-none"
            />
          </div>

          {/* Business Rules Transparency Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-blue-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Transparent Policy:</strong> This request is an order inquiry and does <em>not</em> automatically charge your card or debit your account. Inventory will not be reduced until our seller reviews and confirms your order.
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

