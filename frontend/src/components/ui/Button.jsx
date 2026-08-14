import React from 'react';

const VARIANTS = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm hover:shadow-teal-lg focus-visible:ring-teal-500',
  secondary: 'bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 hover:border-teal-300 focus-visible:ring-teal-500',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400',
  outline: 'bg-transparent hover:bg-white/10 text-white border border-white/40 hover:border-white focus-visible:ring-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus-visible:ring-red-500',
};

const SIZES = {
  sm: 'text-sm px-3.5 py-2 gap-1.5',
  md: 'text-sm px-5 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
};

/**
 * Shared button primitive. Wraps the teal brand treatment used across
 * LoginV2/LandingPage so pages stop hand-rolling button classes.
 */
const Button = ({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ');

  return (
    <Component className={classes} {...props}>
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
    </Component>
  );
};

export default Button;
