import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, Users, Monitor, Shield, Zap, Globe } from 'lucide-react';
import { toast } from 'sonner';

const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: <Video className="w-6 h-6" />,
      title: 'HD Video Quality',
      description: 'Crystal-clear video with adaptive streaming technology'
    },
    {
      icon: <Monitor className="w-6 h-6" />,
      title: 'Screen Sharing',
      description: 'Share your screen seamlessly with participants'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Unlimited Participants',
      description: 'Host meetings with unlimited attendees'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'End-to-End Encryption',
      description: 'Your conversations are private and secure'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Start',
      description: 'No downloads required. Start meeting instantly'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Works Everywhere',
      description: 'Access from any device, anywhere in the world'
    }
  ];

  const handleCreateRoom = () => {
    setIsLoading(true);
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setTimeout(() => {
      navigate(`/${newRoomId}`);
      setIsLoading(false);
    }, 500);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        navigate(`/${roomId}`);
        setIsLoading(false);
      }, 500);
    } else {
      toast.error('Please enter a meeting ID');
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 30%, #80deea 60%, #4dd0e1 100%)'
    }}>
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #0097a7, #00acc1)',
              boxShadow: '0 4px 12px rgba(0, 151, 167, 0.3)'
            }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#0097a7'
            }}>SkyConnect</span>
          </div>
          <Button
            data-testid="signin-btn"
            onClick={() => navigate('/auth')}
            variant="ghost"
            style={{
              fontFamily: 'Inter, sans-serif',
              color: '#0097a7',
              fontWeight: '500'
            }}
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-12 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#006064'
              }}>
                Professional Video
                <br />
                Conferencing
              </h1>
              <p className="text-xl text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Connect with your team from anywhere. Crystal-clear HD calls,
                screen sharing, and real-time collaboration.
              </p>

              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00c853' }}></div>
                  <span className="text-sm font-medium text-gray-700">No sign-up required</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00c853' }}></div>
                  <span className="text-sm font-medium text-gray-700">100% browser-based</span>
                </div>
              </div>
            </div>

            {/* Right: Meeting Card */}
            <Card className="shadow-2xl" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6" style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: '#006064'
                }}>Start Your Meeting</h2>

                <div className="space-y-4">
                  <Button
                    data-testid="create-meeting-btn"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-medium"
                    style={{
                      background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {isLoading ? 'Creating...' : 'Create New Meeting'}
                  </Button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 text-sm text-gray-500" style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        fontFamily: 'Inter, sans-serif'
                      }}>or join existing</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Input
                      data-testid="room-id-input"
                      type="text"
                      placeholder="Enter Meeting ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                      className="h-12 text-base"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />

                    <Button
                      data-testid="join-meeting-btn"
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim() || isLoading}
                      variant="outline"
                      className="w-full h-12 text-base font-medium"
                      style={{
                        borderColor: '#0097a7',
                        color: '#0097a7',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isLoading ? 'Joining...' : 'Join Meeting'}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-center mt-6 text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Want to save your meetings?{' '}
                  <a
                    href="/auth"
                    className="font-medium"
                    style={{ color: '#0097a7', textDecoration: 'none' }}
                  >
                    Sign in
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20" style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#006064'
            }}>Everything You Need</h2>
            <p className="text-xl text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
              Powerful features for seamless collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4" style={{
                    background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                    boxShadow: '0 4px 12px rgba(0, 151, 167, 0.2)'
                  }}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2" style={{
                    fontFamily: 'Space Grotesk, sans-serif',
                    color: '#006064'
                  }}>{feature.title}</h3>
                  <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            © 2025 SkyConnect. Built with care for seamless collaboration.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;