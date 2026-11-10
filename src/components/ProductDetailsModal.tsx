import React from 'react';
import { Product } from '../types';
import { STORE_SETTINGS } from '../lib/supabase';
import { X, Send, CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onRequestClick: (product: Product) => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  onClose,
  onRequestClick
}) => {
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image & Category Banner */}
          <div className="relative bg-slate-100 min-h-[300px] md:min-h-full">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-white/50">
                {product.category}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>SKU / Product ID: {product.id}</span>
                {product.rating && (
                  <span className="text-amber-500 font-bold">
                    ★ {product.rating} / 5.0
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight mb-2">
                {product.name}
              </h2>

              {/* Price & Stock info */}
              <div className="flex items-baseline gap-3 my-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div>
                  <span className="text-xs text-slate-500 block">Unit Price</span>
                  <span className="text-2xl font-black text-blue-700">
                    {STORE_SETTINGS.currency}{product.price.toLocaleString()}
                  </span>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-xs text-slate-500 block mb-1">Availability</span>
                  {product.stock > 5 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> In Stock ({product.stock} units)
                    </span>
                  ) : product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> Only {product.stock} units left
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700">
                      <XCircle className="w-3.5 h-3.5" /> Out of stock (Custom order)
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">About this product</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 font-medium text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Verified Seller</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Doorstep Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-50">
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>Pre-order Inquiry</span>
                </div>
              </div>
            </div>

            {/* Request CTA */}
            <div className="mt-8 pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  onClose();
                  onRequestClick(product);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 transition text-sm sm:text-base"
              >
                <Send className="w-4 h-4" />
                <span>Request This Product</span>
              </button>
              <p className="text-[11px] text-center text-slate-400">
                No automatic charges. Submit your request and our admin team will confirm availability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

