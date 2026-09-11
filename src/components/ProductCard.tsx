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
    <div className="group bg-bazaaro-surface rounded-2xl border border-transparent hover:border-slate-700 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative transform hover:-translate-y-1">
      {/* Top badges */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
        {product.madeInIndia && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-900 border border-slate-200">
            🇮🇳 Made in India
          </span>
        )}
        {product.discountPercent >= 20 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white">
            <Zap className="w-3 h-3 fill-current" />
            {product.discountPercent}% OFF
          </span>
        ) : product.tags[0] ? (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
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
        className={`absolute top-4 right-4 z-10 p-2.5 rounded-full transition-all cursor-pointer ${
          isWishlisted
            ? 'bg-rose-50 text-rose-500 shadow-xs'
            : 'bg-white/80 text-slate-400 hover:text-slate-900 hover:bg-white shadow-xs'
        }`}
        title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
      </button>

      {/* Image container - neutral background */}
      <div
        onClick={() => onSelectProduct(product)}
        className="cursor-pointer relative aspect-4/3 bg-[#F5F5F7] m-1.5 rounded-xl overflow-hidden flex items-center justify-center p-6"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>

      {/* Product Information */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {product.brand}
            </span>
            <div className="flex items-center gap-1 text-slate-300 text-[11px] font-medium">
              <Star className="w-3 h-3 fill-slate-300" />
              <span>{product.rating}</span>
              <span className="text-slate-500">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelectProduct(product)}
            className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer mb-3 leading-snug"
          >
            {product.name}
          </h3>

          {/* Price Box */}
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-semibold text-slate-50 tracking-tight">
                {formatINR(product.price)}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-500 line-through">
                  {formatINR(product.originalPrice)}
                </span>
              )}
            </div>

            {product.emiStarting > 0 && (
              <div className="text-[11px] text-slate-500 mt-1">
                EMI starts at <strong className="text-slate-300 font-medium">{formatINR(product.emiStarting)}/mo</strong>
              </div>
            )}
          </div>

          {/* Express delivery note */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-4">
            <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{product.fastDelivery}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToCart(product)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-xs font-semibold transition-colors cursor-pointer group/btn"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
};
