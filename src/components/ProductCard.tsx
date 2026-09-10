import React from 'react';
import { Heart, Star, ShoppingBag, Truck, Zap } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/format';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-amber-500/50 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.madeInIndia && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-500/30 backdrop-blur-xs">
            🇮🇳 Made in India
          </span>
        )}
        {product.discountPercent >= 20 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500 text-slate-950 shadow-xs">
            <Zap className="w-3 h-3 fill-slate-950" />
            {product.discountPercent}% OFF
          </span>
        ) : product.tags[0] ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 text-slate-200 backdrop-blur-xs">
            {product.tags[0]}
          </span>
        ) : null}
      </div>

      {/* Wishlist button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product);
        }}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer ${
          isWishlisted
            ? 'bg-rose-50 text-rose-600 shadow-sm'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Image container */}
      <div
        onClick={() => onSelectProduct(product)}
        className="cursor-pointer relative aspect-4/3 bg-slate-50 overflow-hidden flex items-center justify-center p-4"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-106 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Rating */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-slate-800 text-xs font-semibold">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{product.rating}</span>
              <span className="text-slate-400 text-[10px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-2 cursor-pointer mb-2"
          >
            {product.name}
          </h3>

          {/* Price Box */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-900 tracking-tight">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
              <span className="text-xs font-bold text-emerald-600">
                Save {formatINR(product.originalPrice - product.price)}
              </span>
            </div>

            {product.emiStarting > 0 && (
              <div className="text-[11px] text-slate-500 mt-0.5">
                No Cost EMI starts at <strong className="text-slate-700">{formatINR(product.emiStarting)}/mo</strong>
              </div>
            )}
          </div>

          {/* Express delivery note */}
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mb-3">
            <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{product.fastDelivery}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer group/btn"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400 group-hover/btn:text-white transition-colors" />
            <span>Add to Cart</span>
          </button>
          <button
            onClick={() => onSelectProduct(product)}
            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};
