import React from 'react';
import { ShoppingBag, Search, PlusCircle, SearchCheck, ShieldCheck, Store } from 'lucide-react';

interface HeaderProps {
  isAdminView: boolean;
  onToggleAdminView: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCustomRequest: () => void;
  onOpenTrackModal: () => void;
  pendingRequestsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminView,
  onToggleAdminView,
  searchQuery,
  onSearchChange,
  onOpenCustomRequest,
  onOpenTrackModal,
  pendingRequestsCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  p<span className="text-blue-600">mart</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Request & Sourcing
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Direct Customer Sourcing & Order Management</p>
            </div>
          </div>

          {/* Search Bar (in Storefront mode) */}
          {!isAdminView && (
            <div className="flex-1 max-w-md hidden md:block">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products by name, category, or features..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-sm rounded-xl border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isAdminView ? (
              <>
                {/* Track Request Button */}
                <button
                  onClick={onOpenTrackModal}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-xl transition border border-slate-200 hover:border-blue-200"
                  title="Check the live status of your submitted request"
                >
                  <SearchCheck className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Track Request</span>
                  <span className="sm:hidden">Track</span>
                </button>

                {/* Request Unlisted Product */}
                <button
                  onClick={onOpenCustomRequest}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-sm shadow-blue-600/20 transition"
                  title="Need something not listed in the store? Submit a custom sourcing request!"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Request Unlisted Product</span>
                  <span className="sm:hidden">Custom Request</span>
                </button>
              </>
            ) : null}

            {/* Admin Switcher Toggle */}
            <button
              onClick={onToggleAdminView}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition border ${
                isAdminView
                  ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {isAdminView ? (
                <>
                  <Store className="w-4 h-4 text-blue-400" />
                  <span className="hidden sm:inline">Back to Store</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">Admin Portal</span>
                  {pendingRequestsCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

