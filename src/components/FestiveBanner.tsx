import React from 'react';

export const FestiveBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-bazaaro-dark border-b border-bazaaro-border/60 pt-8 pb-8 sm:pt-11 sm:pb-10">
      {/* Very subtle ambient radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-cyan-950/20 rounded-full blur-[120px] opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
        {/* Top badge with clear breathing room */}
        <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-bazaaro-surface border border-bazaaro-border/80 text-[11px] sm:text-xs font-medium text-slate-300 mb-3.5 tracking-wide shadow-xs">
          Premium Modern Tech Marketplace
        </span>
        
        {/* Compact, impactful headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-50 mb-3 max-w-2xl leading-tight">
          Technology, <br className="hidden sm:block" />
          <span className="text-slate-400">thoughtfully chosen.</span>
        </h1>
        
        {/* Restrained supporting text */}
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg leading-relaxed">
          Discover smartphones, laptops, audio, wearables and everyday tech from brands you trust.
        </p>
      </div>
    </div>
  );
};

