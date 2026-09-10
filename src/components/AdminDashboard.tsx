import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  ArrowLeft,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  Eye,
  Filter,
  Truck,
  Check,
  X,
  Lock,
  UserCheck,
  UserX,
  Star,
  MessageSquare,
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { BazaaroLogo } from './BazaaroLogo';
import { AuthUser } from '../types';

interface AdminDashboardProps {
  token: string;
  user: AuthUser;
  onBackToStore: () => void;
}

type AdminTab = 'overview' | 'products' | 'categories' | 'orders' | 'users' | 'reviews';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  token,
  user,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Fetch Stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load stats');
      setStats(data.stats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // Tab: Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Tab: Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Tab: Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Tab: Users State
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Tab: Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewRatingFilter, setReviewRatingFilter] = useState('');

  // Fetch Data based on active tab
  useEffect(() => {
    if (activeTab === 'products') {
      fetch('/api/products?limit=100')
        .then((r) => r.json())
        .then((d) => setProducts(d.products || []))
        .catch(() => {});
    } else if (activeTab === 'categories') {
      fetch('/api/categories?includeInactive=true')
        .then((r) => r.json())
        .then((d) => setCategories(d.categories || []))
        .catch(() => {});
    } else if (activeTab === 'orders') {
      fetch(`/api/admin/orders?status=${orderStatusFilter}&paymentStatus=${orderPaymentFilter}&search=${encodeURIComponent(orderSearch)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setOrders(d.orders || []))
        .catch(() => {});
    } else if (activeTab === 'users') {
      fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setUsers(d.users || []))
        .catch(() => {});
    } else if (activeTab === 'reviews') {
      const params = new URLSearchParams();
      if (reviewSearch) params.append('search', reviewSearch);
      if (reviewRatingFilter) params.append('rating', reviewRatingFilter);
      fetch(`/api/admin/reviews?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => setReviews(d.reviews || []))
        .catch(() => {});
    }
  }, [activeTab, orderStatusFilter, orderPaymentFilter, orderSearch, userSearch, reviewSearch, reviewRatingFilter, token]);

  // Product Actions
  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productPayload = {
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      originalPrice: Number(formData.get('originalPrice')),
      discountPercent: Number(formData.get('discountPercent') || 0),
      stockCount: Number(formData.get('stockCount')),
      inStock: formData.get('inStock') === 'on',
      madeInIndia: formData.get('madeInIndia') === 'on',
      description: formData.get('description') as string,
      images: [(formData.get('image') as string) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
    };

    const isEdit = Boolean(editingProduct?.id);
    const url = isEdit ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      showToast(`Product ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsProductModalOpen(false);
      setEditingProduct(null);
      // Refresh
      fetch('/api/products?limit=100').then(r => r.json()).then(d => setProducts(d.products || []));
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this product?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete product');
      showToast('Product deactivated');
      setProducts(prev => prev.filter(p => p.id !== id));
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const catPayload = {
      key: formData.get('key') as string,
      label: formData.get('label') as string,
      iconName: formData.get('iconName') as string || 'LayoutGrid',
      description: formData.get('description') as string,
      displayOrder: Number(formData.get('displayOrder') || 0),
    };

    const isEdit = Boolean(editingCategory?.key);
    const url = isEdit ? `/api/admin/categories/${editingCategory.key}` : '/api/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(catPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category');

      showToast(`Category ${isEdit ? 'updated' : 'created'} successfully!`);
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      fetch('/api/categories?includeInactive=true').then(r => r.json()).then(d => setCategories(d.categories || []));
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleDeleteCategory = async (key: string) => {
    if (!window.confirm(`Deactivate category "${key}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${key}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to deactivate category');
      showToast('Category deactivated');
      setCategories(prev => prev.map(c => c.key === key ? { ...c, isActive: false } : c));
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');

      showToast(`Order #${orderId} marked as "${status}"`);
      setOrders(prev => prev.map(o => (o.orderId === orderId || o.id === orderId) ? { ...o, status } : o));
      if (selectedOrder) setSelectedOrder({ ...selectedOrder, status });
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  // User Actions
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change role');

      showToast('User role updated');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    const nextActive = !currentActive;
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      showToast(`User account ${nextActive ? 'activated' : 'blocked'}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isActive: nextActive } : u));
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const handleModerateReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to remove this customer review? It will be permanently removed from the catalog.')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove review');

      showToast('Review removed by administrator');
      setReviews((prev) => prev.filter((r) => (r._id || r.id) !== reviewId));
      fetchStats();
    } catch (err: any) {
      showToast(err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCat = selectedProductCategory === 'all' || p.category === selectedProductCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
          <div className="flex items-center gap-2">
            <BazaaroLogo size="sm" iconOnly theme="dark" />
            <div>
              <span className="text-base font-black text-white tracking-tight">Bazaaro</span>
              <span className="ml-2 text-[11px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                Admin Console
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-200">{user.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 overflow-x-auto">
        <div className="flex gap-1 py-2 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: 'Products', icon: Package },
            { id: 'categories', label: 'Categories', icon: FolderTree },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'reviews', label: 'Reviews', icon: Star },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900">Store Analytics & Health</h1>
                <p className="text-xs text-slate-500">Live indicators aggregated from MongoDB Atlas</p>
              </div>
              <button
                onClick={fetchStats}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {loading && !stats ? (
              <div className="py-20 text-center text-slate-400 text-sm">Computing statistics...</div>
            ) : stats ? (
              <>
                {/* 5 Major Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Revenue Card */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Verified Revenue</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                        <IndianRupee className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{formatINR(stats.totalRevenue)}</div>
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> From verified ZapUPI payments
                    </div>
                  </div>

                  {/* Total Orders */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Orders</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalOrders}</div>
                    <div className="text-[11px] text-slate-500">
                      <strong className="text-emerald-600">{stats.paidOrders} Paid</strong> •{' '}
                      <span className="text-amber-600">{stats.pendingPayments} Pending</span>
                    </div>
                  </div>

                  {/* Catalog Products */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Catalog Size</span>
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                        <Package className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalProducts}</div>
                    <div className="text-[11px] text-slate-500">Across {stats.totalCategories} categories</div>
                  </div>

                  {/* Registered Users */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Total Shoppers</span>
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalUsers}</div>
                    <div className="text-[11px] text-slate-500">Customer & admin profiles</div>
                  </div>

                  {/* Customer Reviews */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
                      <span>Customer Reviews</span>
                      <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                        <Star className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl font-black text-slate-900">{stats.totalReviews ?? 0}</div>
                    <div className="text-[11px] text-slate-500">Verified buyer ratings</div>
                  </div>
                </div>

                {/* Low Stock Warning Box */}
                {stats.lowStockCount > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Low Stock Alert ({stats.lowStockCount} Products &le; 10 units)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {stats.lowStockProducts.map((p: any) => (
                        <div key={p.id} className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                          <div className="truncate pr-2">
                            <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                            <span className="text-[10px] text-slate-500">{p.brand} • {formatINR(p.price)}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                            p.stockCount <= 2 ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.stockCount} left
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid: Orders by Status & Top Selling */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Orders by Status */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <span>Orders by Fulfillment Stage</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      {Object.entries(stats.ordersByStatus || {}).map(([st, count]: [string, any]) => (
                        <div key={st} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-semibold text-slate-700">{st}</span>
                          <span className="font-mono font-bold px-2 py-0.5 bg-slate-200 rounded-md text-slate-800 text-[11px]">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>Top Grossing Products</span>
                    </h3>
                    <div className="space-y-2 text-xs">
                      {stats.topSellingProducts?.length === 0 ? (
                        <p className="text-slate-400 py-6 text-center">No completed sales recorded yet.</p>
                      ) : (
                        stats.topSellingProducts?.map((item: any) => (
                          <div key={item._id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-900 block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-500">{item.unitsSold} units sold</span>
                            </div>
                            <span className="font-bold text-emerald-700 font-mono text-xs">
                              {formatINR(item.totalRevenue)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PRODUCTS */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900">Product Catalog Management</h1>
                <p className="text-xs text-slate-500">Add, edit stock, price, specifications, and availability</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search products by name or brand..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <select
                value={selectedProductCategory}
                onChange={(e) => setSelectedProductCategory(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-amber-500 outline-hidden"
              >
                <option value="all">All Categories</option>
                <option value="smartphones">Smartphones</option>
                <option value="laptops">Laptops</option>
                <option value="audio">Audio & TWS</option>
                <option value="wearables">Wearables</option>
                <option value="gaming">Gaming</option>
                <option value="smarthome">Smart Home</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Stock Units</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images?.[0] || 'https://via.placeholder.com/80'}
                              alt={p.name}
                              className="w-10 h-10 object-contain rounded-lg border border-slate-200 p-0.5 bg-slate-50"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {p.id} • {p.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 capitalize">{p.category}</td>
                        <td className="p-3 font-mono font-bold text-slate-900">{formatINR(p.price)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                            p.stockCount <= 5
                              ? 'bg-rose-100 text-rose-700'
                              : p.stockCount <= 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.stockCount}
                          </span>
                        </td>
                        <td className="p-3">
                          {p.inStock && p.stockCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3 h-3" /> Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Deactivate product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATEGORIES */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900">Category Catalog Management</h1>
                <p className="text-xs text-slate-500">Configure catalog departments and active states</p>
              </div>
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div key={cat.key} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{cat.label}</span>
                    <span className="text-[11px] font-mono text-slate-500 block">key: {cat.key}</span>
                    <span className="text-[10px] text-slate-400">Order: {cat.displayOrder || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.key)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ORDERS */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900">Customer Orders & Fulfillment</h1>
                <p className="text-xs text-slate-500">Live order processing, tracking, and ZapUPI payment inspection</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-3 items-center justify-between">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer Name, Phone, City, AWB..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-amber-500 outline-hidden"
                >
                  <option value="all">All Stages</option>
                  <option value="Placed">Placed</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Packed">Packed</option>
                  <option value="Dispatched">Dispatched</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-amber-500 outline-hidden"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Total (₹)</th>
                      <th className="p-3">Payment</th>
                      <th className="p-3">Fulfillment Stage</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.orderId || ord._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {ord.orderId}
                          <div className="text-[10px] text-slate-400 font-normal">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="p-3">
                          <strong className="text-slate-800 block">{ord.address?.fullName}</strong>
                          <span className="text-[11px] text-slate-500">{ord.address?.city}, {ord.address?.phone}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-600">{formatINR(ord.total)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                            ord.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.paymentStatus === 'failed'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.paymentStatus === 'paid' && <ShieldCheck className="w-3 h-3" />}
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.orderId || ord._id, e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white cursor-pointer"
                          >
                            <option value="Placed">Placed</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Packed">Packed</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: USERS */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-black text-slate-900">Shopper & Admin Accounts</h1>
                <p className="text-xs text-slate-500">View user registration records and manage role permissions</p>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name, email, or phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">User</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Orders Placed</th>
                      <th className="p-3">Registered On</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <strong className="text-slate-900 block">{u.name}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                        </td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white font-bold cursor-pointer"
                          >
                            <option value="customer">Customer</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td className="p-3 font-mono font-bold">{u.orderCount || 0}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {u.isActive !== false ? 'Active' : 'Blocked'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleToggleUserStatus(u._id, u.isActive !== false)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                              u.isActive !== false
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {u.isActive !== false ? 'Block User' : 'Unblock User'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: REVIEWS MODERATION */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-base font-bold text-slate-900">Customer Reviews Moderation</h2>
                <p className="text-xs text-slate-500">
                  Inspect genuine customer feedback and moderate inappropriate or non-compliant reviews
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search reviews by reviewer, product, title..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-56 sm:w-72 pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Rating filter */}
                <select
                  value={reviewRatingFilter}
                  onChange={(e) => setReviewRatingFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white font-medium outline-hidden cursor-pointer"
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            {/* Reviews Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Rating</th>
                      <th className="p-3">Review Details</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                          No reviews found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      reviews.map((r) => (
                        <tr key={r._id || r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 max-w-[200px]">
                            <div className="flex items-center gap-2">
                              {r.productImage ? (
                                <img
                                  src={r.productImage}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 object-contain rounded-lg bg-slate-50 p-0.5 border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                              <div className="truncate">
                                <strong className="text-slate-900 block truncate">{r.productName || r.productId}</strong>
                                <span className="text-[10px] text-slate-400 font-mono">#{r.productId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <strong className="text-slate-900 block">{r.userName}</strong>
                            <span className="text-[10px] text-slate-400">{r.userCity || 'India'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                  }`}
                                />
                              ))}
                              <span className="ml-1 text-[11px] font-bold text-slate-700 font-mono">
                                {r.rating}★
                              </span>
                            </div>
                          </td>
                          <td className="p-3 max-w-[280px]">
                            {r.title && <div className="font-bold text-slate-900 mb-0.5">{r.title}</div>}
                            <p className="text-slate-600 line-clamp-2">{r.comment}</p>
                          </td>
                          <td className="p-3">
                            {r.verifiedPurchase ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified Buyer
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                Public
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleModerateReview(r._id || r.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct ? 'Edit Product' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Title</label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editingProduct?.name || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    name="brand"
                    type="text"
                    required
                    defaultValue={editingProduct?.brand || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department / Category</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || 'smartphones'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden bg-white"
                  >
                    <option value="smartphones">Smartphones</option>
                    <option value="laptops">Laptops</option>
                    <option value="audio">Audio & TWS</option>
                    <option value="wearables">Wearables</option>
                    <option value="gaming">Gaming</option>
                    <option value="smarthome">Smart Home</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    name="price"
                    type="number"
                    required
                    defaultValue={editingProduct?.price || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Original MRP (₹)</label>
                  <input
                    name="originalPrice"
                    type="number"
                    defaultValue={editingProduct?.originalPrice || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Count</label>
                  <input
                    name="stockCount"
                    type="number"
                    defaultValue={editingProduct?.stockCount ?? 15}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  name="image"
                  type="url"
                  defaultValue={editingProduct?.images?.[0] || ''}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden text-[11px] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingProduct?.description || ''}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="inStock"
                    type="checkbox"
                    defaultChecked={editingProduct?.inStock ?? true}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">In Stock for Delivery</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    name="madeInIndia"
                    type="checkbox"
                    defaultChecked={editingProduct?.madeInIndia ?? false}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">🇮🇳 Made in India</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CATEGORY */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Unique Key (slug)</label>
                <input
                  name="key"
                  type="text"
                  required
                  disabled={Boolean(editingCategory?.key)}
                  defaultValue={editingCategory?.key || ''}
                  placeholder="e.g. smart-wearables"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Label</label>
                <input
                  name="label"
                  type="text"
                  required
                  defaultValue={editingCategory?.label || ''}
                  placeholder="e.g. Smart Wearables"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Icon Name</label>
                  <input
                    name="iconName"
                    type="text"
                    defaultValue={editingCategory?.iconName || 'LayoutGrid'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Display Sort Order</label>
                  <input
                    name="displayOrder"
                    type="number"
                    defaultValue={editingCategory?.displayOrder || 0}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-amber-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: ORDER DETAILS */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Order Inspection</span>
                <h3 className="font-mono font-bold text-slate-900 text-base">{selectedOrder.orderId}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage & Payment Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                  selectedOrder.paymentStatus === 'paid' ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Txn ID: {selectedOrder.zapupiTxnId || 'N/A'}
                </div>
                {selectedOrder.utr && (
                  <div className="text-[10px] text-slate-500 font-mono">
                    UTR: {selectedOrder.utr}
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Fulfillment Stage</span>
                <span className="font-bold text-slate-900 text-xs block">{selectedOrder.status}</span>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  AWB: {selectedOrder.trackingNumber || 'N/A'} ({selectedOrder.courier})
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="text-xs space-y-1">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Shipping Details</span>
              <strong className="text-slate-900 block">{selectedOrder.address?.fullName} ({selectedOrder.address?.phone})</strong>
              <p className="text-slate-600">
                {selectedOrder.address?.street}, {selectedOrder.address?.city}, {selectedOrder.address?.state} - {selectedOrder.address?.pincode}
              </p>
            </div>

            {/* Items */}
            <div className="text-xs space-y-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchased Items ({selectedOrder.items?.length})</span>
              {selectedOrder.items?.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-2.5 truncate">
                    {it.image && <img src={it.image} alt={it.name} className="w-8 h-8 object-contain rounded-md" />}
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">{it.name}</span>
                      <span className="text-[10px] text-slate-500">Qty: {it.quantity} • {it.brand}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatINR(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
              <span>Order Total (INR):</span>
              <span className="text-amber-600 font-mono text-base font-black">{formatINR(selectedOrder.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
