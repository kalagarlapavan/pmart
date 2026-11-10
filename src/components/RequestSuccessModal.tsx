import React, { useState } from 'react';
import { STORE_SETTINGS, generateCustomerWhatsAppLink } from '../lib/supabase';
import { CheckCircle, Copy, Check, MessageSquare, Clock, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

interface RequestSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestCode: string;
  details: {
    productName: string;
    customerName: string;
    quantity: number;
    estimatedTotal: number;
    deliveryAddress: string;
  } | null;
  onOpenTracking: () => void;
}

export const RequestSuccessModal: React.FC<RequestSuccessModalProps> = ({
  isOpen,
  onClose,
  requestCode,
  details,
  onOpenTracking
}) => {
  if (!isOpen || !details) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(requestCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsAppLink = generateCustomerWhatsAppLink(
    requestCode,
    details.productName,
    details.customerName,
    details.quantity
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="bg-gradient-to-b from-emerald-500 to-teal-600 px-6 pt-8 pb-12 text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Request Submitted!</h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Thank you, {details.customerName}. Your request has been recorded.
          </p>
        </div>

        {/* Content Card (Overlapping) */}
        <div className="px-6 -mt-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 p-5 text-left">
            
            {/* Request ID Display */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Your Unique Request ID
                </span>
                <span className="text-lg font-black text-blue-700 tracking-wide font-mono">
                  {requestCode}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                title="Copy Request Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Request Details Breakdown */}
            <div className="py-3.5 space-y-2 text-xs text-slate-600 border-b border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Product:</span>
                <span className="font-bold text-slate-800 text-right max-w-[240px] truncate">
                  {details.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Quantity:</span>
                <span className="font-bold text-slate-800">{details.quantity} units</span>
              </div>
              {details.estimatedTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Total:</span>
                  <span className="font-bold text-emerald-700">
                    {STORE_SETTINGS.currency}{details.estimatedTotal.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-start pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Destination:
                </span>
                <span className="font-medium text-slate-700 text-right max-w-[220px] truncate">
                  {details.deliveryAddress}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500" /> Status:
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  PENDING REVIEW
                </span>
              </div>
            </div>

            {/* Business Rules Reassurance */}
            <div className="pt-3 text-[11px] text-slate-500 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>No upfront payment required:</strong> Our seller will review product availability and delivery timelines before confirming your order.
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 space-y-3">
          {/* WhatsApp Direct Contact Button */}
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/25 transition text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Seller on WhatsApp</span>
          </a>

          {/* Track Request Link */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenTracking();
              }}
              className="flex-1 py-2.5 px-3 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
            >
              Track Request Status
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

