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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Your Bazaaro Bag</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-semibold">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart items list */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Your bag is empty</h4>
            <p className="text-xs text-slate-500 mb-6 max-w-xs">
              Looks like you haven't added any electronic gadgets yet. Explore the latest smartphones, laptops, and ANC earbuds.
            </p>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Explore Electronics
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Free Delivery Bar */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {deliveryFee === 0 ? (
                  <strong>Yay! You qualify for Free Express Shipping across India!</strong>
                ) : (
                  <span>Add {formatINR(499 - itemsSubtotal)} more for Free Express Delivery.</span>
                )}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-white flex gap-3 items-center shadow-2xs"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 object-contain rounded-xl bg-slate-50 p-1 border border-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {item.product.name}
                    </h5>
                    <div className="text-[11px] text-slate-500 mb-1">
                      {item.product.brand}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-black text-slate-900">
                        {formatINR(item.product.price * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-slate-400">
                          ({formatINR(item.product.price)} each)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-l cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 rounded-r cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon Code Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  Apply Discount Voucher
                </span>
                {appliedCoupon && (
                  <button
                    onClick={onRemoveCoupon}
                    className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Coupon <strong>{appliedCoupon}</strong> Applied</span>
                  </div>
                  <span className="text-emerald-700 font-bold">-{formatINR(couponDiscount)}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon (e.g. BAZAARO10)"
                    className="flex-1 px-3 py-1.5 text-xs uppercase font-mono tracking-wider border border-slate-300 rounded-lg outline-hidden focus:border-amber-500"
                  />
                  <button
                    onClick={() => handleApplyCoupon(couponInput)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              )}

              {couponFeedback && !appliedCoupon && (
                <p className={`text-[11px] ${couponFeedback.success ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {couponFeedback.message}
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.keys(TEST_COUPONS).map((code) => (
                  <button
                    key={code}
                    onClick={() => handleApplyCoupon(code)}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:border-amber-500 font-mono"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Bill Details */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 text-xs">
              <div className="font-bold text-slate-900 mb-1">Price Details (INR)</div>
              <div className="flex justify-between text-slate-600">
                <span>Total M.R.P.</span>
                <span className="line-through">{formatINR(subtotalMRP)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Discount on M.R.P.</span>
                <span>-{formatINR(mrpDiscount)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>-{formatINR(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>
                  {deliveryFee === 0 ? (
                    <strong className="text-emerald-600 uppercase text-[10px]">FREE</strong>
                  ) : (
                    formatINR(deliveryFee)
                  )}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                <span>Total Amount</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                *Includes 18% GST. Official tax invoice generated on checkout.
              </p>
            </div>
          </div>
        )}

        {/* Footer Proceed CTA */}
        {items.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>You save <strong>{formatINR(totalSavings)}</strong> on this order!</span>
              <span className="flex items-center gap-1 text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Razorpay Test Gateway
              </span>
            </div>

            <button
              onClick={onProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <span>Proceed to Checkout ({formatINR(grandTotal)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
