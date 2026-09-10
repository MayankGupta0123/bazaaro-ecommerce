import React, { useState } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  MapPin,
  Sparkles,
  Package,
  X,
  ChevronDown,
  User as UserIcon,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/format';
import { POPULAR_PINCODES } from '../data/products';
import { BazaaroLogo } from './BazaaroLogo';
import { AuthUser } from '../types';

interface NavbarProps {
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  selectedPincode: string;
  onPincodeChange: (pincode: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenAiChat: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  user?: AuthUser | null;
  onOpenAuth?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotal,
  wishlistCount,
  selectedPincode,
  onPincodeChange,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenAiChat,
  searchQuery,
  onSearchChange,
  user = null,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
}) => {
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [tempPincode, setTempPincode] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentPincodeInfo = POPULAR_PINCODES[selectedPincode] || {
    city: 'New Delhi',
    state: 'Delhi NCR',
    days: 1,
  };

  const handleApplyPincode = (code: string) => {
    if (code.length === 6 && /^\d+$/.test(code)) {
      onPincodeChange(code);
      setIsPincodeModalOpen(false);
      setPincodeError('');
    } else {
      setPincodeError('Please enter a valid 6-digit Indian PIN code');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro-bar for Indian Festive Offerings & Trust signals */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⚡ DHAMAKA SALE
            </span>
            <span className="hidden sm:inline text-slate-300">
              Instant 10% Off on HDFC & ICICI Cards • No Cost EMI up to 12 Months
            </span>
            <span className="sm:hidden text-slate-300">
              Festive Deals in INR • Free Delivery 499+
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <button
              onClick={() => setIsPincodeModalOpen(true)}
              className="flex items-center gap-1 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Deliver to: <strong className="text-white">{currentPincodeInfo.city.split(' ')[0]} {selectedPincode}</strong></span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> 100% Genuine Brand Warranty
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Tagline (Aesthetic Modern Desi Emblem) */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className="flex items-center">
              <BazaaroLogo size="md" theme="light" showTagline={true} />
            </a>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search smartphones, M3 MacBook, ANC earbuds, gaming gear..."
                className="w-full pl-10 pr-9 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-full text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* AI Assistant Button */}
            <button
              onClick={onOpenAiChat}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:from-amber-600 hover:to-orange-700 transition-all cursor-pointer group"
              title="Chat with Bazaaro AI Dost"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span className="hidden md:inline">AI Shopping Guru</span>
              <span className="md:hidden">AI</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
            </button>

            {/* Orders Tracking */}
            <button
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
              title="Track Orders"
            >
              <Package className="w-4 h-4 text-slate-600" />
              <span className="hidden lg:inline">Orders</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 rounded-full text-slate-700 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">
                {cartTotal > 0 ? formatINR(cartTotal) : 'Cart'}
              </span>
            </button>

            {/* User Account / Auth Button */}
            {user ? (
              <div className="flex items-center gap-2">
                {user.role === 'admin' && onOpenAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs transition-colors cursor-pointer border border-slate-700 shadow-xs"
                    title="Open Admin Management Console"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Portal</span>
                  </button>
                )}

                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
                      {user.name ? user.name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
                    {user.role === 'admin' && (
                      <span className="hidden sm:inline text-[9px] px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="font-bold text-slate-900 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-amber-600" /> Administrator
                              </>
                            ) : (
                              '👤 Customer'
                            )}
                          </span>
                        </div>
                      </div>

                      {user.role === 'admin' && onOpenAdmin && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full text-left px-3 py-2 bg-amber-50/60 hover:bg-amber-100/70 flex items-center gap-2 text-amber-900 font-bold cursor-pointer border-b border-amber-100"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>My Orders</span>
                      </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onLogout) onLogout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 flex items-center gap-2 text-rose-600 cursor-pointer border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all cursor-pointer border border-slate-200"
                title="Sign In / Register"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 sm:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search phones, laptops, earbuds..."
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 border border-slate-200 focus:border-amber-500 rounded-full text-xs text-slate-900 placeholder:text-slate-400 outline-hidden"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Indian Pincode Selector Modal */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">Choose Delivery Location</h3>
              </div>
              <button
                onClick={() => setIsPincodeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mt-3 mb-4">
              Enter an Indian 6-digit PIN code to check real-time express delivery dates, local warehouse availability, and COD status.
            </p>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                maxLength={6}
                value={tempPincode}
                onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit PIN code (e.g. 560001)"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
              />
              <button
                onClick={() => handleApplyPincode(tempPincode)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Apply
              </button>
            </div>
            {pincodeError && <p className="text-xs text-rose-600 mb-3">{pincodeError}</p>}

            <div className="mt-4">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Popular Metro Hubs (1-2 Day Express Delivery):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(POPULAR_PINCODES).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => handleApplyPincode(code)}
                    className={`text-left p-2 rounded-lg border text-xs transition-all ${
                      selectedPincode === code
                        ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold">{info.city.split(' ')[0]}</div>
                    <div className="text-[11px] text-slate-500">PIN: {code}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
