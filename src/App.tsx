import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FestiveBanner } from './components/FestiveBanner';
import { CategoryFilterBar } from './components/CategoryFilterBar';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrdersModal } from './components/OrdersModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAccessDenied } from './components/AdminAccessDenied';
import { Footer } from './components/Footer';

import { PRODUCTS } from './data/products';
import { Product, CartItem, Order, FilterOptions, CategoryKey, AuthUser } from './types';
import { TEST_COUPONS } from './utils/format';
import { Sparkles, ShoppingBag, Heart, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export default function App() {
  // Pincode state
  const [selectedPincode, setSelectedPincode] = useState<string>(() => {
    return localStorage.getItem('bazaaro_pincode') || '110001';
  });

  // Cart State (persisted in localStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bazaaro_cart');
      return saved ? JSON.parse(saved) : [
        // Pre-fill with a popular item for immediate demonstration delight
        { product: PRODUCTS[0], quantity: 1 }
      ];
    } catch {
      return [{ product: PRODUCTS[0], quantity: 1 }];
    }
  });

  // Wishlist State
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('bazaaro_wishlist');
      return saved ? JSON.parse(saved) : [PRODUCTS[1], PRODUCTS[4]];
    } catch {
      return [];
    }
  });

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('bazaaro_orders');
      if (saved) return JSON.parse(saved);
      // Pre-seed a realistic completed sample order for Indian context
      return [
        {
          id: 'BZ-IND-2026-4819',
          date: 'Yesterday, 3:45 PM',
          items: [{ product: PRODUCTS[9], quantity: 1 }],
          subtotal: 9990,
          discount: 7491,
          couponDiscount: 0,
          deliveryFee: 0,
          gstAmount: 381,
          total: 2499,
          address: {
            fullName: 'Rahul Sharma',
            phone: '9876543210',
            street: '12th Cross, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            type: 'home',
          },
          paymentMethod: 'Razorpay Test (UPI / Google Pay)',
          paymentId: 'pay_test_892k39a',
          status: 'Packed',
          courier: 'BlueDart Air Express',
          trackingNumber: 'BD74910284IN',
          estimatedDeliveryDate: 'Expected Tomorrow by 2:00 PM',
        },
      ];
    } catch {
      return [];
    }
  });

  // Modals & Drawers visibility
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Authentication state (persisted in localStorage)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('bazaaro_token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('bazaaro_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Admin View routing state
  const [isAdminView, setIsAdminView] = useState<boolean>(() => {
    return (
      window.location.pathname === '/admin' ||
      window.location.hash === '#admin'
    );
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminView(
        window.location.pathname === '/admin' ||
        window.location.hash === '#admin'
      );
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Helpers to fetch user's cart and wishlist from MongoDB
  const fetchUserCart = (authToken: string) => {
    fetch('/api/cart', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.cart && Array.isArray(data.cart.items)) {
          setCart(data.cart.items);
        }
      })
      .catch(() => {});
  };

  const fetchUserWishlist = (authToken: string) => {
    fetch('/api/wishlist', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
        }
      })
      .catch(() => {});
  };

  const fetchUserOrders = (authToken: string) => {
    fetch('/api/orders', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.orders)) {
          const formatted: Order[] = data.orders.map((o: any) => ({
            id: o.orderId,
            date: new Date(o.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            items: o.items.map((i: any) => ({
              product: {
                id: i.productId,
                name: i.name,
                brand: i.brand,
                price: i.price,
                images: i.image ? [i.image] : [],
              } as any,
              quantity: i.quantity,
            })),
            subtotal: o.subtotal,
            discount: o.discount || 0,
            couponDiscount: o.couponDiscount || 0,
            couponCode: o.couponCode,
            deliveryFee: o.deliveryFee || 0,
            gstAmount: o.gstAmount || 0,
            total: o.total,
            address: o.address,
            paymentMethod: o.paymentMethod,
            paymentId: o.paymentId,
            paymentStatus: o.paymentStatus,
            status: o.status,
            courier: o.courier,
            trackingNumber: o.trackingNumber,
            estimatedDeliveryDate: o.estimatedDeliveryDate,
          }));
          setOrders(formatted);
        }
      })
      .catch(() => {});
  };

  // Verify and sync user profile, cart, wishlist, and orders on startup if token is present
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.user) {
            setUser(data.user);
            localStorage.setItem('bazaaro_user', JSON.stringify(data.user));
            fetchUserCart(token);
            fetchUserWishlist(token);
            fetchUserOrders(token);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('bazaaro_token');
            localStorage.removeItem('bazaaro_user');
          }
        })
        .catch(() => {});
    }
  }, [token]);

  const handleAuthSuccess = (newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('bazaaro_user', JSON.stringify(newUser));
    localStorage.setItem('bazaaro_token', newToken);
    fetchUserCart(newToken);
    fetchUserWishlist(newToken);
    fetchUserOrders(newToken);
    showToast(`Welcome back, ${newUser.name}!`);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bazaaro_user');
    localStorage.removeItem('bazaaro_token');
    setCart([]);
    setWishlist([]);
    setOrders([]);
    localStorage.removeItem('bazaaro_cart');
    localStorage.removeItem('bazaaro_wishlist');
    localStorage.removeItem('bazaaro_orders');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    showToast('Signed out successfully');
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Could not cancel order');
        return;
      }
      showToast(`Order #${orderId} has been cancelled`);
      fetchUserOrders(token);
    } catch {
      showToast('Failed to cancel order');
    }
  };

  const handlePayOrder = async (orderId: string) => {
    if (!token) return;
    try {
      showToast('Generating ZapUPI payment session...');
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        showToast(data.error || 'Failed to start payment');
        return;
      }
      window.location.href = data.paymentUrl;
    } catch {
      showToast('Network error initiating payment');
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!token) return;
    try {
      showToast('Verifying payment with ZapUPI...');
      const res = await fetch('/api/payment/verify-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Verification failed');
        return;
      }
      if (data.paymentStatus === 'paid') {
        showToast('Payment verified! Order is confirmed.');
      } else if (data.paymentStatus === 'failed') {
        showToast('Payment status is recorded as failed.');
      } else {
        showToast(data.message || 'Payment is still pending on gateway.');
      }
      fetchUserOrders(token);
    } catch {
      showToast('Network error verifying payment');
    }
  };

  // Check URL return params after ZapUPI redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnOrderId = params.get('order_id') || params.get('orderId');
    if (returnOrderId && token) {
      handleVerifyPayment(returnOrderId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('BAZAARO10');

  // Filter & Search state
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    searchQuery: '',
    brand: '',
    minPrice: 0,
    maxPrice: 200000,
    sortBy: 'featured',
    onlyInStock: false,
    onlyMadeInIndia: false,
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Sync guest cart & wishlist to localStorage
  useEffect(() => {
    if (!token) {
      localStorage.setItem('bazaaro_cart', JSON.stringify(cart));
    }
  }, [cart, token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem('bazaaro_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, token]);

  useEffect(() => {
    localStorage.setItem('bazaaro_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bazaaro_pincode', selectedPincode);
  }, [selectedPincode]);

  // Cart operations (with MongoDB synchronization for authenticated users)
  const handleAddToCart = async (product: Product) => {
    if (token) {
      try {
        const res = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Could not add to bag');
          return;
        }
        if (data.cart && Array.isArray(data.cart.items)) {
          setCart(data.cart.items);
        }
        showToast(`Added "${product.name.slice(0, 24)}..." to Bag`);
      } catch {
        showToast('Network error syncing cart');
      }
    } else {
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
      showToast(`Added "${product.name.slice(0, 24)}..." to Bag`);
    }
  };

  const handleBuyNow = (product: Product) => {
    handleAddToCart(product);
    setSelectedProduct(null);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = async (productId: string, quantity: number) => {
    if (token) {
      try {
        const res = await fetch(`/api/cart/items/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || 'Could not update bag');
          return;
        }
        if (data.cart && Array.isArray(data.cart.items)) {
          setCart(data.cart.items);
        }
      } catch {
        showToast('Network error updating cart');
      }
    } else {
      if (quantity <= 0) {
        handleRemoveCartItem(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
    }
  };

  const handleRemoveCartItem = async (productId: string) => {
    if (token) {
      try {
        const res = await fetch(`/api/cart/items/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.cart && Array.isArray(data.cart.items)) {
          setCart(data.cart.items);
        }
        showToast('Item removed from bag');
      } catch {
        showToast('Network error removing item');
      }
    } else {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      showToast('Item removed from bag');
    }
  };

  // Wishlist toggle (with MongoDB synchronization for authenticated users)
  const handleToggleWishlist = async (product: Product) => {
    const exists = wishlist.some((p) => p.id === product.id);
    if (token) {
      try {
        if (exists) {
          const res = await fetch(`/api/wishlist/${product.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.wishlist) setWishlist(data.wishlist);
          showToast('Removed from Wishlist');
        } else {
          const res = await fetch(`/api/wishlist/${product.id}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.wishlist) setWishlist(data.wishlist);
          showToast(`Added "${product.name.slice(0, 24)}..." to Wishlist`);
        }
      } catch {
        showToast('Network error syncing wishlist');
      }
    } else {
      setWishlist((prev) => {
        if (exists) {
          showToast('Removed from Wishlist');
          return prev.filter((p) => p.id !== product.id);
        } else {
          showToast(`Added "${product.name.slice(0, 24)}..." to Wishlist`);
          return [...prev, product];
        }
      });
    }
  };

  // Coupon handling
  const handleApplyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    const coupon = TEST_COUPONS[upper];
    if (!coupon) return false;

    const itemsSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    if (itemsSubtotal >= coupon.minSpend) {
      setAppliedCoupon(upper);
      return true;
    }
    return false;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  // Order placed
  const handleOrderPlaced = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    if (token) {
      fetch('/api/cart', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  // Live database products state
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbBrands, setDbBrands] = useState<string[]>([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // Fetch live products from MongoDB API
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.searchQuery) params.append('search', filters.searchQuery);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.onlyInStock) params.append('onlyInStock', 'true');
    if (filters.onlyMadeInIndia) params.append('onlyMadeInIndia', 'true');

    fetch(`/api/products?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch products from API');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.products)) {
          setDbProducts(data.products);
          setIsDbLoaded(true);
          if (Array.isArray(data.availableBrands) && data.availableBrands.length > 0) {
            setDbBrands(data.availableBrands);
          }
        }
      })
      .catch((err) => {
        console.warn('API error, falling back to local catalog:', err.message);
      });
  }, [filters]);

  // Local fallback filter & sort if database query is pending or offline
  const localFilteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      if (filters.category !== 'all' && product.category !== filters.category) return false;
      if (filters.brand && product.brand !== filters.brand) return false;
      if (filters.onlyMadeInIndia && !product.madeInIndia) return false;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchName = product.name.toLowerCase().includes(q);
        const matchBrand = product.brand.toLowerCase().includes(q);
        const matchCategory = product.category.toLowerCase().includes(q);
        const matchTags = product.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchBrand && !matchCategory && !matchTags) return false;
      }
      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'discount') return b.discountPercent - a.discountPercent;
      return 0;
    });
  }, [filters]);

  // Primary data source is MongoDB (dbProducts), with safe fallback
  const displayedProducts = isDbLoaded ? dbProducts : localFilteredProducts;

  // Available brands list
  const availableBrands = useMemo(() => {
    if (dbBrands.length > 0) return dbBrands;
    const brandsSet = new Set<string>();
    PRODUCTS.forEach((p) => brandsSet.add(p.brand));
    return Array.from(brandsSet);
  }, [dbBrands]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    // Fetch live details from MongoDB API
    fetch(`/api/products/${product.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.product) {
          setSelectedProduct(data.product);
        }
      })
      .catch(() => {});
  };

  // Cart financial computations
  const cartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartMRP = cart.reduce((sum, i) => sum + i.product.originalPrice * i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartDiscount = cartMRP - cartSubtotal;

  let couponDiscount = 0;
  if (appliedCoupon && TEST_COUPONS[appliedCoupon]) {
    const cp = TEST_COUPONS[appliedCoupon];
    if (cartSubtotal >= cp.minSpend) {
      if (cp.discountPercent) {
        couponDiscount = Math.round((cartSubtotal * cp.discountPercent) / 100);
      } else if (cp.flatDiscount) {
        couponDiscount = cp.flatDiscount;
      }
    }
  }

  const deliveryFee = cartSubtotal >= 499 || cart.length === 0 ? 0 : 70;
  const cartTotal = Math.max(0, cartSubtotal - couponDiscount + deliveryFee);

  if (isAdminView) {
    if (token && user?.role === 'admin') {
      return (
        <AdminDashboard
          token={token}
          user={user}
          onBackToStore={() => {
            setIsAdminView(false);
            window.history.pushState({}, '', '/');
          }}
        />
      );
    }
    return (
      <>
        <AdminAccessDenied
          onBackToStore={() => {
            setIsAdminView(false);
            window.history.pushState({}, '', '/');
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-amber-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        cartCount={cartItemsCount}
        cartTotal={cartSubtotal}
        wishlistCount={wishlist.length}
        selectedPincode={selectedPincode}
        onPincodeChange={setSelectedPincode}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        searchQuery={filters.searchQuery}
        onSearchChange={(q) => setFilters({ ...filters, searchQuery: q })}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          setIsAdminView(true);
          window.history.pushState({}, '', '/admin');
        }}
      />

      {/* Hero Festive Banner */}
      <FestiveBanner />

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Category & Filter Navigation */}
        <CategoryFilterBar
          filters={filters}
          onFilterChange={setFilters}
          availableBrands={availableBrands}
          totalResults={displayedProducts.length}
        />

        {/* Product Grid */}
        {displayedProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Electronics Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any gadgets matching your filter criteria. Try searching for "smartphones", "laptops", or clear filters.
            </p>
            <button
              onClick={() =>
                setFilters({
                  category: 'all',
                  searchQuery: '',
                  brand: '',
                  minPrice: 0,
                  maxPrice: 200000,
                  sortBy: 'featured',
                  onlyInStock: false,
                  onlyMadeInIndia: false,
                })
              }
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.some((p) => p.id === product.id)}
                onToggleWishlist={handleToggleWishlist}
                onAddToCart={handleAddToCart}
                onSelectProduct={handleSelectProduct}
              />
            ))}
          </div>
        )}
      </main>

      {/* Floating AI Dost Button (Always reachable for instant shopping guidance) */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => setIsAiChatOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs rounded-full shadow-xl shadow-amber-500/25 border-2 border-white hover:scale-105 transition-all cursor-pointer group"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="animate-ping absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-white text-[11px] leading-tight font-extrabold">Bazaaro AI Dost</div>
            <div className="text-[10px] text-amber-100 font-medium">Ask specs & deals</div>
          </div>
        </button>
      </div>

      {/* Drawers & Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlist.some((p) => p.id === selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        currentPincode={selectedPincode}
        token={token}
        user={user}
        onRequireAuth={() => setIsAuthOpen(true)}
        onProductUpdated={(updated) => {
          setSelectedProduct(updated);
          setDbProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        subtotal={cartMRP}
        discount={cartDiscount}
        couponDiscount={couponDiscount}
        couponCode={appliedCoupon || undefined}
        deliveryFee={deliveryFee}
        total={cartTotal}
        onOrderPlaced={handleOrderPlaced}
        token={token}
        onRequireAuth={() => setIsAuthOpen(true)}
      />

      <OrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        onCancelOrder={handleCancelOrder}
        onPayOrder={handlePayOrder}
        onVerifyPayment={handleVerifyPayment}
      />

      <AiAssistantDrawer
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        products={displayedProducts}
        onSelectProduct={(p) => {
          handleSelectProduct(p);
        }}
        onAddToCart={handleAddToCart}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
