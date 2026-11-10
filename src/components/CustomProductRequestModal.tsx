import React, { useState, useRef } from 'react';
import { RequestSubmissionResult } from '../types';
import { STORE_SETTINGS, submitCustomProductRequest, uploadReferenceImage } from '../lib/supabase';
import { X, Upload, Image as ImageIcon, AlertTriangle, Loader2, Info, Sparkles, Check } from 'lucide-react';

interface CustomProductRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: RequestSubmissionResult, details: {
    productName: string;
    customerName: string;
    quantity: number;
    estimatedTotal: number;
    deliveryAddress: string;
  }) => void;
}

export const CustomProductRequestModal: React.FC<CustomProductRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  // Form Fields
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [expectedBudget, setExpectedBudget] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle File Selection
  const handleFileChange = (file: File) => {
    setImageError(null);

    // Limit Size: 5MB
    if (file.size > STORE_SETTINGS.maxUploadSizeBytes) {
      setImageError(`File size exceeds 5MB (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose a smaller image.`);
      return;
    }

    // Allowed types: jpeg, png, webp
    if (!STORE_SETTINGS.allowedImageTypes.includes(file.type)) {
      setImageError('Unsupported file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!productName.trim() || productName.trim().length < 2) {
      newErrors.productName = 'Please enter the requested product name.';
    }

    if (!description.trim() || description.trim().length < 5) {
      newErrors.description = 'Please describe the product specifications or brand details (min 5 characters).';
    }

    const parsedQty = Number(quantity);
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      newErrors.quantity = 'Desired quantity must be a positive integer.';
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      newErrors.customerName = 'Please provide your full name.';
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      newErrors.phone = 'Please provide a valid mobile number.';
    }

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      newErrors.deliveryAddress = 'Please provide your full delivery address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent double-clicks

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let uploadedImageUrl: string | null = null;

      if (imageFile) {
        setIsUploadingImage(true);
        const uploadResult = await uploadReferenceImage(imageFile);
        setIsUploadingImage(false);

        if (uploadResult.error) {
          setSubmitError(uploadResult.error);
          setIsSubmitting(false);
          return;
        }
        uploadedImageUrl = uploadResult.url;
      }

      const budgetVal = expectedBudget ? parseFloat(expectedBudget) : null;

      const result = await submitCustomProductRequest({
        customer_name: customerName,
        phone: phone,
        requested_product_name: productName,
        description: description,
        quantity: Math.floor(Number(quantity)),
        expected_budget: budgetVal,
        delivery_address: deliveryAddress,
        reference_image_url: uploadedImageUrl,
        additional_requirements: additionalRequirements
      });

      if (result.success) {
        onSuccess(result, {
          productName: productName.trim(),
          customerName: customerName.trim(),
          quantity: Math.floor(Number(quantity)),
          estimatedTotal: budgetVal ? budgetVal * Math.floor(Number(quantity)) : 0,
          deliveryAddress: deliveryAddress.trim()
        });
      } else {
        setSubmitError(result.error || 'Failed to submit custom request. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Request a Product Not Listed</h3>
              <p className="text-xs text-blue-200">Custom Sourcing & Special Orders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Intro */}
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100/80 text-xs text-blue-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Looking for something specific that is not in our catalog? Fill out the details below, and our sourcing team will check availability and quote you directly.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Product Name & Quantity */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Requested Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. Sony WH-1000XM5 Silver Edition, Wooden Desk Mat..."
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  if (errors.productName) setErrors({ ...errors, productName: '' });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                  errors.productName
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.productName && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Desired Qty <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                disabled={isSubmitting}
                value={quantity}
                onChange={(e) => {
                  setQuantity(parseInt(e.target.value) || 1);
                  if (errors.quantity) setErrors({ ...errors, quantity: '' });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none font-bold ${
                  errors.quantity
                    ? 'border-rose-400 bg-rose-50 focus:border-rose-500'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.quantity && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.quantity}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Product Description & Specifications <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              disabled={isSubmitting}
              placeholder="Include model, size, color, brand, or specific features you need..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none resize-none ${
                errors.description
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
            />
            {errors.description && (
              <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.description}</p>
            )}
          </div>

          {/* Budget & Reference Image Upload */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Expected Budget (Per Unit) <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  {STORE_SETTINGS.currency}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  disabled={isSubmitting}
                  placeholder="e.g. 2500"
                  value={expectedBudget}
                  onChange={(e) => setExpectedBudget(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm transition outline-none"
                />
              </div>
            </div>

            {/* Reference Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reference Image <span className="text-slate-400 font-normal">(Max 5MB - JPG, PNG, WEBP)</span>
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isSubmitting}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {!imagePreview ? (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50 hover:bg-blue-50/40 text-xs text-slate-600 transition"
                >
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Upload Reference Photo</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-blue-200 bg-blue-50/50">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">
                      {imageFile?.name || 'Uploaded photo'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {imageFile ? `${(imageFile.size / 1024).toFixed(0)} KB` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    disabled={isSubmitting}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove Image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {imageError && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{imageError}</p>
              )}
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                placeholder="e.g. Sarah Jenkins"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (errors.customerName) setErrors({ ...errors, customerName: '' });
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none ${
                  errors.customerName
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
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
                    ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                    : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                }`}
              />
              {errors.phone && (
                <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.phone}</p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Delivery Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              disabled={isSubmitting}
              placeholder="Enter complete shipping address where item should be delivered"
              value={deliveryAddress}
              onChange={(e) => {
                setDeliveryAddress(e.target.value);
                if (errors.deliveryAddress) setErrors({ ...errors, deliveryAddress: '' });
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition outline-none resize-none ${
                errors.deliveryAddress
                  ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500'
                  : 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
              }`}
            />
            {errors.deliveryAddress && (
              <p className="text-rose-500 text-[11px] mt-1 font-medium">{errors.deliveryAddress}</p>
            )}
          </div>

          {/* Additional Requirements */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Additional Requirements or Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Packaging instructions, required delivery deadline"
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm transition outline-none"
            />
          </div>

          {/* Actions */}
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
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-600/25 transition disabled:opacity-50 text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isUploadingImage ? 'Uploading Image...' : 'Submitting Request...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Submit Custom Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

