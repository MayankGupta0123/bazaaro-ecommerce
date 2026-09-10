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
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top Trust Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Free Express Shipping</h4>
              <p className="text-xs text-slate-400 mt-0.5">Across 19,000+ Indian Pincodes for orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Brands</h4>
              <p className="text-xs text-slate-400 mt-0.5">Authorized domestic warranty with tax invoice</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">7 Days Replacement</h4>
              <p className="text-xs text-slate-400 mt-0.5">Zero hassle doorstep pickup on defective gadgets</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Razorpay Secure</h4>
              <p className="text-xs text-slate-400 mt-0.5">UPI, Cards, Netbanking & No-Cost EMI supported</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-10">
          <div className="md:col-span-5 space-y-4">
            <BazaaroLogo size="md" theme="dark" showTagline={true} />

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              India's premier modern electronics destination built for college students, developers, creators, and everyday tech enthusiasts. Offering transparent INR pricing, genuine manufacturer warranties, and AI-guided shopping.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>All prices listed in Indian Rupees (₹) inclusive of GST.</span>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Electronics
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-amber-400 transition-colors">5G Smartphones</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Laptops & MacBooks</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Noise Cancelling Audio</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Smartwatches & Bands</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Gaming Consoles</a></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Desk
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#" className="hover:text-amber-400 transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Warranty Registration</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">No Cost EMI Guide</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Indian Service Centers</a></li>
              <li><a href="#" className="hover:text-amber-400 transition-colors">Student Discount Program</a></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Payment Gateway
            </h5>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>Razorpay Gateway:</span>
                <span className="font-bold text-emerald-400">Test Mode Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Configured for testing without real charges. Test cards and simulated UPI tokens accepted.
              </p>
            </div>
            <div className="text-[11px] text-slate-500">
              GSTIN: 29AAACB1234F1Z5 • Registered in Bengaluru, India
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Bazaaro India. Final Year Project. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Indian Tech Shoppers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
