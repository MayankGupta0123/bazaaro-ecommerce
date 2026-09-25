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
    <header className="sticky top-0 z-40 bg-bazaaro-dark/95 backdrop-blur-md border-b border-bazaaro-border/60 shadow-xs">
      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className="flex items-center">
              <BazaaroLogo size="md" theme="dark" showTagline={true} />
            </a>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden sm:block">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search smartphones, laptops, audio..."
                className="w-full pl-11 pr-9 py-2.5 bg-bazaaro-surface border border-bazaaro-border focus:border-cyan-600 rounded-full text-sm text-slate-200 placeholder:text-slate-500 transition-colors outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-cyan-500 absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Orders Tracking */}
            <button
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-full text-slate-300 hover:text-white transition-colors text-xs font-medium cursor-pointer"
              title="Track Orders"
            >
              <Package className="w-4 h-4 text-slate-400" />
              <span className="hidden lg:inline">Orders</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-cyan-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-bazaaro-dark">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 hover:bg-white text-slate-900 text-xs font-medium transition-all cursor-pointer group"
              title="View Cart"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-bazaaro-dark text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-1 ring-slate-100">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-semibold">
                {cartTotal > 0 ? formatINR(cartTotal) : 'Cart'}
              </span>
            </button>

            {/* User Profile / Auth */}
            <div className="relative border-l border-bazaaro-border/50 pl-1.5 sm:pl-3 ml-0 sm:ml-1 hidden sm:block">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-bazaaro-border hover:bg-bazaaro-surface-hover transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs uppercase">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[80px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-bazaaro-surface rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.8)] border border-bazaaro-border py-2 z-50">
                      <div className="px-4 py-3 border-b border-bazaaro-border">
                        <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      </div>
                      
                      {user.role === 'admin' && onOpenAdmin && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAdmin();
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-cyan-400 hover:bg-bazaaro-surface-hover cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Control Panel</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-bazaaro-surface-hover flex items-center gap-2 text-slate-300 cursor-pointer text-sm"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        <span>My Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-bazaaro-surface-hover flex items-center gap-2 text-rose-400 cursor-pointer border-t border-bazaaro-border text-sm mt-1 pt-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Disconnect</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-colors text-xs font-semibold cursor-pointer"
                  title="Sign In / Register"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 sm:hidden">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-full pl-9 pr-8 py-2 bg-bazaaro-surface border border-bazaaro-border focus:border-slate-500 rounded-full text-xs text-slate-200 placeholder:text-slate-500 outline-hidden transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-slate-200 absolute left-3 top-1/2 -translate-y-1/2 transition-colors" />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pincode Modal */}
      {isPincodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bazaaro-dark/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-bazaaro-surface border border-bazaaro-border rounded-2xl p-6 w-full max-w-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Choose Delivery Location
              </h3>
              <button
                onClick={() => setIsPincodeModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-1 rounded-full hover:bg-bazaaro-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">
              Enter your Indian pincode to see product availability and delivery options.
            </p>

            <div className="mb-4">
              <input
                type="text"
                maxLength={6}
                value={tempPincode}
                onChange={(e) => setTempPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Pincode (e.g. 110001)"
                className="w-full px-4 py-2 bg-bazaaro-dark border border-bazaaro-border rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-slate-200 outline-hidden font-mono tracking-widest text-center text-lg"
              />
              {pincodeError && <p className="text-rose-400 text-xs mt-1.5 font-medium">{pincodeError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleApplyPincode(tempPincode)}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                Apply Pincode
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-bazaaro-border">
              <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Popular Metro Cities</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(POPULAR_PINCODES).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setTempPincode(code);
                      handleApplyPincode(code);
                    }}
                    className="px-2 py-1 text-[11px] bg-bazaaro-dark border border-bazaaro-border rounded hover:border-cyan-500/50 hover:text-cyan-400 text-slate-400 transition-colors cursor-pointer"
                  >
                    {info.city.split(' ')[0]}
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
