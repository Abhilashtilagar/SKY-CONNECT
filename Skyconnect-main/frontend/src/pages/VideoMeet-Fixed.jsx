import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff, 
  MessageCircle, 
  PhoneOff, 
  Users, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  Send,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const VideoMeet = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isScreenMaximized, setIsScreenMaximized] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({});
  
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const roomId = window.location.pathname.substring(1) || 'demo-room';

  // Initialize camera stream
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 }, 
          audio: true 
        });
        setCameraStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch(console.error);
        }
      } catch (error) {
        console.error('Camera access error:', error);
        toast.error('Camera access required');
      }
    };
    initCamera();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:8000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('user-joined', (userData) => {
      console.log('User joined:', userData);
      setParticipants(prev => {
        const exists = prev.find(p => p.id === userData.userId);
        if (!exists) {
          return [...prev, { id: userData.userId, name: userData.username, isSelf: false }];
        }
        return prev;
      });
    });

    socketRef.current.on('existing-users', (existingUsers) => {
      console.log('Existing users:', existingUsers);
      const users = existingUsers.map(user => ({
        id: user.userId,
        name: user.username,
        isSelf: false
      }));
      
      setParticipants(prev => {
        const selfUser = prev.find(p => p.isSelf);
        return selfUser ? [selfUser, ...users] : users;
      });

      // Create peer connections for existing users
      users.forEach(user => {
        setTimeout(() => createOffer(user.id), 1000);
      });
    });

    socketRef.current.on('user-left', (userId) => {
      console.log('User left:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setRemoteStreams(prev => {
        const newStreams = { ...prev };
        delete newStreams[userId];
        return newStreams;
      });
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    socketRef.current.on('signal', (fromUserId, signal) => {
      handleSignal(fromUserId, signal);
    });

    socketRef.current.on('chat-message', (data, sender) => {
      setMessages(prev => [...prev, { sender, text: data }]);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, cameraStream);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      console.log('Remote stream received from:', userId);
      
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: remoteStream
      }));

      // Set video element
      setTimeout(() => {
        if (remoteVideosRef.current[userId]) {
          remoteVideosRef.current[userId].srcObject = remoteStream;
          remoteVideosRef.current[userId].play().catch(console.error);
        }
      }, 100);
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('signal', userId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection with ${userId}:`, peerConnection.connectionState);
    };

    return peerConnection;
  };

  const createOffer = async (userId) => {
    if (peersRef.current[userId]) return;
    
    const peerConnection = createPeerConnection(userId);
    peersRef.current[userId] = peerConnection;

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      socketRef.current.emit('signal', userId, {
        type: 'offer',
        offer: offer
      });
    } catch (error) {
      console.error('Create offer error:', error);
    }
  };

  const handleSignal = async (fromUserId, signal) => {
    try {
      if (signal.type === 'offer') {
        if (peersRef.current[fromUserId]) return;
        
        const peerConnection = createPeerConnection(fromUserId);
        peersRef.current[fromUserId] = peerConnection;

        await peerConnection.setRemoteDescription(signal.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socketRef.current.emit('signal', fromUserId, {
          type: 'answer',
          answer: answer
        });
      } else if (signal.type === 'answer') {
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(signal.answer);
        }
      } else if (signal.type === 'ice-candidate') {
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection && peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(signal.candidate);
        }
      }
    } catch (error) {
      console.error('Signal handling error:', error);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) return;
    if (!cameraStream) {
      toast.error('Please wait for camera to initialize');
      return;
    }

    setParticipants([{ id: 'self', name: username, isSelf: true }]);
    socketRef.current.emit('join-call', roomId, username);
    setIsConnected(true);
    toast.success('Connected to meeting');
  };

  const toggleVideo = () => {
    if (cameraStream) {
      const videoTracks = cameraStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !video;
      });
      setVideo(!video);
      toast.info(!video ? 'Camera on' : 'Camera off');
    }
  };

  const toggleAudio = () => {
    if (cameraStream) {
      const audioTracks = cameraStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audio;
      });
      setAudio(!audio);
      toast.info(!audio ? 'Unmuted' : 'Muted');
    }
  };

  const toggleScreen = async () => {
    try {
      if (!screen) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        displayStream.getVideoTracks()[0].onended = () => {
          setScreen(false);
          setScreenStream(null);
        };
        setScreen(true);
        toast.info('Screen sharing started');
      } else {
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setScreen(false);
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Screen sharing failed');
    }
  };

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', message, username);
      setMessage('');
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy room ID');
    }
  };

  const handleEndCall = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    socketRef.current?.disconnect();
    navigate('/');
  };

  const getGridLayout = () => {
    const total = participants.length + (screen ? 1 : 0);
    if (total <= 1) return 'flex items-center justify-center';
    if (total === 2) return 'grid grid-cols-2 gap-4';
    if (total <= 4) return 'grid grid-cols-2 gap-4';
    return 'grid grid-cols-3 gap-4';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
      }}>
        <Card className="w-full max-w-md" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
                background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                boxShadow: '0 10px 30px rgba(0, 151, 167, 0.3)'
              }}>
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Join Meeting</h1>
              <p className="text-gray-600">Enter your name to continue</p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                className="h-12 text-base"
              />
              <Button
                onClick={handleConnect}
                disabled={!username.trim() || !cameraStream}
                className="w-full h-12 text-base font-medium"
                style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
              >
                {!cameraStream ? 'Initializing camera...' : 'Join Meeting'}
              </Button>
            </div>

            <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0, 151, 167, 0.05)' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ background: '#1a1a1a', aspectRatio: '16/9' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">SkyConnect Meeting</h2>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <span className="text-sm text-gray-300">Room: {roomId}</span>
          </div>
          <Button onClick={copyRoomId} variant="ghost" className="h-8 px-3 text-xs bg-cyan-500/20 text-cyan-300">
            {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy ID</>}
          </Button>
          <Button onClick={() => setShowParticipants(!showParticipants)} variant="ghost">
            <Users className="w-5 h-5" />
          </Button>
          <Button onClick={() => setShowChat(!showChat)} variant="ghost">
            <MessageCircle className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`h-full ${getGridLayout()}`}>
            {/* Screen Share */}
            {screen && (
              <Card className="relative overflow-hidden" style={{
                background: 'rgba(40, 40, 40, 0.8)',
                border: '2px solid #00acc1'
              }}>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ background: '#2a2a2a' }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                  background: 'rgba(0, 172, 193, 0.8)'
                }}>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3 h-3 text-white" />
                    <span className="text-sm text-white font-medium">{username} - Screen</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Local Video */}
            <Card className="relative overflow-hidden" style={{
              background: 'rgba(40, 40, 40, 0.8)',
              border: '2px solid #00acc1'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ 
                  background: '#2a2a2a',
                  transform: 'scaleX(-1)',
                  display: video ? 'block' : 'none'
                }}
              />
              {!video && (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#2a2a2a' }}>
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2" style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                      <AvatarFallback className="text-white font-semibold text-xl">
                        {username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-gray-400 text-sm">Camera is off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                background: 'rgba(0, 172, 193, 0.8)'
              }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{username} (You)</span>
                  {audio ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>
            </Card>

            {/* Remote Videos */}
            {participants.filter(p => !p.isSelf).map((participant) => (
              <Card key={participant.id} className="relative overflow-hidden" style={{
                background: 'rgba(40, 40, 40, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <video
                  ref={el => {
                    if (el) remoteVideosRef.current[participant.id] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ 
                    background: '#2a2a2a',
                    display: remoteStreams[participant.id] ? 'block' : 'none'
                  }}
                />
                {!remoteStreams[participant.id] && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
                    <div className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-2" style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                        <AvatarFallback className="text-white font-semibold text-xl">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-gray-400 text-sm">Connecting...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                  background: 'rgba(0, 0, 0, 0.6)'
                }}>
                  <span className="text-sm text-white font-medium">{participant.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold text-white">Participants ({participants.length})</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg" style={{
                      background: participant.isSelf ? 'rgba(0, 172, 193, 0.1)' : 'rgba(255, 255, 255, 0.03)'
                    }}>
                      <Avatar style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                        <AvatarFallback className="text-white font-semibold">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {participant.name} {participant.isSelf && '(You)'}
                        </p>
                        <p className="text-xs text-gray-400">{participant.isSelf ? 'Host' : 'Participant'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-96 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold text-white">Chat</h3>
                <Button onClick={() => setShowChat(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-8">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div key={index} className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#00acc1' }}>{msg.sender}</p>
                        <p className="text-sm text-white">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-24 px-6 flex items-center justify-center" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleVideo}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${video ? '' : 'bg-red-500/20'}`}
            style={{
              background: video ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            {video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
          </Button>

          <Button
            onClick={toggleAudio}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${audio ? '' : 'bg-red-500/20'}`}
            style={{
              background: audio ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            {audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </Button>

          <Button
            onClick={toggleScreen}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${screen ? 'bg-cyan-500/20' : ''}`}
            style={{
              background: screen ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {screen ? <MonitorOff className="w-5 h-5 text-cyan-400" /> : <Monitor className="w-5 h-5" />}
          </Button>

          <Separator orientation="vertical" className="h-8 mx-2" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />

          <Button
            onClick={handleEndCall}
            className="h-12 px-6 rounded-full font-medium"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoMeet;