import React, { useState } from 'react';
import { trackCustomerRequest, STORE_SETTINGS, generateCustomerWhatsAppLink } from '../lib/supabase';
import { RequestStatus } from '../types';
import { X, Search, Clock, CheckCircle2, XCircle, PackageCheck, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

interface TrackRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const TrackRequestModal: React.FC<TrackRequestModalProps> = ({
  isOpen,
  onClose,
  initialCode = ''
}) => {
  if (!isOpen) return null;

  const [requestCode, setRequestCode] = useState(initialCode);
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [result, setResult] = useState<{
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
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestCode.trim()) {
      setSearchError('Please enter your Request ID (e.g. REQ-202611-1234)');
      return;
    }
    if (!phone.trim()) {
      setSearchError('Please enter the mobile number used when submitting.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setResult(null);

    try {
      const response = await trackCustomerRequest(requestCode.trim(), phone.trim());
      if (response.found && response.request) {
        setResult(response.request);
      } else {
        setSearchError(response.error || 'No matching request found.');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error looking up request.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            PENDING REVIEW
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            REQUEST ACCEPTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            REQUEST DECLINED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <PackageCheck className="w-3.5 h-3.5 text-blue-600" />
            FULFILLED / COMPLETED
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div 
        className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Track Product Request</h3>
              <p className="text-xs text-slate-500">Check live status & seller confirmation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Request ID
              </label>
              <input
                type="text"
                required
                placeholder="e.g. REQ-202611-1234"
                value={requestCode}
                onChange={(e) => setRequestCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Your Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="Number used on form"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition text-sm disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Status...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Find My Request</span>
              </>
            )}
          </button>

          {searchError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Request Code</span>
                  <span className="text-base font-bold font-mono text-slate-900">{result.request_code}</span>
                </div>
                <div>{getStatusBadge(result.status)}</div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Product:</span>
                  <span className="font-semibold text-slate-800 text-right truncate max-w-[220px]">
                    {result.product_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Requested Quantity:</span>
                  <span className="font-semibold text-slate-800">{result.quantity} units</span>
                </div>
                {result.confirmed_quantity && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Confirmed Quantity:</span>
                    <span>{result.confirmed_quantity} units</span>
                  </div>
                )}
                {result.confirmed_price && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Confirmed Final Price:</span>
                    <span>{STORE_SETTINGS.currency}{result.confirmed_price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Submission Date:</span>
                  <span>{new Date(result.created_at).toLocaleDateString()} {new Date(result.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {result.admin_notes && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900">
                  <span className="font-bold block mb-0.5">Seller Message:</span>
                  <p>{result.admin_notes}</p>
                </div>
              )}

              {/* Contact Seller WhatsApp Button */}
              <a
                href={generateCustomerWhatsAppLink(result.request_code, result.product_name, 'Customer', result.quantity)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Seller on WhatsApp</span>
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

