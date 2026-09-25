import React, { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Tag,
  ArrowRight,
  ShieldCheck,
  Check,
  Truck
} from 'lucide-react';
import { CartItem } from '../types';
import { formatINR, TEST_COUPONS } from '../utils/format';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  appliedCoupon: string | null;
  onApplyCoupon: (code: string) => boolean;
  onRemoveCoupon: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  onProceedToCheckout,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  // Calculate pricing in INR
  const subtotalMRP = items.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const itemsSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const mrpDiscount = subtotalMRP - itemsSubtotal;

  let couponDiscount = 0;
  if (appliedCoupon && TEST_COUPONS[appliedCoupon]) {
    const coupon = TEST_COUPONS[appliedCoupon];
    if (itemsSubtotal >= coupon.minSpend) {
      if (coupon.discountPercent) {
        couponDiscount = Math.round((itemsSubtotal * coupon.discountPercent) / 100);
      } else if (coupon.flatDiscount) {
        couponDiscount = coupon.flatDiscount;
      }
    }
  }

  const deliveryFee = itemsSubtotal >= 499 || items.length === 0 ? 0 : 70;
  const grandTotal = Math.max(0, itemsSubtotal - couponDiscount + deliveryFee);
  const totalSavings = mrpDiscount + couponDiscount;

  const handleApplyCoupon = (code: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    const ok = onApplyCoupon(upper);
    if (ok) {
      setCouponFeedback({ success: true, message: `Coupon ${upper} applied successfully!` });
      setCouponInput('');
    } else {
      setCouponFeedback({ success: false, message: 'Invalid coupon or minimum order requirement not met.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-bazaaro-surface h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-slate-700/50">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-slate-200" />
            <h3 className="font-semibold text-slate-100 text-lg tracking-wide">Your Bag</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium ml-1">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-5">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-200 mb-2">Your bag is empty</h4>
            <p className="text-sm text-slate-500 mb-8 max-w-xs">
              Looks like you haven't added anything yet. Discover our curated selection of premium tech.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm rounded-full transition-colors cursor-pointer"
            >
              Shop Products
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Free Delivery Bar */}
            <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-3 text-xs text-slate-300">
              <Truck className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {deliveryFee === 0 ? (
                  <strong className="text-emerald-400">Success: You qualify for Free Delivery!</strong>
                ) : (
                  <span>Add {formatINR(499 - itemsSubtotal)} more for Free Delivery.</span>
                )}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl border border-bazaaro-border/60 hover:border-slate-700 bg-bazaaro-dark/80 flex gap-4 items-center transition-colors"
                >
                  <div className="w-20 h-20 shrink-0 rounded-xl bg-white flex items-center justify-center p-2 overflow-hidden shadow-xs border border-slate-700/40">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 tracking-wider">
                      {item.product.brand}
                    </div>
                    <h5 className="text-sm font-semibold text-slate-200 truncate mb-1">
                      {item.product.name}
                    </h5>
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-slate-100">
                        {formatINR(item.product.price * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({formatINR(item.product.price)} each)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-3">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center border border-slate-700 rounded-lg bg-slate-800/50">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-l cursor-pointer transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-r cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Box */}
            <div className="p-4 rounded-xl bg-bazaaro-dark/80 border border-bazaaro-border/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-slate-400" />
                  Use Coupon Code
                </span>
                {appliedCoupon && (
                  <button
                    onClick={onRemoveCoupon}
                    className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-900/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Code <strong>{appliedCoupon}</strong> Applied</span>
                  </div>
                  <span className="text-emerald-400 font-bold">-{formatINR(couponDiscount)}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 text-xs uppercase font-mono tracking-wider bg-bazaaro-dark border border-bazaaro-border text-slate-200 rounded-lg outline-hidden focus:border-cyan-500 transition-colors"
                  />
                  <button
                    onClick={() => handleApplyCoupon(couponInput)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponFeedback && !appliedCoupon && (
                <p className={`text-[11px] font-medium ${couponFeedback.success ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {couponFeedback.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {Object.keys(TEST_COUPONS).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleApplyCoupon(code)}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-bazaaro-dark border border-bazaaro-border text-slate-400 hover:text-slate-200 hover:border-slate-500 font-mono transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Details */}
            <div className="p-5 rounded-xl bg-bazaaro-dark/80 border border-bazaaro-border/80 space-y-3 text-xs">
              <div className="font-semibold text-slate-100 mb-2 text-sm">Order Summary</div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="text-slate-400">{formatINR(subtotalMRP)}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Product Discounts</span>
                <span>-{formatINR(mrpDiscount)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>-{formatINR(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-400 uppercase text-[10px]">FREE</strong>
                  ) : (
                    formatINR(deliveryFee)
                  )}
                </span>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-700/50 flex justify-between font-semibold text-lg text-slate-100">
                <span>Total Amount</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                *Inclusive of all taxes (GST 18%).
              </p>
            </div>
          </div>
        )}

        {/* Footer Proceed CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-700/50 bg-bazaaro-surface space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>You save <strong className="text-emerald-400">{formatINR(totalSavings)}</strong> on this order</span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400" /> Secure Checkout
              </span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Checkout ({formatINR(grandTotal)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
