import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Heart,
  Package,
  Trash2,
  User,
  Clock,
  RotateCcw,
  Sparkles,
  Ruler,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowRight,
  LogOut,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import * as api from '../services/api';

export default function AccountPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const { cartItems, wishlistItems, removeFromCart, updateCartQuantity, toggleWishlist, addToCart } = useStore();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  // Issue 7: Re-add all items from a past order to the cart
  const handleOrderAgain = async (order) => {
    setReorderingId(order._id);
    for (const item of order.items) {
      if (!item.productId) continue; // skip deleted products
      await addToCart({
        product: {
          id: item.productId._id,
          name: item.productId.name,
          price: item.price,
          image: item.productId.image,
        },
        size: item.size,
      });
    }
    setReorderingId(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        const { data, error } = await api.orders.getMyOrders();
        if (error) {
          setOrdersError(error);
        } else {
          setOrders(data || []);
        }
        setLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  // Fallback guard in case ProtectedRoute is bypassed
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen py-10 px-4 md:px-margin-desktop">
      <div className="max-w-container-max mx-auto flex flex-col gap-8">
        
        {/* ─── Stitch User Profile Header ───────────────────────────────── */}
        <section className="flex flex-col md:flex-row items-center md:items-start gap-8 bg-surface-container-lowest p-8 rounded-3xl shadow-md border border-outline-variant/40">
          <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface-container-low shrink-0 bg-primary/10 flex items-center justify-center text-primary font-bold text-3xl shadow-inner">
            {user?.name ? (
              <span className="text-4xl font-extrabold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={48} className="text-primary" />
            )}
          </div>
          
          <div className="flex-grow text-center md:text-left flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
                {user?.name || 'Valued Member'}
              </h1>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold self-center md:self-auto">
                <Sparkles className="w-3.5 h-3.5" />
                FITSY Premium Member
              </span>
              {user?.isAdmin && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold self-center md:self-auto">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Administrator
                </span>
              )}
            </div>
            
            <p className="text-on-surface-variant text-sm md:text-base mb-6 font-medium">
              {user?.email}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {user?.isAdmin && (
                <Link
                  to="/admin"
                  className="bg-primary hover:bg-primary-container text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" /> Open Admin Portal
                </Link>
              )}
              <Link
                to="/catalog"
                className="bg-surface-container-low hover:bg-surface-container border border-outline-variant/60 text-on-surface px-6 py-2.5 rounded-full text-xs font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-primary" /> Keep Shopping
              </Link>
              <button
                type="button"
                onClick={logout}
                className="border border-outline-variant text-on-surface hover:bg-surface-container px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-error" /> Log Out
              </button>
            </div>
          </div>
        </section>

        {/* ─── Dashboard Stats Ribbon ────────────────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Account Email</p>
              <strong className="text-sm md:text-base font-bold text-on-surface truncate block max-w-[150px]">
                {user?.email}
              </strong>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Past Purchases</p>
              <strong className="text-lg md:text-xl font-bold text-on-surface">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </strong>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Active Cart Bag</p>
              <strong className="text-lg md:text-xl font-bold text-on-surface">
                {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
              </strong>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-medium">Saved Wishlist</p>
              <strong className="text-lg md:text-xl font-bold text-on-surface">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'Product' : 'Products'}
              </strong>
            </div>
          </div>
        </section>

        {/* ─── Main Grid: Smart Fit + Order Tracker + Cart & Wishlist ──── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (5 cols): Smart Fit Profile & Active Orders */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Smart Fit Profile Card */}
            <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-primary" />
                  Smart Fit Profile
                </h2>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  98.4% Accuracy Verified
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                  <p className="text-xs font-medium text-on-surface-variant mb-1">Height</p>
                  <p className="text-base md:text-lg font-bold text-on-surface">5'10"</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                  <p className="text-xs font-medium text-on-surface-variant mb-1">Chest</p>
                  <p className="text-base md:text-lg font-bold text-on-surface">38"</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                  <p className="text-xs font-medium text-on-surface-variant mb-1">Waist</p>
                  <p className="text-base md:text-lg font-bold text-on-surface">32"</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                  <p className="text-xs font-medium text-on-surface-variant mb-1">Hips</p>
                  <p className="text-base md:text-lg font-bold text-on-surface">40"</p>
                </div>
              </div>

              <Link
                to="/catalog"
                className="w-full border-2 border-primary text-primary px-4 py-3 rounded-full text-xs font-bold flex justify-center items-center gap-2 hover:bg-primary hover:text-white transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                Recalibrate Fit Profile with AI
              </Link>
            </section>

            {/* Order History with Visual Tracker */}
            <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary" />
                  Your Order History
                </h2>
              </div>

              {loadingOrders ? (
                <div className="p-8 text-center text-on-surface-variant text-sm font-medium">
                  Loading order history...
                </div>
              ) : ordersError ? (
                <div className="p-4 rounded-2xl bg-error/10 text-error text-sm font-semibold">
                  Failed to load orders: {ordersError}
                </div>
              ) : orders.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm font-medium bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  You haven't placed any orders yet.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {orders.map((order) => (
                    <div
                      key={order._id}
                      className="border border-outline-variant/50 rounded-2xl overflow-hidden bg-surface shadow-xs"
                    >
                      {/* Order Header */}
                      <div className="bg-surface-container-low p-4 flex justify-between items-center border-b border-outline-variant/40">
                        <div>
                          <strong className="block text-sm font-bold text-on-surface">
                            Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                          </strong>
                          <span className="text-xs text-on-surface-variant">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="block text-base font-extrabold text-primary">
                            ${order.totalPrice.toFixed(2)}
                          </strong>
                          <span
                            className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-0.5 ${
                              order.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Order Progress Tracker */}
                      <div className="p-4 border-b border-outline-variant/30 bg-surface-container-lowest">
                        <div className="overflow-hidden h-1.5 mb-3 rounded-full bg-surface-container-high flex">
                          <div
                            className="bg-primary rounded-full transition-all duration-500"
                            style={{
                              width:
                                order.status === 'Delivered'
                                  ? '100%'
                                  : order.status === 'Shipped'
                                  ? '75%'
                                  : '35%',
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold text-on-surface-variant">
                          <span className="text-primary">Ordered</span>
                          <span className="text-primary">Processing</span>
                          <span className={order.status === 'Shipped' || order.status === 'Delivered' ? 'text-primary font-bold' : ''}>
                            Shipped
                          </span>
                          <span className={order.status === 'Delivered' ? 'text-emerald-600 font-bold' : ''}>
                            Delivered
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-4 flex flex-col gap-3">
                        {order.items.length === 0 ? (
                          <p className="text-xs text-on-surface-variant italic">
                            ⚠️ Items in this order are no longer available.
                          </p>
                        ) : (
                          order.items.map((item) => (
                            <div key={`${item.productId?._id}-${item.size}`} className="flex gap-3 items-center">
                              <img
                                src={item.productId?.image}
                                alt={item.productId?.name}
                                className="w-14 h-14 object-cover rounded-xl bg-surface-container shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <strong className="text-xs md:text-sm font-bold text-on-surface block truncate">
                                  {item.productId?.name}
                                </strong>
                                <span className="text-xs text-on-surface-variant">
                                  Size: {item.size} · Qty: {item.quantity}
                                </span>
                              </div>
                              <strong className="text-xs md:text-sm font-bold text-on-surface">
                                ${(item.price * item.quantity).toFixed(2)}
                              </strong>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Shipping details + Order Again CTA */}
                      <div className="bg-surface-container-low p-4 border-t border-outline-variant/30 text-xs text-on-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary shrink-0" />
                          <span>
                            <strong>Shipped to: </strong>
                            {order.shippingDetails?.fullName}, {order.shippingDetails?.city}
                            {order.shippingDetails?.phoneNumber && (
                              <> · 📞 {order.shippingDetails.phoneNumber}</>
                            )}
                          </span>
                        </div>

                        {order.items.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOrderAgain(order)}
                            disabled={reorderingId === order._id}
                            className="px-3.5 py-1.5 rounded-full border border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {reorderingId === order._id ? 'Reordering...' : 'Order Again'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right Column (7 cols): Cart / Shopping Bag & Saved Wishlist */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Active Shopping Bag */}
            <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Your Active Shopping Bag
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm font-medium bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  Your shopping bag is empty right now.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-outline-variant/40 bg-surface shadow-xs"
                    >
                      <ProductImage
                        product={item}
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-surface-container shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm font-bold text-on-surface truncate">
                          <Link to={`/product/${item.productId}`} className="hover:text-primary transition-colors">
                            {item.name}
                          </Link>
                        </strong>
                        <span className="text-xs text-on-surface-variant block mb-2">
                          Size: {item.size}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg border border-outline-variant text-on-surface flex items-center justify-center text-xs font-bold hover:bg-surface-container cursor-pointer"
                            onClick={() =>
                              updateCartQuantity({
                                productId: item.productId,
                                size: item.size,
                                quantity: item.quantity - 1,
                              })
                            }
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-on-surface px-2">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg border border-outline-variant text-on-surface flex items-center justify-center text-xs font-bold hover:bg-surface-container cursor-pointer"
                            onClick={() =>
                              updateCartQuantity({
                                productId: item.productId,
                                size: item.size,
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <strong className="text-base font-extrabold text-on-surface">
                          ${(item.price * item.quantity).toFixed(2)}
                        </strong>
                        <button
                          type="button"
                          className="p-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                          onClick={() =>
                            removeFromCart({ productId: item.productId, size: item.size })
                          }
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 pt-4 border-t border-outline-variant/40 flex flex-col gap-4">
                    <div className="flex justify-between items-center text-on-surface">
                      <span className="text-sm font-semibold">Total Order Subtotal</span>
                      <strong className="text-xl font-black text-primary">
                        ${cartItems
                          .reduce((total, item) => total + item.price * item.quantity, 0)
                          .toFixed(2)}
                      </strong>
                    </div>
                    <Link
                      to="/checkout"
                      className="w-full bg-primary hover:bg-primary-container text-white py-3.5 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all text-center flex items-center justify-center gap-2"
                    >
                      Proceed to Checkout <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Saved Wishlist Products */}
            <section className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Saved Wishlist Products
                </h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-sm font-medium bg-surface-container-low rounded-2xl border border-outline-variant/30">
                  You have no saved wishlist products yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.productId}
                      className="p-4 rounded-2xl border border-outline-variant/40 bg-surface shadow-xs flex items-center gap-4 group"
                    >
                      <ProductImage
                        product={item}
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-xl bg-surface-container shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <strong className="block text-sm font-bold text-on-surface truncate">
                          <Link to={`/product/${item.productId}`} className="hover:text-primary transition-colors">
                            {item.name}
                          </Link>
                        </strong>
                        <span className="text-xs text-on-surface-variant block">
                          {item.category}
                        </span>
                        <strong className="text-xs font-bold text-primary block mt-1">
                          ${item.price.toFixed(2)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors shrink-0 cursor-pointer"
                        onClick={() =>
                          toggleWishlist({
                            product: {
                              id: item.productId,
                              name: item.name,
                              price: item.price,
                              image: item.image,
                              category: item.category,
                            },
                          })
                        }
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

        </div>

      </div>
    </div>
  );
}
