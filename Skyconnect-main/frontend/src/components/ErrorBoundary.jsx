import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '8px',
            padding: '32px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              marginBottom: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              fontSize: '32px'
            }}>⚠️</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#dc2626'
            }}>Something went wrong</h2>
            <p style={{
              color: '#6b7280',
              marginBottom: '24px',
              fontFamily: 'Inter, sans-serif'
            }}>
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;