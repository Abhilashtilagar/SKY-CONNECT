import React from 'react';

const SkyConnectLogo = ({ size = 64, animated = true }) => {
  return (
    <div style={{ 
      width: size, 
      height: size, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#logoGradient)"
          className={animated ? 'logo-pulse' : ''}
        />
        
        {/* Cloud Shape */}
        <path
          d="M25 45c0-8 6-14 14-14 2 0 4 0.5 5.5 1.5C46 28 50 25 55 25c8 0 14 6 14 14 0 1-0.1 2-0.3 3 4 1 7 5 7 9 0 5-4 9-9 9H31c-4 0-7-3-7-7 0-3 2-6 5-7z"
          fill="white"
          opacity="0.9"
          className={animated ? 'logo-float' : ''}
        />
        
        {/* Connection Nodes */}
        <circle cx="35" cy="65" r="3" fill="white" opacity="0.8" className={animated ? 'logo-node1' : ''} />
        <circle cx="50" cy="70" r="3" fill="white" opacity="0.8" className={animated ? 'logo-node2' : ''} />
        <circle cx="65" cy="65" r="3" fill="white" opacity="0.8" className={animated ? 'logo-node3' : ''} />
        
        {/* Connection Lines */}
        <line x1="35" y1="65" x2="50" y2="70" stroke="white" strokeWidth="2" opacity="0.6" className={animated ? 'logo-line1' : ''} />
        <line x1="50" y1="70" x2="65" y2="65" stroke="white" strokeWidth="2" opacity="0.6" className={animated ? 'logo-line2' : ''} />
        
        {/* Sky Elements - Stars */}
        <circle cx="30" cy="30" r="1.5" fill="white" opacity="0.7" className={animated ? 'logo-star1' : ''} />
        <circle cx="70" cy="35" r="1" fill="white" opacity="0.6" className={animated ? 'logo-star2' : ''} />
        <circle cx="75" cy="25" r="1.2" fill="white" opacity="0.8" className={animated ? 'logo-star3' : ''} />
        
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="50%" stopColor="#764ba2" />
            <stop offset="100%" stopColor="#667eea" />
          </linearGradient>
        </defs>
      </svg>
      
      {animated && (
        <style jsx>{`
          @keyframes logo-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes logo-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-2px); }
          }
          
          @keyframes logo-node1 {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            33% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes logo-node2 {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            66% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes logo-node3 {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            100% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes logo-line1 {
            0%, 100% { opacity: 0.6; }
            33% { opacity: 1; }
          }
          
          @keyframes logo-line2 {
            0%, 100% { opacity: 0.6; }
            66% { opacity: 1; }
          }
          
          @keyframes logo-star1 {
            0%, 100% { opacity: 0.7; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          
          @keyframes logo-star2 {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            25% { opacity: 1; transform: scale(1.3); }
          }
          
          @keyframes logo-star3 {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            75% { opacity: 1; transform: scale(1.4); }
          }
          
          .logo-pulse {
            animation: logo-pulse 3s ease-in-out infinite;
          }
          
          .logo-float {
            animation: logo-float 4s ease-in-out infinite;
          }
          
          .logo-node1 {
            animation: logo-node1 2s ease-in-out infinite;
          }
          
          .logo-node2 {
            animation: logo-node2 2s ease-in-out infinite 0.3s;
          }
          
          .logo-node3 {
            animation: logo-node3 2s ease-in-out infinite 0.6s;
          }
          
          .logo-line1 {
            animation: logo-line1 2s ease-in-out infinite;
          }
          
          .logo-line2 {
            animation: logo-line2 2s ease-in-out infinite 0.3s;
          }
          
          .logo-star1 {
            animation: logo-star1 3s ease-in-out infinite;
          }
          
          .logo-star2 {
            animation: logo-star2 3s ease-in-out infinite 1s;
          }
          
          .logo-star3 {
            animation: logo-star3 3s ease-in-out infinite 2s;
          }
        `}</style>
      )}
    </div>
  );
};

export default SkyConnectLogo;