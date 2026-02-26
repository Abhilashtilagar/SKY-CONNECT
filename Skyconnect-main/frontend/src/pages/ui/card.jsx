import React from 'react';

const Card = React.forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const cardStyle = {
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={cardStyle}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardContent = React.forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const contentStyle = {
    padding: '24px',
    paddingTop: 0,
    ...style
  };

  return (
    <div 
      ref={ref} 
      className={className} 
      style={contentStyle} 
      {...props} 
    />
  );
});
CardContent.displayName = 'CardContent';

export { Card, CardContent };