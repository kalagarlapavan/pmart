import React, { useState, useEffect } from 'react';
import { Product, RequestSubmissionResult } from './types';
import { fetchProducts, STORE_SETTINGS, getAllAdminRequests } from './lib/supabase';
import { Header } from './components/Header';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { ProductRequestModal } from './components/ProductRequestModal';
import { CustomProductRequestModal } from './components/CustomProductRequestModal';
import { RequestSuccessModal } from './components/RequestSuccessModal';
import { TrackRequestModal } from './components/TrackRequestModal';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  Sparkles, 
  Send, 
  Search, 
  ShieldCheck, 
  Truck, 
  CheckCircle2, 
  MessageSquare,
  Package, 
  ChevronRight,
  PlusCircle,
  HelpCircle
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & View Mode
  const [isAdminView, setIsAdminView] = useState(false);

  // Products Data & Filtering
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterInStockOnly, setFilterInStockOnly] = useState(false);

  // Modals State
  const [detailsProduct, setDetailsProduct] = useState<Product | null>(null);
  const [requestProduct, setRequestProduct] = useState<Product | null>(null);
  const [customRequestOpen, setCustomRequestOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);

  // Success Confirmation Modal
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successRequestCode, setSuccessRequestCode] = useState('');
  const [successDetails, setSuccessDetails] = useState<{
    productName: string;
    customerName: string;
    quantity: number;
    estimatedTotal: number;
    deliveryAddress: string;
  } | null>(null);

  // Pending requests badge counter
  const [pendingCount, setPendingCount] = useState(0);

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load products and count pending requests
  const loadInitialData = async () => {
    try {
      const prods = await fetchProducts();
      setProducts(prods);

      const adminData = await getAllAdminRequests();
      const pendingTotal = 
        adminData.standardRequests.filter(r => r.status === 'PENDING').length +
        adminData.customRequests.filter(r => r.status === 'PENDING').length;
      setPendingCount(pendingTotal);
    } catch (e) {
      console.error('Error loading catalog:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [isAdminView]);

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products by category, search text, and stock
  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'All' && product.category !== selectedCategory) {
      return false;
    }
    if (filterInStockOnly && product.stock <= 0) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = product.name.toLowerCase().includes(q);
      const matchCat = product.category.toLowerCase().includes(q);
      const matchDesc = product.description.toLowerCase().includes(q);
      return matchName || matchCat || matchDesc;
    }
    return true;
  });

  // Handle successful request submission
  const handleRequestSuccess = (
    result: RequestSubmissionResult,
    details: {
      productName: string;
      customerName: string;
      quantity: number;
      estimatedTotal: number;
      deliveryAddress: string;
    }
  ) => {
    // Close form modals
    setRequestProduct(null);
    setCustomRequestOpen(false);

    // Open confirmation screen
    setSuccessRequestCode(result.request_code || 'REQ-SUCCESS');
    setSuccessDetails(details);
    setSuccessModalOpen(true);

    showToast(`Request #${result.request_code} recorded successfully!`, 'success');
    loadInitialData();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border ${
            toast.type === 'success' 
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700' 
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(!isAdminView)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCustomRequest={() => setCustomRequestOpen(true)}
        onOpenTrackModal={() => setTrackModalOpen(true)}
        pendingRequestsCount={pendingCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdminView ? (
          /* Admin Requests & Order Management Dashboard */
          <AdminDashboard onNotify={showToast} />
        ) : (
          /* Storefront View */
          <div>
            {/* Hero / Sourcing Banner */}
            <div className="bg-gradient-to-b from-blue-900 via-indigo-950 to-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-indigo-900">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                    <span>Direct Customer Request System</span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                    Smart Shopping with <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-sky-300">
                      On-Demand Product Requests
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                    Browse our curated catalog and click <strong>"Request This Product"</strong> to submit order inquiries without upfront payment. Need an unlisted or specialty item? Our team will source it for you!
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => setCustomRequestOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Request a Product Not Listed</span>
                    </button>

                    <button
                      onClick={() => setTrackModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white font-bold text-xs sm:text-sm border border-white/20 transition"
                    >
                      <span>Track Existing Request</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Workflow Feature Steps Box */}
                <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-3.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span>How Customer Requests Work</span>
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        1
                      </span>
                      <span><strong>Select Product:</strong> Click "Request This Product" on any item card.</span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        2
                      </span>
                      <span><strong>Submit Details:</strong> Enter desired quantity, address, and mobile number. No payment taken!</span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        3
                      </span>
                      <span><strong>Instant Request ID:</strong> Receive unique tracking ID and seller WhatsApp link.</span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center flex-shrink-0 text-[10px]">
                        4
                      </span>
                      <span><strong>Seller Confirmation:</strong> Admin verifies stock, confirms price, and updates you.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Stock Checkbox Filter */}
                <div className="flex items-center justify-between md:justify-end gap-3 text-xs font-semibold text-slate-600 border-t md:border-t-0 pt-2 md:pt-0">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filterInStockOnly}
                      onChange={(e) => setFilterInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <span>Show In-Stock Only</span>
                  </label>
                  <span className="text-slate-400 font-normal">
                    ({filteredProducts.length} items)
                  </span>
                </div>

              </div>
            </div>

            {/* Product Catalog Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {selectedCategory === 'All' ? 'Featured Store Catalog' : `${selectedCategory} Products`}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select any item to view specifications or submit a customer request.
                  </p>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 my-6">
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <h3 className="text-base font-bold text-slate-700">No products match your criteria</h3>
                  <p className="text-xs text-slate-400 mt-1 mb-4">
                    Can't find what you are looking for? Submit a custom sourcing request!
                  </p>
                  <button
                    onClick={() => setCustomRequestOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Request This Unlisted Product</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onRequestClick={(p) => setRequestProduct(p)}
                      onViewDetails={(p) => setDetailsProduct(p)}
                    />
                  ))}
                </div>
              )}

              {/* Bottom Sourcing CTA Banner */}
              <div className="mt-14 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2 text-center md:text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300 block">
                    Custom Sourcing Service
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    Looking for a product not listed on pmart?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                    Tell us what you need, your expected budget, and even upload a photo. Our team will source it from verified suppliers.
                  </p>
                </div>

                <button
                  onClick={() => setCustomRequestOpen(true)}
                  className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg shadow-white/10 active:scale-95 transition flex items-center gap-2 flex-shrink-0"
                >
                  <PlusCircle className="w-4 h-4 text-blue-600" />
                  <span>Request a Product Not Listed</span>
                </button>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-black text-slate-900 text-base">p<span className="text-blue-600">mart</span></span>
            <span className="ml-2 font-medium">Customer Product Request & Order Management System</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setTrackModalOpen(true)} className="hover:text-blue-600 transition">
              Track Request
            </button>
            <button onClick={() => setCustomRequestOpen(true)} className="hover:text-blue-600 transition">
              Custom Request
            </button>
            <button onClick={() => setIsAdminView(!isAdminView)} className="hover:text-blue-600 transition font-semibold">
              {isAdminView ? 'Storefront' : 'Admin Portal'}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      
      {/* 1. Product Details Modal */}
      <ProductDetailsModal
        product={detailsProduct}
        onClose={() => setDetailsProduct(null)}
        onRequestClick={(p) => setRequestProduct(p)}
      />

      {/* 2. Product Request Modal */}
      <ProductRequestModal
        product={requestProduct}
        onClose={() => setRequestProduct(null)}
        onSuccess={handleRequestSuccess}
      />

      {/* 3. Custom Product Request Modal */}
      <CustomProductRequestModal
        isOpen={customRequestOpen}
        onClose={() => setCustomRequestOpen(false)}
        onSuccess={handleRequestSuccess}
      />

      {/* 4. Request Success Modal */}
      <RequestSuccessModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        requestCode={successRequestCode}
        details={successDetails}
        onOpenTracking={() => setTrackModalOpen(true)}
      />

      {/* 5. Track Request Modal */}
      <TrackRequestModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
        initialCode={successRequestCode}
      />

    </div>
  );
};

export default App;

