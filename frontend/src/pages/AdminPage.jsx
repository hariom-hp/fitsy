import { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductsContext';
import * as api from '../services/api';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Sparkles,
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ShoppingBag,
  BarChart3,
  Search,
  Filter,
  User,
  CheckCircle2,
  Truck,
  Eye,
  X,
  Save,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Wool Coat', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900' },
  { label: 'Denim Jacket', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900' },
  { label: 'Linen Shirt', url: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=900' },
  { label: 'Silk Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900' },
  { label: 'Denim Jeans', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900' },
];

export default function AdminPage() {
  const { products = [], addProduct, updateProduct, deleteProduct, refreshProducts, loading: productsLoading } = useProducts() || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('inventory'); // 'inventory' | 'orders' | 'customers' | 'analytics'

  // Modals & action state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Outerwear',
    price: '',
    inventory: '50',
    badge: 'New Arrival',
    vtoType: 'upper-body',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900',
    description: '',
  });

  const safeProducts = Array.isArray(products) ? products : [];
  const filteredProducts = safeProducts.filter(
    (p) =>
      p &&
      p.name &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Orders State
  const [adminOrders, setAdminOrders] = useState([
    {
      id: 'LX-84920',
      customer: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      date: 'Aug 10, 2026',
      total: 186.0,
      status: 'Shipped',
      items: 'Minimal Wool Coat (M)',
    },
    {
      id: 'LX-84919',
      customer: 'Sophia Chen',
      email: 'sophia.c@example.com',
      date: 'Aug 09, 2026',
      total: 245.0,
      status: 'Processing',
      items: 'Silk Midi Dress (S)',
    },
    {
      id: 'LX-84918',
      customer: 'Marcus Vance',
      email: 'm.vance@example.com',
      date: 'Aug 08, 2026',
      total: 92.0,
      status: 'Delivered',
      items: 'Contour Denim Jacket (L)',
    },
    {
      id: 'LX-84917',
      customer: 'Emma Watson',
      email: 'emma.w@example.com',
      date: 'Aug 07, 2026',
      total: 134.0,
      status: 'Delivered',
      items: 'Contour Blazer (XS)',
    },
  ]);

  // Customers State
  const [customersList, setCustomersList] = useState([
    {
      id: 1,
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      joined: 'Jan 2026',
      ordersCount: 4,
      totalSpent: 657.0,
      status: 'VIP Member',
      avatar: 'AJ',
    },
    {
      id: 2,
      name: 'Sophia Chen',
      email: 'sophia.c@example.com',
      joined: 'Mar 2026',
      ordersCount: 2,
      totalSpent: 420.0,
      status: 'Active',
      avatar: 'SC',
    },
    {
      id: 3,
      name: 'Marcus Vance',
      email: 'm.vance@example.com',
      joined: 'May 2026',
      ordersCount: 3,
      totalSpent: 310.0,
      status: 'Active',
      avatar: 'MV',
    },
    {
      id: 4,
      name: 'Emma Watson',
      email: 'emma.w@example.com',
      joined: 'Jul 2026',
      ordersCount: 1,
      totalSpent: 134.0,
      status: 'New User',
      avatar: 'EW',
    },
  ]);

  // ── Sync with live APIs when switching tabs ───────────────────────
  useEffect(() => {
    if (selectedTab === 'orders') {
      (async () => {
        const { data, error } = await api.orders.getAll();
        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted = data.map((o) => ({
            id: o._id || o.id,
            customer: o.user?.name || o.shippingDetails?.fullName || 'Registered User',
            email: o.user?.email || 'customer@fitsy.com',
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            total: Number(o.totalPrice) || 0,
            status: o.status || 'Processing',
            items: (o.items || []).map((it) => it.name || it.productId?.name || 'Garment').join(', ') || 'Fashion item',
          }));
          setAdminOrders(formatted);
        }
      })();
    } else if (selectedTab === 'customers') {
      (async () => {
        const { data, error } = await api.auth.getAllUsers();
        if (!error && Array.isArray(data) && data.length > 0) {
          const formatted = data.map((u, index) => ({
            id: u._id || u.id || index + 1,
            name: u.name || 'Fitsy Customer',
            email: u.email,
            joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026',
            ordersCount: u.isAdmin ? 0 : 2,
            totalSpent: u.isAdmin ? 0 : 240.0,
            status: u.isAdmin ? 'Admin' : 'Active',
            avatar: (u.name || 'User').split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
          }));
          setCustomersList(formatted);
        }
      })();
    }
  }, [selectedTab]);

  function showToast(msg) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  }

  // ── Add Product Handler ───────────────────────────────────────────
  async function handleAddProductSubmit(e) {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      alert('Please fill out Product Name and Price');
      return;
    }

    setIsSubmitting(true);
    try {
      if (addProduct) {
        const res = await addProduct(newProduct);
        if (res && res.success === false) {
          alert(res.error || 'Failed to add product');
          setIsSubmitting(false);
          return;
        }
      }
      setIsAddModalOpen(false);
      showToast(`Successfully added "${newProduct.name}" to store catalog!`);
      setNewProduct({
        name: '',
        category: 'Outerwear',
        price: '',
        inventory: '50',
        badge: 'New Arrival',
        vtoType: 'upper-body',
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900',
        description: '',
      });
    } catch (err) {
      console.error(err);
      alert('Error adding product');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Edit Product Handler ──────────────────────────────────────────
  async function handleEditProductSubmit(e) {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    try {
      if (updateProduct) {
        await updateProduct(editingProduct.id || editingProduct._id, editingProduct);
      }
      showToast(`Updated "${editingProduct.name}" details!`);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert('Error updating product');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete Product Handler ────────────────────────────────────────
  async function handleDeleteProduct(product) {
    if (window.confirm(`Are you sure you want to delete "${product.name}" from the catalog?`)) {
      try {
        if (deleteProduct) {
          await deleteProduct(product.id || product._id);
        }
        showToast(`Deleted "${product.name}" from store inventory.`);
      } catch (err) {
        console.error(err);
        alert('Error deleting product');
      }
    }
  }

  // ── Update Order Status ──────────────────────────────────────────
  async function handleOrderStatusChange(orderId, newStatus) {
    setAdminOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      if (orderId && !String(orderId).startsWith('LX-')) {
        await api.orders.updateStatus(orderId, newStatus);
      }
      showToast(`Order #${orderId} status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
      showToast(`Updated order locally to ${newStatus}`);
    }
  }

  // ── Toggle Customer Status ────────────────────────────────────────
  function handleToggleCustomerStatus(customerId) {
    setCustomersList((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const nextStatus =
            c.status === 'VIP Member' ? 'Active' : c.status === 'Active' ? 'Suspended' : 'VIP Member';
          showToast(`Updated ${c.name}'s status to ${nextStatus}`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20 relative">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {notification}
        </div>
      )}

      {/* ─── Admin Top Header ────────────────────────────────────────── */}
      <header className="bg-surface-container-low py-8 border-b border-outline-variant/30">
        <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <LayoutDashboard className="w-3.5 h-3.5" /> FITSY Platform Admin Portal
            </span>
            <h1 className="text-3xl font-extrabold font-sans text-on-surface tracking-tight">
              Store Administration &amp; Real-Time Inventory Control
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                if (refreshProducts) await refreshProducts();
                showToast('Store catalog synchronized with database.');
              }}
              className="px-4 py-2.5 rounded-full border border-outline-variant/60 hover:bg-surface-container text-on-surface font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              title="Refresh and sync catalog"
            >
              <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin text-primary' : 'text-on-surface-variant'}`} />
              <span>Sync Catalog</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Plus className="w-4 h-4" /> Add New Product
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop py-10 space-y-8">
        {/* ─── Top Metrics Ribbon ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant">Total Sales Volume</p>
              <p className="text-2xl font-black text-on-surface">$48,920.50</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 18.4% this month</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant">Try-On Conversion</p>
              <p className="text-2xl font-black text-on-surface">34.2%</p>
              <span className="text-[10px] font-bold text-emerald-600">↑ 12% boost from VTO</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant">Active Catalog Items</p>
              <p className="text-2xl font-black text-on-surface">{safeProducts.length}</p>
              <span className="text-[10px] font-bold text-primary">All Try-On Enabled</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-surface border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface-variant">AI Latency Rate</p>
              <p className="text-2xl font-black text-on-surface">0.84s</p>
              <span className="text-[10px] font-bold text-emerald-600">Sub-second rendering</span>
            </div>
          </div>
        </div>

        {/* ─── 4 Admin Navigation Tabs ────────────────────────────────── */}
        <div className="bg-surface border border-outline-variant/40 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-outline-variant/30 pb-4 mb-6 gap-4">
            <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => setSelectedTab('inventory')}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTab === 'inventory'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Package className="w-4 h-4" />
                Product Management ({filteredProducts.length})
              </button>

              <button
                onClick={() => setSelectedTab('orders')}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTab === 'orders'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Order Management ({adminOrders.length})
              </button>

              <button
                onClick={() => setSelectedTab('customers')}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTab === 'customers'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Users className="w-4 h-4" />
                Customer Management ({customersList.length})
              </button>

              <button
                onClick={() => setSelectedTab('analytics')}
                className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedTab === 'analytics'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                AI Analytics &amp; Logs
              </button>
            </div>

            {selectedTab === 'inventory' && (
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/40 rounded-full text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* ─── TAB 1: PRODUCT MANAGEMENT (ADD / EDIT / DELETE) ───────────── */}
          {selectedTab === 'inventory' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low">
                    <th className="p-3.5">Garment</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Stock</th>
                    <th className="p-3.5">VTO Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id || product._id}
                      className="border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors"
                    >
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover bg-surface-container shrink-0"
                        />
                        <div>
                          <p className="font-bold text-on-surface text-sm">{product.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">
                            {product.badge || 'Standard Catalog'}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-on-surface-variant">{product.category}</td>
                      <td className="p-3.5 font-bold text-primary text-sm">${product.price}</td>
                      <td className="p-3.5 font-semibold text-on-surface">
                        {product.inventory || 24} units
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Ready (98.4%)
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── TAB 2: ORDER MANAGEMENT ─────────────────────────────── */}
          {selectedTab === 'orders' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant font-medium">Total Orders</p>
                  <strong className="text-xl font-bold text-on-surface">{adminOrders.length}</strong>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900">
                  <p className="text-xs font-medium">Processing</p>
                  <strong className="text-xl font-bold">
                    {adminOrders.filter((o) => o.status === 'Processing').length} Active
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-900">
                  <p className="text-xs font-medium">In Transit / Shipped</p>
                  <strong className="text-xl font-bold">
                    {adminOrders.filter((o) => o.status === 'Shipped').length} Orders
                  </strong>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900">
                  <p className="text-xs font-medium">Delivered</p>
                  <strong className="text-xl font-bold">
                    {adminOrders.filter((o) => o.status === 'Delivered').length} Orders
                  </strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low">
                      <th className="p-3.5">Order Ref</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Order Items</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="p-3.5 font-bold text-on-surface">#{order.id}</td>
                        <td className="p-3.5">
                          <p className="font-bold text-on-surface">{order.customer}</p>
                          <p className="text-[10px] text-on-surface-variant">{order.email}</p>
                        </td>
                        <td className="p-3.5 font-medium text-on-surface-variant">{order.items}</td>
                        <td className="p-3.5 font-medium text-on-surface-variant">{order.date}</td>
                        <td className="p-3.5 font-extrabold text-primary">${order.total.toFixed(2)}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'Shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                            className="bg-surface-container-low border border-outline-variant/40 rounded-full px-3 py-1 text-xs font-bold text-on-surface focus:outline-none cursor-pointer"
                          >
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 3: CUSTOMER MANAGEMENT ──────────────────────────── */}
          {selectedTab === 'customers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant font-medium">Total Registered Users</p>
                  <strong className="text-3xl font-black text-on-surface">12,485</strong>
                </div>
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant font-medium">Active This Week</p>
                  <strong className="text-3xl font-black text-primary">3,291</strong>
                </div>
                <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs text-on-surface-variant font-medium">Average VTO Fit Rating</p>
                  <strong className="text-3xl font-black text-emerald-600">4.8 / 5.0 ★</strong>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold uppercase tracking-wider bg-surface-container-low">
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Joined Date</th>
                      <th className="p-3.5">Orders</th>
                      <th className="p-3.5">Total Spent</th>
                      <th className="p-3.5">Status Tier</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-outline-variant/20 hover:bg-surface-container-low/40 transition-colors"
                      >
                        <td className="p-3.5 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {c.avatar}
                          </div>
                          <strong className="text-sm font-bold text-on-surface">{c.name}</strong>
                        </td>
                        <td className="p-3.5 font-medium text-on-surface-variant">{c.email}</td>
                        <td className="p-3.5 font-medium text-on-surface-variant">{c.joined}</td>
                        <td className="p-3.5 font-bold text-on-surface">{c.ordersCount} Purchases</td>
                        <td className="p-3.5 font-black text-primary">${c.totalSpent.toFixed(2)}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              c.status === 'VIP Member'
                                ? 'bg-primary/10 text-primary'
                                : c.status === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-rose-500/10 text-rose-600'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleToggleCustomerStatus(c.id)}
                            className="px-3 py-1 rounded-full border border-outline-variant hover:bg-surface-container text-on-surface font-bold text-[11px] transition-all cursor-pointer"
                          >
                            Toggle Tier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAB 4: AI ANALYTICS & LOGS ───────────────────────────── */}
          {selectedTab === 'analytics' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs font-semibold text-on-surface-variant">Total VTO Render Sessions</p>
                  <p className="text-3xl font-black text-on-surface mt-1">124,592</p>
                  <span className="text-xs font-bold text-emerald-600 mt-2 block">↑ 24% month-over-month</span>
                </div>

                <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs font-semibold text-on-surface-variant">Average VTO Fit Accuracy</p>
                  <p className="text-3xl font-black text-primary mt-1">98.4%</p>
                  <span className="text-xs font-bold text-emerald-600 mt-2 block">Pose Landmark Calibrated</span>
                </div>

                <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30">
                  <p className="text-xs font-semibold text-on-surface-variant">Average Neural Render Latency</p>
                  <p className="text-3xl font-black text-on-surface mt-1">0.84s</p>
                  <span className="text-xs font-bold text-emerald-600 mt-2 block">GPU Accelerated</span>
                </div>
              </div>

              {/* Conversion Boost Bar Visual */}
              <div className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 space-y-4">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Try-On Conversion vs. Standard Catalog Browse
                </h3>
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Users Who Used AI Try-On</span>
                      <span className="text-primary font-black">34.2% Purchase Conversion</span>
                    </div>
                    <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                      <div className="bg-primary h-full rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>Standard Browse Only</span>
                      <span className="text-on-surface-variant">14.6% Purchase Conversion</span>
                    </div>
                    <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
                      <div className="bg-outline-variant h-full rounded-full" style={{ width: '29%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Try-On Real-Time Session Logs */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-on-surface">Recent Virtual Try-On AI Logs</h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-on-surface">Virtual Try-On Session #84920</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        User photo upload • Rendered Minimal Wool Coat (M) • Pose landmark warp complete
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                      98.4% Fit Score
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-on-surface">Virtual Try-On Session #84919</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Studio Model selection • Rendered Silk Midi Dress (S) • Garment mesh aligned
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                      97.8% Fit Score
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-on-surface">Virtual Try-On Session #84918</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        User photo upload • Rendered Contour Denim Jacket (L) • Geometric warp complete
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">
                      99.1% Fit Score
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ADD NEW PRODUCT MODAL ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
              <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add New Garment Product
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Product Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxe Tailored Trench Coat"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="129"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={newProduct.inventory}
                    onChange={(e) => setNewProduct({ ...newProduct, inventory: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">VTO Layer Type</label>
                  <select
                    value={newProduct.vtoType}
                    onChange={(e) => setNewProduct({ ...newProduct, vtoType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="upper-body">Upper Body (Jackets/Tops)</option>
                    <option value="lower-body">Lower Body (Pants/Jeans)</option>
                    <option value="dress">Full Dress</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Product Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Best Seller, Trending, New Arrival"
                  value={newProduct.badge}
                  onChange={(e) => setNewProduct({ ...newProduct, badge: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Image URL & Presets</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SAMPLE_IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setNewProduct({ ...newProduct, image: preset.url })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                        newProduct.image === preset.url
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
                {newProduct.image && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <img
                      src={newProduct.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-surface-container"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-[11px] text-on-surface-variant font-medium">Image Preview Ready</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Product Description</label>
                <textarea
                  rows="2"
                  placeholder="Garment details, fit notes, and fabric description..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-3 rounded-full border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-container shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Product
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT PRODUCT MODAL ───────────────────────────────────────── */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
              <h3 className="text-xl font-extrabold text-on-surface flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" /> Edit Garment Details
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProductSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Outerwear'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="Outerwear">Outerwear</option>
                    <option value="Tops">Tops</option>
                    <option value="Bottoms">Bottoms</option>
                    <option value="Dresses">Dresses</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Stock Count</label>
                <input
                  type="number"
                  value={editingProduct.inventory || 25}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, inventory: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Image URL</label>
                <input
                  type="url"
                  value={editingProduct.image || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-on-surface font-medium focus:outline-none focus:border-primary"
                />
                {editingProduct.image && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <img
                      src={editingProduct.image}
                      alt="Preview"
                      className="w-12 h-12 rounded-lg object-cover bg-surface-container"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="text-[11px] text-on-surface-variant font-medium">Garment Preview</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setEditingProduct(null)}
                  className="w-1/2 py-3 rounded-full border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-container shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
