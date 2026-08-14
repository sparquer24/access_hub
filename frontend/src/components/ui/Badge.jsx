import React from 'react';

const TONES = {
  teal: 'bg-teal-100 text-teal-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  slate: 'bg-slate-100 text-slate-700',
  solid: 'bg-teal-600 text-white',
};

const Badge = ({ tone = 'teal', className = '', children, ...props }) => (
  <span
    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${TONES[tone] || TONES.teal} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
