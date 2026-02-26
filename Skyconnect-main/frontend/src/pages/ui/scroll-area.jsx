import React from 'react';

const ScrollArea = React.forwardRef(({ className = '', children, style = {}, ...props }, ref) => {
  const scrollStyle = {
    position: 'relative',
    overflow: 'auto',
    height: '100%',
    width: '100%',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={scrollStyle}
      {...props}
    >
      {children}
    </div>
  );
});
ScrollArea.displayName = 'ScrollArea';

const ScrollBar = () => null;

export { ScrollArea, ScrollBar };