import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

interface AiDostFloatingButtonProps {
  onClick: () => void;
}

const DISCOVERY_HINTS = [
  'Need help choosing?',
  'Find the right phone',
  'Compare products',
  'Shop by budget',
];

// 4-pointed diamond sparkle star matching the reference mockup
const CornerSparkle: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-2.5 h-2.5 text-cyan-300 pointer-events-none drop-shadow-[0_0_6px_rgba(56,189,248,0.9)] ${className}`}
  >
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

export const AiDostFloatingButton: React.FC<AiDostFloatingButtonProps> = ({ onClick }) => {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % DISCOVERY_HINTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 select-none">
      {/* Decorative corner sparkles from reference mockup */}
      <CornerSparkle className="absolute -top-1 -right-1 z-50 animate-pulse" />
      <CornerSparkle className="absolute -bottom-1 -left-1 z-50 animate-pulse delay-500" />

      <button
        type="button"
        onClick={onClick}
        aria-label="Open Bazaaro AI Dost Shopping Assistant"
        className="group relative flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 w-[205px] sm:w-[225px] h-[52px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#0e172a] via-[#111c34] to-[#0f1a30] hover:from-[#131f38] hover:via-[#162444] hover:to-[#14223f] border border-[rgba(70,190,255,0.32)] hover:border-[rgba(70,190,255,0.65)] ring-1 ring-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.6),0_0_20px_rgba(30,144,255,0.2)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.8),0_0_28px_rgba(30,144,255,0.32)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Subtle glass shimmer glint on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-300/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

        {/* Compact Friendly Robot Icon Container */}
        <div className="relative flex items-center justify-center shrink-0">
          {/* Subtle slow-breathing cyan ambient aura */}
          <span className="absolute -inset-1 rounded-full bg-cyan-500/25 blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />

          {/* Circular base */}
          <div className="relative w-9 h-9 sm:w-9.5 sm:h-9.5 rounded-full bg-gradient-to-b from-[#182645] to-[#0d162b] border border-cyan-400/40 flex items-center justify-center shadow-inner">
            {/* Friendly Line-Art Robot Mascot */}
            <svg
              className="w-5 h-5 text-cyan-200 transition-transform duration-300 group-hover:scale-105"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Antenna */}
              <path d="M12 2v3" />
              <circle cx="12" cy="2" r="0.9" fill="currentColor" />
              {/* Side ears */}
              <path d="M4 12H2.5m19 0H19.5" />
              {/* Head Outline */}
              <rect x="4" y="5.5" width="16" height="13" rx="3.5" />
              {/* Eyes */}
              <circle cx="9" cy="11" r="1.1" fill="currentColor" />
              <circle cx="15" cy="11" r="1.1" fill="currentColor" />
              {/* Smile */}
              <path d="M9.5 14.5c.8.8 4.2.8 5 0" />
            </svg>

            {/* Satellite pulse sparkle dot */}
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(6,182,212,0.9)]" />
          </div>
        </div>

        {/* Text Block */}
        <div className="text-left flex-1 min-w-0 flex flex-col justify-center">
          {/* Row 1: Brand Name + [AI] Badge */}
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-semibold text-xs text-white group-hover:text-cyan-50 tracking-tight truncate">
              Bazaaro AI Dost
            </span>
            <span className="inline-flex items-center px-1 py-0.2 rounded text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 leading-none">
              AI
            </span>
          </div>

          {/* Row 2: Helper Text + Chevron Arrow */}
          <div className="flex items-center justify-between text-xs mt-0.5 text-slate-300">
            <span
              key={hintIndex}
              className="text-[10px] text-cyan-100/75 font-normal truncate animate-in fade-in slide-in-from-bottom-0.5 duration-300"
            >
              {DISCOVERY_HINTS[hintIndex]}
            </span>
            <ChevronRight className="w-3 h-3 text-cyan-400/70 group-hover:translate-x-0.5 group-hover:text-cyan-200 transition-all shrink-0 ml-0.5" />
          </div>
        </div>
      </button>
    </div>
  );
};
