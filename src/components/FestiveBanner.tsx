import React from 'react';
import { Sparkles, ShieldCheck, Truck, CreditCard, Flame, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export const FestiveBanner: React.FC = () => {
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2000);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white border-b border-amber-500/20">
      {/* Decorative Indian geometric patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Main Banner Text */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-slate-950 uppercase tracking-wide shadow-xs">
                <Flame className="w-3.5 h-3.5 fill-slate-950" />
                Great Indian Tech Mela
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 text-amber-300 border border-amber-400/20 backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Dhamaka Electronics Deals
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Sab kuch, ek bazaar mein.{' '}
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
                India's Modern Electronics Hub.
              </span>
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Discover flagship 5G smartphones, M3 MacBooks, studio-grade ANC headphones, and gaming consoles with all prices in Indian Rupees (₹), authorized domestic warranties, and express delivery across Indian pin codes.
            </p>

            {/* Micro value badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">No-Cost EMI</div>
                  <div className="text-[11px] text-slate-400">HDFC, ICICI, SBI</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">Free Express Delivery</div>
                  <div className="text-[11px] text-slate-400">On all orders ₹499+</div>
                </div>
              </div>

              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">100% Genuine Brand</div>
                  <div className="text-[11px] text-slate-400">GST Invoice & Warranty</div>
                </div>
              </div>
            </div>
          </div>

          {/* Festive Coupon Voucher Card */}
          <div className="lg:col-span-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-5 relative shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Exclusive Desi Voucher
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                Limited Time
              </span>
            </div>

            <div className="text-xl font-bold text-white mb-1">
              Extra 10% Instant Off
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Apply on cart checkout for all smartphones & computing electronics.
            </p>

            <div className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-dashed border-amber-500/40 rounded-xl">
              <div className="font-mono font-bold text-sm tracking-wider text-amber-300">
                BAZAARO10
              </div>
              <button
                onClick={() => copyCoupon('BAZAARO10')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCoupon === 'BAZAARO10' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Code
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
