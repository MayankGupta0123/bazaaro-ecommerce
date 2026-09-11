import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard,
  Heart,
  Sparkles
} from 'lucide-react';
import { BazaaroLogo } from './BazaaroLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Trust Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Fast Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">Across 19,000+ PIN codes for orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">100% Genuine</h4>
              <p className="text-xs text-slate-400 mt-1">Authorized domestic warranty on all products</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">7-Day Returns</h4>
              <p className="text-xs text-slate-400 mt-1">Zero hassle doorstep pickup on defective items</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">Secure Payments</h4>
              <p className="text-xs text-slate-400 mt-1">UPI, Cards, Netbanking supported via secure gateway</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12">
          <div className="md:col-span-5 space-y-5">
            <BazaaroLogo size="md" theme="dark" showTagline={true} />

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The premium destination for modern electronics. Offering transparent pricing, verified hardware, and thoughtful curation for tech enthusiasts.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Prices in INR (₹) inclusive of all taxes.</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Categories
            </h5>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-slate-200 transition-colors">Smartphones</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Laptops</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Audio</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Wearables</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Gaming</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Support
            </h5>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-slate-200 transition-colors">Track Order</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Returns & Refunds</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">EMI Options</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Service Centers</a></li>
              <li><a href="#" className="hover:text-slate-200 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-4">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Payment Gateway
            </h5>
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>ZapUPI Mode:</span>
                <span className="font-semibold text-slate-100">Test Simulation</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Configured for testing without real charges. Simulated payments active.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              HQ: BENGALURU, INDIA
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Bazaaro. Final Year Project. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
