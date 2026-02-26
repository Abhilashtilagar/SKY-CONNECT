import React from 'react';

const Separator = React.forwardRef(({ className = '', orientation = 'horizontal', style = {}, ...props }, ref) => {
  const separatorStyle = {
    flexShrink: 0,
    backgroundColor: '#e5e7eb',
    ...(orientation === 'horizontal' ? { height: '1px', width: '100%' } : { height: '100%', width: '1px' }),
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={separatorStyle}
      {...props}
    />
  );
});
Separator.displayName = 'Separator';

export { Separator };