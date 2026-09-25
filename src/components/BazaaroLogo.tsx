import React from 'react';

interface BazaaroLogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  showTagline?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export const BazaaroLogo: React.FC<BazaaroLogoProps> = ({
  size = 'md',
  theme = 'dark',
  showTagline = true,
  iconOnly = false,
  className = '',
}) => {
  // Size mapping
  const iconDimensions = {
    sm: { box: 'w-8 h-8', text: 'text-lg', badge: 'text-[8px] px-1 py-0.2', tagline: 'text-[9px]' },
    md: { box: 'w-10 h-10', text: 'text-2xl', badge: 'text-[9px] px-1.5 py-0.5', tagline: 'text-[11px]' },
    lg: { box: 'w-14 h-14', text: 'text-3xl', badge: 'text-[10px] px-2 py-0.5', tagline: 'text-xs' },
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group cursor-pointer ${className}`}>
      {/* Dynamic Animated Shopping Bag Logo Emblem */}
      <div
        className={`relative ${iconDimensions.box} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
      >
        {/* Continuously Pulsing Ambient Glow Aura */}
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/35 via-orange-500/40 to-amber-400/30 opacity-70 animate-bazaaro-glow pointer-events-none group-hover:opacity-100 transition-opacity"
        />

        {/* Continuously Floating & Swaying Shopping Bag */}
        <div className="relative w-full h-full flex items-center justify-center animate-bazaaro-float">
          {/* Official New Bazaaro Shopping Bag Logo */}
          <img
            src="/bazaaro-logo.png"
            alt="Bazaaro Logo"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.35)] select-none pointer-events-none"
            loading="eager"
            decoding="async"
          />

          {/* Continuous Specular Shimmer Sweep (clipped exactly to bag silhouette) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none bazaaro-logo-mask opacity-80">
            <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-20 animate-bazaaro-shimmer" />
          </div>
        </div>
      </div>

      {/* Modern Typographic Wordmark & Tagline */}
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 leading-none">
            {/* Custom Styled Brand Name */}
            <span
              className={`font-bold tracking-tight transition-colors duration-200 ${iconDimensions.text} ${
                isDark ? 'text-slate-100 group-hover:text-white' : 'text-slate-900 group-hover:text-slate-700'
              }`}
            >
              Bazaaro
            </span>

            {/* Aesthetic Tech Pill Tag */}
            <span
              className={`inline-flex items-center gap-1 font-semibold tracking-wider uppercase rounded-full ${iconDimensions.badge} ${
                isDark
                  ? 'bg-slate-800/90 text-slate-300 border border-slate-700'
                  : 'bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>INDIA</span>
            </span>
          </div>

          {/* Tagline: "Sab kuch, ek bazaar mein." */}
          {showTagline && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`font-normal tracking-tight whitespace-nowrap transition-colors ${iconDimensions.tagline} ${
                  isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'
                }`}
              >
                Sab kuch, ek bazaar mein.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
