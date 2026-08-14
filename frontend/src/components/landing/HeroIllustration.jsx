import React, { useId } from 'react';
import { Camera, ShieldCheck } from 'lucide-react';
import { Check, Lock } from '../icons/Icons';

/**
 * Inline-SVG "AI access control" hero illustration — no external image
 * assets. A badge/gate silhouette with an animated scan beam, pulse
 * rings, and floating capability chips (verified entry / LPR / security).
 */
const HeroIllustration = () => {
  const uid = useId();
  const gateGradientId = `hero-gate-${uid}`;
  const beamGradientId = `hero-beam-${uid}`;
  const glowGradientId = `hero-glow-${uid}`;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square select-none" aria-hidden="true">
      {/* Soft ambient glow blobs */}
      <div className="absolute -top-8 -right-6 w-40 h-40 bg-teal-300/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-6 w-48 h-48 bg-cyan-300/30 rounded-full blur-3xl" />

      {/* Pulse rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="absolute w-64 h-64 rounded-full border-2 border-teal-400/30 animate-ping [animation-duration:3s]" />
        <span className="absolute w-52 h-52 rounded-full border-2 border-teal-400/40" />
      </div>

      {/* Central badge / gate composition */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 240 240" className="w-56 h-56 drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id={gateGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0d9488" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id={glowGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={beamGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" stopOpacity="0" />
              <stop offset="50%" stopColor="#5eead4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Badge body */}
          <rect x="40" y="20" width="160" height="200" rx="28" fill={`url(#${gateGradientId})`} />
          <rect x="40" y="20" width="160" height="90" rx="28" fill={`url(#${glowGradientId})`} />

          {/* Lanyard notch */}
          <rect x="104" y="6" width="32" height="20" rx="10" fill="#0f766e" />

          {/* Face / identity circle */}
          <circle cx="120" cy="92" r="34" fill="white" fillOpacity="0.15" />
          <circle cx="120" cy="92" r="34" fill="none" stroke="white" strokeOpacity="0.6" strokeWidth="2" />
          <circle cx="120" cy="80" r="12" fill="white" fillOpacity="0.85" />
          <path d="M96 112c4-14 14-20 24-20s20 6 24 20" stroke="white" strokeOpacity="0.85" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Detail lines */}
          <rect x="64" y="150" width="112" height="8" rx="4" fill="white" fillOpacity="0.5" />
          <rect x="64" y="168" width="80" height="8" rx="4" fill="white" fillOpacity="0.3" />

          {/* Verified check chip */}
          <circle cx="168" cy="180" r="20" fill="white" />
          <path d="M159 180l6 6 12-13" stroke="#0d9488" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />

          {/* Scan beam sweeping vertically across the badge */}
          <g clipPath={`inset(0 round 28px)`}>
            <rect x="40" y="20" width="160" height="24" fill={`url(#${beamGradientId})`} className="animate-scan" />
          </g>
        </svg>
      </div>

      {/* Floating capability chips */}
      <div className="absolute top-2 left-0 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-2 pr-3 py-2 shadow-lg animate-float [animation-delay:0.2s]">
        <span className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
          <Check className="w-4 h-4 text-teal-600" />
        </span>
        <span className="text-xs font-semibold text-slate-700">Verified entry</span>
      </div>

      <div className="absolute bottom-6 -right-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-2 pr-3 py-2 shadow-lg animate-float [animation-delay:0.6s]">
        <span className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center">
          <Camera className="w-4 h-4 text-cyan-600" />
        </span>
        <span className="text-xs font-semibold text-slate-700">LPR alerts</span>
      </div>

      <div className="absolute bottom-24 -left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-2 pr-3 py-2 shadow-lg animate-float [animation-delay:1s]">
        <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold text-slate-700">Role-based access</span>
      </div>

      <div className="absolute top-10 -right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full pl-2 pr-3 py-2 shadow-lg animate-float [animation-delay:1.4s]">
        <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </span>
        <span className="text-xs font-semibold text-slate-700">24/7 security</span>
      </div>
    </div>
  );
};

export default HeroIllustration;
