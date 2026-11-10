import React, { useState, useEffect } from 'react';
import { CustomerRequest, CustomProductRequest, RequestStatus } from '../types';
import { 
  getAllAdminRequests, 
  updateRequestStatus, 
  generateAdminWhatsAppLink, 
  createProduct,
  STORE_SETTINGS 
} from '../lib/supabase';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PackageCheck, 
  MessageSquare, 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  Edit3, 
  FileText, 
  Save, 
  DollarSign, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Tag, 
  Sparkles,
  ChevronRight,
  Eye,
  Check,
  X,
  PlusCircle,
  Package
} from 'lucide-react';

interface AdminDashboardProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNotify }) => {
  // Data States
  const [standardRequests, setStandardRequests] = useState<CustomerRequest[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomProductRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'STANDARD' | 'CUSTOM'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Request for Drawer/Inspection
  const [selectedItem, setSelectedItem] = useState<{
    item: CustomerRequest | CustomProductRequest;
    isCustom: boolean;
  } | null>(null);

  // Edit / Action Modals
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [confirmedQty, setConfirmedQty] = useState<number>(1);
  const [confirmedPrice, setConfirmedPrice] = useState<number>(0);
  const [adminNotesDraft, setAdminNotesDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Add Product State
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Electronics');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdTag, setNewProdTag] = useState('New Arrival');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingProduct(true);
    try {
      const res = await createProduct({
        name: newProdName,
        category: newProdCategory,
        description: newProdDesc,
        price: parseFloat(newProdPrice) || 0,
        stock: parseInt(newProdStock) || 0,
        imageUrl: newProdImage,
        tags: newProdTag ? [newProdTag] : []
      });
      if (res.success) {
        onNotify?.(`Product "${res.product?.name}" added to catalog!`, 'success');
        setAddProductModalOpen(false);
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setNewProdImage('');
      } else {
        onNotify?.(res.error || 'Failed to add product', 'error');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Error creating product', 'error');
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Load Data
  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAdminRequests();
      setStandardRequests(data.standardRequests);
      setCustomRequests(data.customRequests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Update selected item draft notes when selected
  useEffect(() => {
    if (selectedItem) {
      setAdminNotesDraft(selectedItem.item.admin_notes || '');
      setConfirmedQty(selectedItem.item.confirmed_quantity || selectedItem.item.quantity || 1);
      const initialPrice = 'unit_price' in selectedItem.item 
        ? selectedItem.item.unit_price 
        : (selectedItem.item.expected_budget || 0);
      setConfirmedPrice(selectedItem.item.confirmed_price || initialPrice);
    }
  }, [selectedItem]);

  // Aggregate combined requests with type flag
  const combined = [
    ...standardRequests.map(r => ({ ...r, isCustom: false })),
    ...customRequests.map(r => ({ ...r, isCustom: true }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Filtered requests
  const filteredRequests = combined.filter(req => {
    // Status Filter
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

    // Type Filter
    if (typeFilter === 'STANDARD' && req.isCustom) return false;
    if (typeFilter === 'CUSTOM' && !req.isCustom) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const code = req.request_code.toLowerCase();
      const name = req.customer_name.toLowerCase();
      const phone = req.phone.toLowerCase();
      const product = req.isCustom 
        ? (req as CustomProductRequest).requested_product_name.toLowerCase()
        : (req as CustomerRequest).product_name.toLowerCase();

      return code.includes(q) || name.includes(q) || phone.includes(q) || product.includes(q);
    }

    return true;
  });

  // KPI Metrics
  const totalCount = combined.length;
  const pendingCount = combined.filter(r => r.status === 'PENDING').length;
  const acceptedCount = combined.filter(r => r.status === 'ACCEPTED').length;
  const completedCount = combined.filter(r => r.status === 'COMPLETED').length;
  const pipelineValue = combined.reduce((acc, r) => {
    if ('estimated_total' in r && r.estimated_total) return acc + r.estimated_total;
    if ('expected_budget' in r && r.expected_budget) return acc + (r.expected_budget * r.quantity);
    return acc;
  }, 0);

  // Status Actions
  const handleUpdateStatus = async (
    status: RequestStatus,
    extraUpdates: { confirmed_quantity?: number; confirmed_price?: number; admin_notes?: string } = {}
  ) => {
    if (!selectedItem) return;
    setIsSaving(true);

    try {
      const res = await updateRequestStatus(selectedItem.isCustom, selectedItem.item.id, {
        status,
        admin_notes: extraUpdates.admin_notes ?? adminNotesDraft,
        confirmed_quantity: extraUpdates.confirmed_quantity,
        confirmed_price: extraUpdates.confirmed_price
      });

      if (res.success) {
        onNotify?.(`Request #${selectedItem.item.request_code} status updated to ${status}.`, 'success');
        await loadRequests();
        // Update local selected item
        setSelectedItem({
          isCustom: selectedItem.isCustom,
          item: {
            ...selectedItem.item,
            status,
            admin_notes: extraUpdates.admin_notes ?? adminNotesDraft,
            confirmed_quantity: extraUpdates.confirmed_quantity ?? selectedItem.item.confirmed_quantity,
            confirmed_price: extraUpdates.confirmed_price ?? selectedItem.item.confirmed_price
          } as any
        });
        setAcceptModalOpen(false);
      } else {
        onNotify?.(res.error || 'Failed to update request', 'error');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Error updating status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      const res = await updateRequestStatus(selectedItem.isCustom, selectedItem.item.id, {
        status: selectedItem.item.status,
        admin_notes: adminNotesDraft
      });
      if (res.success) {
        onNotify?.('Admin internal notes saved successfully.', 'success');
        await loadRequests();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            PENDING
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ACCEPTED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            REJECTED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <PackageCheck className="w-3 h-3 text-blue-600" />
            COMPLETED
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Customer Requests Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Admin Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review customer product inquiries, adjust quotes, and contact buyers via WhatsApp.
          </p>
        </div>

        {/* Action Controls & Business Rule Banner */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={() => setAddProductModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-blue-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </button>

          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2.5 max-w-md">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Reminder:</strong> Requests are inquiries and not automatically marked as paid.
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 my-6">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Inquiries</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 shadow-sm">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Pending Review</span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">{pendingCount}</span>
        </div>
        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/70 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Accepted Orders</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{acceptedCount}</span>
        </div>
        <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-black text-blue-800 mt-1 block">{completedCount}</span>
        </div>
        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Est. Pipeline Value</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {STORE_SETTINGS.currency}{pipelineValue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {status === 'ALL' ? 'All Requests' : status}
              </button>
            ))}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 border-t md:border-t-0 pt-2 md:pt-0">
            <span className="text-xs font-bold text-slate-400 mr-1 hidden sm:inline">Type:</span>
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('STANDARD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === 'STANDARD'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Store Catalog
            </button>
            <button
              onClick={() => setTypeFilter('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === 'CUSTOM'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Custom Sourcing
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request Code (REQ-...), Customer Name, Phone, or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition outline-none"
          />
        </div>
      </div>

      {/* Requests Table / Cards */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
          <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No requests found</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Request ID</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Requested Item</th>
                  <th className="py-3.5 px-4">Qty</th>
                  <th className="py-3.5 px-4">Est. Total</th>
                  <th className="py-3.5 px-4">Delivery Address</th>
                  <th className="py-3.5 px-4">Date Submitted</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.map((req) => {
                  const isCustom = req.isCustom;
                  const productName = isCustom 
                    ? (req as CustomProductRequest).requested_product_name 
                    : (req as CustomerRequest).product_name;
                  const estimatedTotal = 'estimated_total' in req 
                    ? req.estimated_total 
                    : ((req as CustomProductRequest).expected_budget 
                        ? (req as CustomProductRequest).expected_budget! * req.quantity 
                        : 0);

                  const exceedsStock = !isCustom && 
                    (req as CustomerRequest).stock_at_request !== undefined && 
                    req.quantity > (req as CustomerRequest).stock_at_request!;

                  return (
                    <tr 
                      key={req.id} 
                      className="hover:bg-blue-50/30 transition cursor-pointer"
                      onClick={() => setSelectedItem({ item: req, isCustom })}
                    >
                      {/* Request ID */}
                      <td className="py-4 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {req.request_code}
                          {isCustom && (
                            <span className="p-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-sans font-bold" title="Custom Sourcing Item">
                              CUSTOM
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{req.customer_name}</div>
                        <div className="text-slate-500 font-mono text-[11px]">{req.phone}</div>
                      </td>

                      {/* Product */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          {!isCustom && (req as CustomerRequest).product_image && (
                            <img
                              src={(req as CustomerRequest).product_image}
                              alt={productName}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            />
                          )}
                          {isCustom && (req as CustomProductRequest).reference_image_url && (
                            <img
                              src={(req as CustomProductRequest).reference_image_url!}
                              alt="Reference"
                              className="w-9 h-9 rounded-lg object-cover border border-purple-200 flex-shrink-0"
                            />
                          )}
                          <span className="font-semibold text-slate-800 truncate" title={productName}>
                            {productName}
                          </span>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{req.quantity}</span>
                        {exceedsStock && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800" title="Exceeded stock at request time">
                            Exceeds Stock
                          </span>
                        )}
                      </td>

                      {/* Estimated Total */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        {estimatedTotal > 0 ? (
                          `${STORE_SETTINGS.currency}${estimatedTotal.toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 font-normal">Custom Quote</span>
                        )}
                      </td>

                      {/* Address */}
                      <td className="py-4 px-4 max-w-[180px] truncate text-slate-600" title={req.delivery_address}>
                        {req.delivery_address}
                      </td>

                      {/* Submission Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-500">
                        {new Date(req.created_at).toLocaleDateString()}{' '}
                        <span className="text-[10px] text-slate-400">
                          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStatusBadge(req.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Customer */}
                          <a
                            href={generateAdminWhatsAppLink(req.phone, req.request_code, req.customer_name, productName, req.status)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                            title="Chat with Customer on WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </a>

                          {/* Inspect Drawer */}
                          <button
                            onClick={() => setSelectedItem({ item: req, isCustom })}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center gap-1 text-[11px] px-2.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Inspection & Action Drawer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div 
            className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base">{selectedItem.item.request_code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {selectedItem.isCustom ? 'Custom Sourcing' : 'Catalog Request'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Submitted: {new Date(selectedItem.item.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Status Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedItem.item.status)}</div>
                </div>
                {/* Direct WhatsApp Customer */}
                <a
                  href={generateAdminWhatsAppLink(
                    selectedItem.item.phone,
                    selectedItem.item.request_code,
                    selectedItem.item.customer_name,
                    selectedItem.isCustom 
                      ? (selectedItem.item as CustomProductRequest).requested_product_name 
                      : (selectedItem.item as CustomerRequest).product_name,
                    selectedItem.item.status
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp Customer</span>
                </a>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Customer Details</h4>
                <div className="grid sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>Name: <strong className="text-slate-900">{selectedItem.item.customer_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Phone: <strong className="text-slate-900">{selectedItem.item.phone}</strong></span>
                  </div>
                  <div className="sm:col-span-2 flex items-start gap-2 pt-2 border-t border-slate-200">
                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>Delivery Address: <strong className="text-slate-800">{selectedItem.item.delivery_address}</strong></span>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Requested Product Information</h4>
                <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-200/80 space-y-3">
                  <div className="flex gap-3 items-center">
                    {!selectedItem.isCustom && (selectedItem.item as CustomerRequest).product_image && (
                      <img
                        src={(selectedItem.item as CustomerRequest).product_image}
                        alt="Product"
                        className="w-16 h-16 rounded-xl object-cover border border-blue-200"
                      />
                    )}
                    {selectedItem.isCustom && (selectedItem.item as CustomProductRequest).reference_image_url && (
                      <a
                        href={(selectedItem.item as CustomProductRequest).reference_image_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative group"
                      >
                        <img
                          src={(selectedItem.item as CustomProductRequest).reference_image_url!}
                          alt="Customer Reference"
                          className="w-16 h-16 rounded-xl object-cover border border-purple-300"
                        />
                        <span className="absolute inset-0 bg-black/40 rounded-xl text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                          Zoom
                        </span>
                      </a>
                    )}
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">
                        {selectedItem.isCustom 
                          ? (selectedItem.item as CustomProductRequest).requested_product_name 
                          : (selectedItem.item as CustomerRequest).product_name}
                      </h5>
                      <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                        <span>Quantity: <strong>{selectedItem.item.quantity} units</strong></span>
                        {!selectedItem.isCustom && (
                          <span>Unit Price: <strong>{STORE_SETTINGS.currency}{(selectedItem.item as CustomerRequest).unit_price.toLocaleString()}</strong></span>
                        )}
                        {selectedItem.isCustom && (selectedItem.item as CustomProductRequest).expected_budget && (
                          <span>Target Budget: <strong>{STORE_SETTINGS.currency}{(selectedItem.item as CustomProductRequest).expected_budget?.toLocaleString()}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Custom request description */}
                  {selectedItem.isCustom && (
                    <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">Customer Description:</span>
                      <p>{(selectedItem.item as CustomProductRequest).description}</p>
                      {(selectedItem.item as CustomProductRequest).additional_requirements && (
                        <p className="mt-2 text-slate-500 italic">
                          Requirements: {(selectedItem.item as CustomProductRequest).additional_requirements}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Standard customer message */}
                  {!selectedItem.isCustom && (selectedItem.item as CustomerRequest).customer_message && (
                    <div className="p-3 bg-white rounded-xl border border-blue-100 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">Customer Message:</span>
                      <p>{(selectedItem.item as CustomerRequest).customer_message}</p>
                    </div>
                  )}

                  {/* Confirmed price & qty if accepted */}
                  {selectedItem.item.confirmed_quantity && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex justify-between text-emerald-900 font-bold">
                      <span>Confirmed by Admin: {selectedItem.item.confirmed_quantity} units</span>
                      {selectedItem.item.confirmed_price && (
                        <span>Confirmed Price: {STORE_SETTINGS.currency}{selectedItem.item.confirmed_price.toLocaleString()}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Admin Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Internal Admin Notes
                  </h4>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Notes</span>
                  </button>
                </div>
                <textarea
                  rows={2}
                  disabled={isSaving}
                  placeholder="Record supplier quotes, customer discussions, restock dates, or tracking IDs..."
                  value={adminNotesDraft}
                  onChange={(e) => setAdminNotesDraft(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs resize-none"
                />
              </div>

              {/* Status Action Buttons */}
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  Update Request Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  
                  {/* Accept Button: Opens confirmation modal to optionally adjust price and quantity */}
                  <button
                    onClick={() => setAcceptModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>

                  {/* Reject Button */}
                  <button
                    onClick={() => handleUpdateStatus('REJECTED')}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject</span>
                  </button>

                  {/* Mark Completed Button */}
                  <button
                    onClick={() => handleUpdateStatus('COMPLETED')}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs border border-blue-200 transition"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Mark Completed</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  * Note: Accepting or updating requests does not mark them as paid. Payment processing is independent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Request Dialog (With optional price and quantity adjustment) */}
      {acceptModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Accept & Confirm Request</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm this order inquiry for <strong>{selectedItem.item.customer_name}</strong>. You can adjust or confirm the final agreed quantity and price below before accepting.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmed Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={confirmedQty}
                  onChange={(e) => setConfirmedQty(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirmed Unit Price ({STORE_SETTINGS.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={confirmedPrice}
                  onChange={(e) => setConfirmedPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-sm"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between font-bold text-slate-800">
                <span>Calculated Final Total:</span>
                <span className="text-emerald-700">
                  {STORE_SETTINGS.currency}{(confirmedQty * confirmedPrice).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAcceptModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleUpdateStatus('ACCEPTED', {
                  confirmed_quantity: confirmedQty,
                  confirmed_price: confirmedPrice
                })}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {addProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-700">
                <PlusCircle className="w-5 h-5" />
                <h3 className="text-lg font-black text-slate-900">Add New Store Product</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddProductModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ultra HD 4K Monitor 27-inch"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 bg-white text-xs sm:text-sm"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Computers">Computers</option>
                    <option value="Home & Living">Home & Living</option>
                    <option value="Cameras">Cameras</option>
                    <option value="Office & Furniture">Office & Furniture</option>
                    <option value="Food & Grocery">Food & Grocery</option>
                    <option value="Fashion & Bags">Fashion & Bags</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Badge / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. New Arrival, Best Seller"
                    value={newProdTag}
                    onChange={(e) => setNewProdTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price ({STORE_SETTINGS.currency}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="e.g. 3499"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Available Stock <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 15"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Key features, specifications, and warranty details..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Image URL (HTTPS link)
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newProdImage}
                  onChange={(e) => setNewProdImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
                {/* Preset sample images quick picks */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400">Quick photos:</span>
                  <button
                    type="button"
                    onClick={() => setNewProdImage('https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600"
                  >
                    Smart Watch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProdImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600"
                  >
                    Sneakers
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProdImage('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800&auto=format&fit=crop&q=80')}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600"
                  >
                    Laptop
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50"
                >
                  {isAddingProduct ? 'Adding...' : 'Add Product to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

