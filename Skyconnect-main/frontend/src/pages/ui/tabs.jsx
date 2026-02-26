import React, { useState } from 'react';

const Tabs = ({ value, onValueChange, children, ...props }) => {
  const [activeTab, setActiveTab] = useState(value);
  
  const handleTabChange = (newValue) => {
    setActiveTab(newValue);
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <div {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange: handleTabChange })
      )}
    </div>
  );
};

const TabsList = React.forwardRef(({ className = '', style = {}, children, activeTab, onTabChange, ...props }, ref) => {
  const listStyle = {
    display: 'inline-flex',
    height: '40px',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
    padding: '4px',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={listStyle}
      {...props}
    >
      {React.Children.map(children, child => 
        React.cloneElement(child, { activeTab, onTabChange })
      )}
    </div>
  );
});
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className = '', style = {}, value, children, activeTab, onTabChange, ...props }, ref) => {
  const isActive = activeTab === value;
  const triggerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: isActive ? '#ffffff' : 'transparent',
    color: isActive ? '#000000' : '#6b7280',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    ...style
  };

  return (
    <button
      ref={ref}
      className={className}
      style={triggerStyle}
      onClick={() => onTabChange && onTabChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className = '', style = {}, value, children, activeTab, ...props }, ref) => {
  if (activeTab !== value) return null;
  
  const contentStyle = {
    marginTop: '8px',
    outline: 'none',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={contentStyle}
      {...props}
    >
      {children}
    </div>
  );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };