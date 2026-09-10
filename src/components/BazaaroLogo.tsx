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
  theme = 'light',
  showTagline = true,
  iconOnly = false,
  className = '',
}) => {
  // Size mapping
  const iconDimensions = {
    sm: { box: 'w-8 h-8', svgSize: 22, text: 'text-lg', badge: 'text-[8px] px-1 py-0.2', tagline: 'text-[9px]' },
    md: { box: 'w-10 h-10', svgSize: 28, text: 'text-2xl', badge: 'text-[9px] px-1.5 py-0.5', tagline: 'text-[11px]' },
    lg: { box: 'w-14 h-14', svgSize: 38, text: 'text-3xl', badge: 'text-[10px] px-2 py-0.5', tagline: 'text-xs' },
  }[size];

  const isDark = theme === 'dark';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group cursor-pointer ${className}`}>
      {/* Aesthetic Modern Geometric Emblem */}
      <div
        className={`relative ${iconDimensions.box} rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-amber-500/25`}
      >
        {/* Outer ambient radiant glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 opacity-90 blur-[1px] group-hover:opacity-100 transition-opacity" />

        {/* Deep obsidian glass container with inner border */}
        <div className="relative w-full h-full rounded-[14px] bg-gradient-to-b from-slate-900 via-slate-950 to-[#070b14] border border-amber-500/30 flex items-center justify-center overflow-hidden shadow-inner m-[1.5px]">
          {/* Subtle geometric grid highlight in background */}
          <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:6px_6px] opacity-15" />

          {/* Master Vector SVG: Fusing Latin 'B', Devanagari 'ब', Shopping Loop & Rupee Slash */}
          <svg
            width={iconDimensions.svgSize}
            height={iconDimensions.svgSize}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="relative z-10 transition-transform duration-300 group-hover:rotate-1"
          >
            <defs>
              {/* Saffron-to-Marigold Vibrant Gradient */}
              <linearGradient id="bazaaroPrimary" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="25%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>

              {/* Luminous Specular Accent */}
              <linearGradient id="bazaaroShine" x1="12" y1="4" x2="36" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
              </linearGradient>

              {/* Rupee Stroke Gradient */}
              <linearGradient id="rupeeSlash" x1="10" y1="20" x2="38" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>

              {/* Soft Drop Shadow Filter for optical depth */}
              <filter id="bazaaroGlow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
                <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>

            {/* Background Bag Silhouette Loop */}
            <path
              d="M18 13C18 9.68629 20.6863 7 24 7C27.3137 7 30 9.68629 30 13"
              stroke="url(#bazaaroPrimary)"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeOpacity="0.85"
            />

            {/* Dynamic Geometric 'B' + Devanagari 'ब' Monogram Structure */}
            <g filter="url(#bazaaroGlow)">
              {/* Vertical Anchor Stem with top serif flourish */}
              <path
                d="M14 11C14 10.4477 14.4477 10 15 10H20C21.1046 10 22 10.8954 22 12V36C22 37.1046 21.1046 38 20 38H15C14.4477 38 14 37.5523 14 37V11Z"
                fill="url(#bazaaroPrimary)"
              />

              {/* Upper Loop of 'B' / Devanagari Shirorekha Arch */}
              <path
                d="M19 10H28C32.4183 10 36 13.5817 36 18C36 22.4183 32.4183 26 28 26H19V10Z"
                fill="url(#bazaaroPrimary)"
                fillOpacity="0.95"
              />

              {/* Lower Expanded Loop of 'B' / Marketplace Bazaar Bag Body */}
              <path
                d="M19 23H30C34.9706 23 39 27.0294 39 32C39 36.9706 34.9706 41 30 41H19V23Z"
                fill="url(#bazaaroPrimary)"
              />

              {/* Inner Cut-out 1 (Upper Void) */}
              <path
                d="M22 14.5H27C28.933 14.5 30.5 16.067 30.5 18C30.5 19.933 28.933 21.5 27 21.5H22V14.5Z"
                fill="#090D16"
              />

              {/* Inner Cut-out 2 (Lower Void with subtle Rupee Crossbar integration) */}
              <path
                d="M22 27.5H29C31.2091 27.5 33 29.2909 33 31.5C33 33.7091 31.2091 35.5 29 35.5H22V27.5Z"
                fill="#090D16"
              />

              {/* Diagonal Cross-Slash (Indian Rupee ₹ / Devanagari 'ब' inner belly slash) */}
              <path
                d="M23 28L31 36"
                stroke="url(#rupeeSlash)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Modern Top Horizontal Shirorekha Slash for authentic Desi tech touch */}
              <path
                d="M12 10H31"
                stroke="url(#bazaaroShine)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            {/* Glowing Tech Apex Sparkle at Top-Right */}
            <circle cx="37" cy="11" r="2" fill="#FDE68A" />
            <circle cx="37" cy="11" r="3.5" fill="#F59E0B" fillOpacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Modern Typographic Wordmark & Tagline */}
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            {/* Custom Styled Brand Name */}
            <span
              className={`font-extrabold tracking-tight transition-colors duration-200 ${iconDimensions.text} ${
                isDark ? 'text-white group-hover:text-amber-400' : 'text-slate-900 group-hover:text-amber-600'
              }`}
            >
              Bazaaro
            </span>

            {/* Aesthetic Tech Pill Tag */}
            <span
              className={`inline-flex items-center gap-1 font-bold tracking-wider uppercase rounded-full ${iconDimensions.badge} ${
                isDark
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>INDIA</span>
            </span>
          </div>

          {/* Tagline: "Sab kuch, ek bazaar mein." */}
          {showTagline && (
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`font-medium tracking-tight whitespace-nowrap transition-colors ${iconDimensions.tagline} ${
                  isDark ? 'text-amber-200/70 group-hover:text-amber-200' : 'text-amber-700/90 group-hover:text-amber-900'
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
