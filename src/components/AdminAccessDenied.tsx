import React from 'react';
import { Lock, ArrowLeft, ShieldAlert } from 'lucide-react';
import { BazaaroLogo } from './BazaaroLogo';

interface AdminAccessDeniedProps {
  onBackToStore: () => void;
  onOpenAuth: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  onBackToStore,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen bg-bazaaro-dark text-white flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-bazaaro-surface border border-bazaaro-border/80 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <BazaaroLogo size="md" iconOnly theme="dark" className="mx-auto mb-2" />
          <h2 className="text-xl font-black text-white">Administrator Clearance Required</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            The Bazaaro Admin Console is restricted to authenticated staff accounts with administrator privileges (<code className="text-amber-300 font-mono">role = admin</code>).
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-bazaaro-dark border border-bazaaro-border/60 text-[11px] text-slate-400 text-left space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Default Administrator Account:</span>
          </div>
          <div className="font-mono text-slate-300">Email: admin@bazaaro.in</div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onOpenAuth}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
          >
            Sign In with Admin Credentials
          </button>
          <button
            onClick={onBackToStore}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bazaaro Store</span>
          </button>
        </div>
      </div>
    </div>
  );
};
