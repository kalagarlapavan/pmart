import React from 'react';
import { Product } from '../types';
import { STORE_SETTINGS } from '../lib/supabase';
import { Send, Eye, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onRequestClick: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRequestClick,
  onViewDetails
}) => {
  const getStockBadge = () => {
    if (product.stock > 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          In Stock ({product.stock})
        </span>
      );
    } else if (product.stock > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          Only {product.stock} left
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Out of Stock (Request Available)
        </span>
      );
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Product Image & Badges */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onViewDetails(product)}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-slate-800 shadow-sm border border-white/50">
            {product.category}
          </span>
          {product.tags && product.tags[0] && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-600 text-white shadow-sm">
              {product.tags[0]}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3">
          {getStockBadge()}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ID: #{product.id.slice(0, 8)}</span>
            {product.rating && (
              <span className="flex items-center gap-1 text-amber-500 font-semibold">
                ★ {product.rating}
              </span>
            )}
          </div>

          <h3 
            onClick={() => onViewDetails(product)}
            className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 cursor-pointer text-base"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Price per unit</span>
              <span className="text-xl font-extrabold text-slate-900">
                {STORE_SETTINGS.currency}{product.price.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => onViewDetails(product)}
              className="col-span-2 flex items-center justify-center gap-1 py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              title="View product details"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>

            <button
              onClick={() => onRequestClick(product)}
              className="col-span-3 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-600/20 transition"
              title="Submit a request for this product without paying"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Request Product</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

