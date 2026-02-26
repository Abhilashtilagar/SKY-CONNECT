import React from 'react';

const Avatar = React.forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const avatarStyle = {
    position: 'relative',
    display: 'flex',
    height: '40px',
    width: '40px',
    flexShrink: 0,
    overflow: 'hidden',
    borderRadius: '50%',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={avatarStyle}
      {...props}
    />
  );
});
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const imageStyle = {
    aspectRatio: '1',
    height: '100%',
    width: '100%',
    ...style
  };

  return (
    <img
      ref={ref}
      className={className}
      style={imageStyle}
      {...props}
    />
  );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className = '', style = {}, ...props }, ref) => {
  const fallbackStyle = {
    display: 'flex',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    ...style
  };

  return (
    <div
      ref={ref}
      className={className}
      style={fallbackStyle}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };