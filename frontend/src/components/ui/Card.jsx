import React from 'react';

/**
 * Shared surface primitive matching the `bg-white rounded-2xl shadow-lg`
 * pattern already hand-rolled across most pages, so it has one home.
 */
const Card = ({
  as: Component = 'div',
  padding = 'p-6',
  hoverable = false,
  glass = false,
  className = '',
  children,
  ...props
}) => {
  const classes = [
    glass ? 'bg-white/80 backdrop-blur-sm' : 'bg-white',
    'rounded-2xl border border-slate-200/60 shadow-lg',
    padding,
    hoverable ? 'transition-shadow duration-300 hover:shadow-xl' : '',
    className,
  ].join(' ');

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Card;
