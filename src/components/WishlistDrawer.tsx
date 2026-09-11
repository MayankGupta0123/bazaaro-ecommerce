import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/format';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlist,
  onRemoveWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-bazaaro-surface h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-slate-700/50">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h3 className="font-semibold text-slate-100 text-lg tracking-wide">Your Wishlist</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium ml-1">
              {wishlist.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {wishlist.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-5">
                <Heart className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-200 mb-2">Your Wishlist is Empty</h4>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Save gear you love to keep track of price drops.
              </p>
            </div>
          ) : (
            wishlist.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl border border-transparent hover:border-slate-700 bg-slate-800/20 flex items-center gap-4 transition-colors"
              >
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 object-contain rounded-xl bg-[#F5F5F7] mix-blend-multiply p-2 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">{prod.brand}</div>
                  <div className="text-sm font-semibold text-slate-200 truncate mb-1">{prod.name}</div>
                  <div className="text-sm font-semibold text-slate-100">
                    {formatINR(prod.price)}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onAddToCart(prod);
                    }}
                    className="p-2 bg-slate-100 hover:bg-white text-slate-900 rounded-xl transition-colors cursor-pointer shadow-xs"
                    title="Add to Bag"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveWishlist(prod)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
