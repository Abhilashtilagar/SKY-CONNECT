import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, History, LogOut, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '../utils/errorHandler';

const Home = () => {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');

  const handleJoinVideoCall = () => {
    if (meetingCode.trim()) {
      navigate(`/${meetingCode}`);
    } else {
      toast.error('Please enter a meeting code');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      setTimeout(() => navigate('/auth'), 500);
    } catch (error) {
      handleError(error, 'Logout failed');
      navigate('/auth');
    }
  };

  const quickStats = [
    { label: 'Total Meetings', value: '24', icon: <Video className="w-5 h-5" /> },
    { label: 'Hours Spent', value: '48h', icon: <Clock className="w-5 h-5" /> },
    { label: 'This Week', value: '8', icon: <Calendar className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
    }}>
      {/* Navigation Bar */}
      <nav className="px-6 py-4" style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 151, 167, 0.1)'
      }}>
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

          <div className="flex items-center gap-3">
            <Button
              data-testid="history-btn"
              onClick={() => navigate('/history')}
              variant="ghost"
              className="gap-2"
              style={{ fontFamily: 'Inter, sans-serif', color: '#0097a7' }}
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
              variant="outline"
              className="gap-2"
              style={{
                fontFamily: 'Inter, sans-serif',
                borderColor: '#0097a7',
                color: '#0097a7'
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Welcome & Stats */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold mb-4" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#006064'
              }}>
                Welcome Back!
              </h1>
              <p className="text-xl text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                Ready to connect? Join an existing meeting or start a new one.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index} style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2" style={{ color: '#0097a7' }}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold mb-1" style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      color: '#006064'
                    }}>{stat.value}</p>
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Highlights */}
            <div className="p-6 rounded-xl" style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.5)'
            }}>
              <h3 className="text-lg font-semibold mb-3" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#006064'
              }}>Why Choose SkyConnect?</h3>
              <ul className="space-y-2 text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#00c853' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Crystal-clear HD video quality</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#00c853' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Secure end-to-end encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: '#00c853' }}>
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Real-time screen sharing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Join Meeting Card */}
          <Card className="shadow-2xl" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
                  background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                  boxShadow: '0 10px 30px rgba(0, 151, 167, 0.3)'
                }}>
                  <Video className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  color: '#006064'
                }}>Join a Meeting</h2>
                <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Enter the meeting code to continue</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    data-testid="meeting-code-input"
                    type="text"
                    placeholder="Enter Meeting Code"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                    className="h-14 text-lg text-center font-semibold"
                    style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em' }}
                  />
                </div>

                <Button
                  data-testid="join-call-btn"
                  onClick={handleJoinVideoCall}
                  disabled={!meetingCode.trim()}
                  className="w-full h-14 text-base font-medium"
                  style={{
                    background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Join Video Call
                </Button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-gray-500" style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    fontFamily: 'Inter, sans-serif'
                  }}>or</span>
                </div>
              </div>

              <Button
                data-testid="create-new-meeting-btn"
                onClick={() => {
                  try {
                    const newCode = Math.random().toString(36).substring(2, 15);
                    navigate(`/${newCode}`);
                  } catch (error) {
                    handleError(error, 'Failed to create meeting');
                  }
                }}
                variant="outline"
                className="w-full h-12 text-base font-medium"
                style={{
                  borderColor: '#0097a7',
                  color: '#0097a7',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.3s ease'
                }}
              >
                Create New Meeting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;