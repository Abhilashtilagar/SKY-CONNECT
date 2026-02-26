import React from 'react';

const Button = React.forwardRef(({ className = '', variant = 'default', size = 'default', style = {}, disabled, ...props }, ref) => {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style
  };
  
  const variants = {
    default: {
      backgroundColor: '#0ea5e9',
      color: 'white',
      ...baseStyle
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151',
      ...baseStyle,
      ':hover': { backgroundColor: '#f3f4f6' }
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid #d1d5db',
      color: '#374151',
      ...baseStyle
    }
  };
  
  const sizes = {
    default: { height: '40px', padding: '8px 16px' },
    sm: { height: '36px', padding: '6px 12px' },
    lg: { height: '44px', padding: '12px 32px' }
  };

  const finalStyle = {
    ...variants[variant],
    ...sizes[size],
    ...style
  };

  return (
    <button
      className={className}
      style={finalStyle}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { Button };