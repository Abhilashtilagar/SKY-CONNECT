import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Video, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '../utils/errorHandler';

const Authentication = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('signin');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async () => {
    setError('');
    setMessage('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    try {
      setTimeout(() => {
        if (activeTab === 'signin') {
          localStorage.setItem('token', 'demo-token');
          toast.success('Signed in successfully!');
          navigate('/home');
        } else {
          setMessage('Account created successfully! Please sign in.');
          toast.success('Account created!');
          setTimeout(() => {
            setActiveTab('signin');
            setMessage('');
          }, 1500);
        }
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      handleError(error, 'Authentication failed. Please try again.');
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{
      background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
    }}>
      {/* Back Button */}
      <Button
        data-testid="back-to-landing-btn"
        onClick={() => navigate('/')}
        variant="ghost"
        className="absolute top-6 left-6 gap-2"
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'Inter, sans-serif',
          color: '#0097a7'
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      {/* Auth Card */}
      <Card className="w-full max-w-md shadow-2xl" style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.5)'
      }}>
        <CardContent className="pt-8 pb-8 px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-4" style={{
              background: 'linear-gradient(135deg, #0097a7, #00acc1)',
              boxShadow: '0 10px 30px rgba(0, 151, 167, 0.3)'
            }}>
              <Video className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              background: 'linear-gradient(135deg, #0097a7, #00acc1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>SkyConnect</h1>
            <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {activeTab === 'signin' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2" style={{
              background: 'rgba(0, 151, 167, 0.1)',
              padding: '4px'
            }}>
              <TabsTrigger
                value="signin"
                data-testid="signin-tab"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500'
                }}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                data-testid="signup-tab"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: '500'
                }}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Input
                  data-testid="signin-username-input"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  data-testid="signin-password-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  className="h-12"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Input
                  data-testid="signup-name-input"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  data-testid="signup-username-input"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div className="space-y-2">
                <Input
                  data-testid="signup-password-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                  className="h-12"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>{message}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            data-testid="auth-submit-btn"
            onClick={handleAuth}
            disabled={isLoading}
            className="w-full h-12 text-base font-medium"
            style={{
              background: 'linear-gradient(135deg, #0097a7, #00acc1)',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? 'Please wait...' : activeTab === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              {activeTab === 'signin' ? (
                <>
                  New to SkyConnect?{' '}
                  <button
                    onClick={() => setActiveTab('signup')}
                    className="font-medium"
                    style={{ color: '#0097a7', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Get started
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="font-medium"
                    style={{ color: '#0097a7', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Authentication;