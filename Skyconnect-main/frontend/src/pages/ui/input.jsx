import React from 'react';

const Input = React.forwardRef(({ className = '', type = 'text', style = {}, ...props }, ref) => {
  const inputStyle = {
    display: 'flex',
    height: '40px',
    width: '100%',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'transparent',
    padding: '8px 12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    ...style
  };

  return (
    <input
      type={type}
      className={className}
      style={inputStyle}
      ref={ref}
      onFocus={(e) => {
        e.target.style.borderColor = '#0ea5e9';
        e.target.style.boxShadow = '0 0 0 2px rgba(14, 165, 233, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = '#d1d5db';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };