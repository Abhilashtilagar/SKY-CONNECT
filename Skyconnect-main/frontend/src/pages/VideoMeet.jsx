import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, MessageCircle, 
  PhoneOff, Users, Copy, Check, Maximize2, Minimize2, Send, X, Wifi, WifiOff, Smile, Pin, BarChart3
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
  const [participantStatus, setParticipantStatus] = useState({}); // Track connection status for each participant
  const [unreadMessages, setUnreadMessages] = useState(0); // Track unread message count
  const [typingUsers, setTypingUsers] = useState([]); // Track who is typing
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Emoji picker visibility
  const [pinnedNote, setPinnedNote] = useState(null); // Pinned note: { text, author, timestamp }
  const [showNoteInput, setShowNoteInput] = useState(false); // Note creation modal
  const [noteText, setNoteText] = useState(''); // Note input text
  const [engagementData, setEngagementData] = useState({}); // Engagement tracking per participant
  const [showAnalytics, setShowAnalytics] = useState(false); // Analytics panel visibility
  const [isHost, setIsHost] = useState(false); // Is current user the host
  const [meetingStartTime, setMeetingStartTime] = useState(null); // Meeting start timestamp
  const [copied, setCopied] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isScreenMaximized, setIsScreenMaximized] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const typingTimeoutRef = useRef(null); // Timeout for typing indicator
  const chatScrollRef = useRef(null); // Ref for auto-scrolling chat
  const roomId = window.location.pathname.substring(1) || 'demo-room';

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log('Camera stream obtained:', stream.getTracks().map(t => t.kind));
        setCameraStream(stream);
        cameraStreamRef.current = stream;
        
        // Immediately set to video element
        if (localVideoRef.current) {
          console.log('Setting stream to video element immediately');
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          
          try {
            await localVideoRef.current.play();
            console.log('Video playing immediately after camera init');
          } catch (playError) {
            console.error('Play error:', playError);
          }
        }
      } catch (error) {
        console.error('Camera error:', error);
        toast.error('Camera access denied');
      }
    };
    
    initCamera();
  }, []);

  // Initialize socket
  useEffect(() => {
    console.log('Initializing socket connection...');
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_BACKEND_URL || 'https://skyconnect-backend2.onrender.com'
      : 'http://localhost:8000';
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('Connecting to:', backendUrl);
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
      setSocketConnected(true);
    });
    
    socketRef.current.on('user-joined', (userData) => {
      console.log('👤 User joined:', userData);
      setParticipants(prev => {
        const exists = prev.find(p => p.id === userData.userId);
        if (!exists) {
          // Only create offer if our socket ID is smaller (prevents duplicate offers)
          if (socketRef.current.id < userData.userId) {
            console.log('🤝 Creating offer for new user:', userData.username);
            setTimeout(() => createOffer(userData.userId), 1000);
          } else {
            console.log('⏳ Waiting for offer from:', userData.username);
          }
          return [...prev, { id: userData.userId, name: userData.username, isSelf: false }];
        }
        return prev;
      });
    });

    socketRef.current.on('existing-users', (existingUsers) => {
      console.log('🔍 Existing users received:', existingUsers);
      const users = existingUsers.map(user => ({
        id: user.userId,
        name: user.username,
        isSelf: false
      }));
      
      setParticipants(prev => {
        const selfUser = prev.find(p => p.isSelf);
        
        // Create offers only for users with higher socket IDs
        users.forEach(user => {
          if (socketRef.current.id < user.id) {
            console.log('🤝 Creating offer for existing user:', user.name);
            setTimeout(() => createOffer(user.id), 1000);
          } else {
            console.log('⏳ Waiting for offer from existing user:', user.name);
          }
        });
        
        return selfUser ? [selfUser, ...users] : users;
      });
    });

    socketRef.current.on('user-left', (userId) => {
      console.log('User left:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setParticipants(prev => prev.filter(p => p.id !== userId));
      // Clean up participant status
      setParticipantStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[userId];
        return newStatus;
      });
    });

    socketRef.current.on('signal', (fromUserId, signal) => {
      handleSignal(fromUserId, signal);
    });

    socketRef.current.on('chat-message', (data, sender) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      setMessages(prev => [...prev, { sender, text: data, timestamp }]);
      
      // Increment unread count if chat is closed
      if (!showChat) {
        setUnreadMessages(prev => prev + 1);
      }
    });

    socketRef.current.on('typing-start', (username, userId) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.id === userId)) {
          return [...prev, { id: userId, name: username }];
        }
        return prev;
      });
    });

    socketRef.current.on('typing-stop', (userId) => {
      setTypingUsers(prev => prev.filter(u => u.id !== userId));
    });

    socketRef.current.on('pin-note', (noteData) => {
      console.log('📌 Received pinned note:', noteData);
      setPinnedNote(noteData);
      toast.info(`${noteData.author} pinned a note`);
    });

    socketRef.current.on('dismiss-note', () => {
      console.log('❌ Note dismissed');
      setPinnedNote(null);
    });

    socketRef.current.on('host-status', ({ isHost }) => {
      console.log('👑 Received host status from server:', isHost);
      setIsHost(isHost);
      if (isHost) {
        toast.success('You are the meeting host');
      }
    });

    socketRef.current.on('screen-share-started', (userId) => {
      console.log('Screen sharing started by:', userId);
      // You can add UI indicators here if needed
    });

    socketRef.current.on('screen-share-ended', (userId) => {
      console.log('Screen sharing ended by:', userId);
      // You can add UI indicators here if needed
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

  // Update local video when camera stream changes
  useEffect(() => {
    if (cameraStream && localVideoRef.current) {
      console.log('Setting camera stream to local video element');
      localVideoRef.current.srcObject = cameraStream;
      localVideoRef.current.muted = true;
      cameraStreamRef.current = cameraStream;
      
      // Force play the video immediately
      const playVideo = async () => {
        try {
          await localVideoRef.current.play();
          console.log('Local video is now playing');
        } catch (error) {
          console.error('Error playing local video:', error);
        }
      };
      playVideo();
      
      // Update existing peer connections with new camera stream (if not screen sharing)
      if (!screenStream) {
        Object.values(peersRef.current).forEach(peerConnection => {
          cameraStream.getTracks().forEach(track => {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === track.kind
            );
            if (sender) {
              sender.replaceTrack(track).catch(console.error);
            } else {
              peerConnection.addTrack(track, cameraStream);
            }
          });
        });
      }
    }
  }, [cameraStream, screenStream]);

  // Ensure video plays when connected state changes
  useEffect(() => {
    if (isConnected && cameraStream && localVideoRef.current) {
      console.log('Connected state changed - ensuring video plays');
      localVideoRef.current.srcObject = cameraStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(console.error);
    }
  }, [isConnected, cameraStream]);

  // Update screen video when screen stream changes
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(console.error);
      screenStreamRef.current = screenStream;
    }
  }, [screenStream]);

  // Reset unread messages when chat opens
  useEffect(() => {
    if (showChat) {
      setUnreadMessages(0);
    }
  }, [showChat]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Track mic usage time for engagement
  useEffect(() => {
    if (!isConnected || !meetingStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const totalTime = Math.floor((now - meetingStartTime) / 1000); // seconds

      setEngagementData(prev => {
        const updated = { ...prev };
        
        // Update self
        if (updated['self']) {
          updated['self'] = {
            ...updated['self'],
            totalTime,
            micTime: audio ? updated['self'].micTime + 1 : updated['self'].micTime,
            lastUpdate: now
          };
        }

        // Update all participants
        participants.forEach(p => {
          if (p.id !== 'self' && updated[p.id]) {
            updated[p.id] = {
              ...updated[p.id],
              totalTime,
              lastUpdate: now
            };
            
            // Track remote participant mic usage based on audio status
            const status = participantStatus[p.id];
            if (status && status.audioEnabled) {
              updated[p.id].micTime += 1;
            }
          }
        });

        return updated;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isConnected, meetingStartTime, audio, participants, participantStatus]);

  // Initialize engagement data for new participants
  useEffect(() => {
    if (!isConnected || !meetingStartTime) return;

    participants.forEach(p => {
      if (p.id !== 'self' && !engagementData[p.id]) {
        setEngagementData(prev => ({
          ...prev,
          [p.id]: {
            micTime: 0,
            totalTime: Math.floor((Date.now() - meetingStartTime) / 1000),
            chatMessages: 0,
            lastUpdate: Date.now()
          }
        }));
      }
    });
  }, [participants, isConnected, meetingStartTime, engagementData]);

  // Track chat messages for engagement
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    setEngagementData(prev => {
      const updated = { ...prev };
      
      // Find participant by name
      const participant = participants.find(p => p.name === lastMessage.sender);
      if (participant) {
        const key = participant.isSelf ? 'self' : participant.id;
        if (updated[key]) {
          updated[key] = {
            ...updated[key],
            chatMessages: updated[key].chatMessages + 1
          };
        }
      }

      return updated;
    });
  }, [messages, participants]);

  const createPeerConnection = (userId) => {
    console.log('Creating peer connection for:', userId);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Initialize participant status
    setParticipantStatus(prev => ({
      ...prev,
      [userId]: {
        connectionState: 'connecting',
        videoEnabled: true,
        audioEnabled: true
      }
    }));

    // Add current stream tracks
    const currentStream = screenStreamRef.current || cameraStreamRef.current;
    if (currentStream) {
      console.log('Adding stream tracks for:', userId, currentStream.getTracks().map(t => t.kind));
      currentStream.getTracks().forEach(track => {
        const sender = peerConnection.addTrack(track, currentStream);
        console.log('Added track:', track.kind, 'enabled:', track.enabled);
      });
    } else {
      console.warn('No stream available for peer connection:', userId);
    }

    peerConnection.ontrack = (event) => {
      console.log('📹 ontrack event from:', userId);
      const [remoteStream] = event.streams;
      console.log('Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      
      // Update participant status based on track states
      const videoTrack = remoteStream.getVideoTracks()[0];
      const audioTrack = remoteStream.getAudioTracks()[0];
      
      setParticipantStatus(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          videoEnabled: videoTrack ? videoTrack.enabled : false,
          audioEnabled: audioTrack ? audioTrack.enabled : false
        }
      }));
      
      // Monitor track state changes
      if (videoTrack) {
        videoTrack.onended = () => {
          setParticipantStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], videoEnabled: false }
          }));
        };
      }
      
      if (audioTrack) {
        audioTrack.onended = () => {
          setParticipantStatus(prev => ({
            ...prev,
            [userId]: { ...prev[userId], audioEnabled: false }
          }));
        };
      }
      
      // Set remote video immediately or wait for element
      const setRemoteVideo = () => {
        if (remoteVideosRef.current[userId]) {
          console.log('✅ Setting remote video for:', userId);
          const videoElement = remoteVideosRef.current[userId];
          videoElement.srcObject = remoteStream;
          
          // Force autoplay
          videoElement.autoplay = true;
          videoElement.playsInline = true;
          
          videoElement.play().then(() => {
            console.log('✅ Remote video playing for:', userId);
          }).catch(e => {
            console.error('❌ Remote video play error:', e);
            // Retry play after a short delay
            setTimeout(() => {
              videoElement.play().catch(console.error);
            }, 1000);
          });
        } else {
          console.warn('⚠️ No video element for:', userId, 'retrying in 100ms');
          setTimeout(setRemoteVideo, 100);
        }
      };
      setRemoteVideo();
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('Sending ICE candidate to:', userId);
        socketRef.current.emit('signal', userId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state ${userId}:`, peerConnection.connectionState);
      
      // Update participant status based on connection state
      setParticipantStatus(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          connectionState: peerConnection.connectionState
        }
      }));
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state ${userId}:`, peerConnection.iceConnectionState);
    };

    return peerConnection;
  };

  const createOffer = async (userId) => {
    if (peersRef.current[userId]) {
      console.log('⚠️ Peer connection already exists for:', userId);
      return;
    }
    
    // Use refs to get current stream
    const currentStream = screenStreamRef.current || cameraStreamRef.current;
    if (!currentStream) {
      console.error('❌ No stream available for:', userId);
      return;
    }
    
    console.log('🔄 Creating offer for:', userId, 'with tracks:', currentStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    const peerConnection = createPeerConnection(userId);
    peersRef.current[userId] = peerConnection;

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log('📤 Sending offer to:', userId);
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('signal', userId, { type: 'offer', offer });
      } else {
        console.error('❌ Socket not connected');
        delete peersRef.current[userId];
      }
    } catch (error) {
      console.error('❌ Create offer error:', error);
      delete peersRef.current[userId];
    }
  };

  const handleSignal = async (fromUserId, signal) => {
    console.log('📨 Received signal from:', fromUserId, 'type:', signal.type);
    
    try {
      if (signal.type === 'offer') {
        // Handle offer collision - only lower socket ID creates offer
        if (peersRef.current[fromUserId]) {
          console.log('🔄 Offer collision detected, closing existing connection');
          peersRef.current[fromUserId].close();
          delete peersRef.current[fromUserId];
        }
        
        console.log('📝 Handling offer from:', fromUserId);
        const peerConnection = createPeerConnection(fromUserId);
        peersRef.current[fromUserId] = peerConnection;

        await peerConnection.setRemoteDescription(signal.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('📤 Sending answer to:', fromUserId);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('signal', fromUserId, { type: 'answer', answer });
        }
      } else if (signal.type === 'answer') {
        console.log('📝 Handling answer from:', fromUserId);
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(signal.answer);
          console.log('✅ Answer set for:', fromUserId);
        }
      } else if (signal.type === 'ice-candidate') {
        console.log('🧊 Handling ICE candidate from:', fromUserId);
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection && peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(signal.candidate);
          console.log('✅ ICE candidate added for:', fromUserId);
        } else {
          console.warn('⚠️ Queuing ICE candidate for later');
        }
      }
    } catch (error) {
      console.error('❌ Signal handling error for', fromUserId, ':', error);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!socketConnected) {
      toast.error('Connection not ready. Please wait...');
      return;
    }
    
    // Ensure camera stream is ready
    let stream = cameraStreamRef.current;
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        cameraStreamRef.current = stream;
      } catch (error) {
        toast.error('Camera access required');
        return;
      }
    }
    
    // Immediately set video stream when connecting
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      try {
        await localVideoRef.current.play();
      } catch (playError) {
        console.error('Play error on connect:', playError);
      }
    }
    
    // Set meeting start time (will be used for engagement tracking)
    setMeetingStartTime(Date.now());
    
    // Initialize engagement data for self
    setEngagementData({
      'self': {
        micTime: 0,
        totalTime: 0,
        chatMessages: 0,
        lastUpdate: Date.now()
      }
    });
    
    setParticipants([{ id: 'self', name: username, isSelf: true }]);
    socketRef.current.emit('join-call', roomId, username);
    setIsConnected(true);
    toast.success('Connected to meeting');
  };

  const toggleVideo = () => {
    if (cameraStreamRef.current) {
      const newVideoState = !video;
      cameraStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
      
      // Update all peer connections
      Object.values(peersRef.current).forEach(peerConnection => {
        const videoSender = peerConnection.getSenders().find(sender => 
          sender.track && sender.track.kind === 'video'
        );
        if (videoSender && videoSender.track) {
          videoSender.track.enabled = newVideoState;
        }
      });
      
      setVideo(newVideoState);
      toast.info(newVideoState ? 'Camera on' : 'Camera off');
    }
  };

  const toggleAudio = () => {
    if (cameraStreamRef.current) {
      const newAudioState = !audio;
      cameraStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = newAudioState;
      });
      
      // Update all peer connections
      Object.values(peersRef.current).forEach(peerConnection => {
        const audioSender = peerConnection.getSenders().find(sender => 
          sender.track && sender.track.kind === 'audio'
        );
        if (audioSender && audioSender.track) {
          audioSender.track.enabled = newAudioState;
        }
      });
      
      setAudio(newAudioState);
      toast.info(newAudioState ? 'Unmuted' : 'Muted');
    }
  };

  const toggleScreen = async () => {
    try {
      if (!screen) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        screenStreamRef.current = displayStream;
        
        console.log('📺 Starting screen share');
        
        // Notify other users about screen sharing
        if (socketRef.current) {
          socketRef.current.emit('screen-share-started', 'self');
        }
        
        // Replace video track in all peer connections with screen share
        const replacePromises = Object.values(peersRef.current).map(async (peerConnection) => {
          const videoSender = peerConnection.getSenders().find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          if (videoSender) {
            try {
              await videoSender.replaceTrack(displayStream.getVideoTracks()[0]);
              console.log('✅ Screen track replaced for peer');
            } catch (error) {
              console.error('❌ Error replacing screen track:', error);
            }
          }
        });
        
        await Promise.all(replacePromises);
        
        displayStream.getVideoTracks()[0].onended = async () => {
          console.log('📺 Screen share ended by user');
          setScreen(false);
          setScreenStream(null);
          screenStreamRef.current = null;
          
          // Notify other users screen sharing ended
          if (socketRef.current) {
            socketRef.current.emit('screen-share-ended', 'self');
          }
          
          // Switch back to camera
          if (cameraStreamRef.current) {
            const replaceBackPromises = Object.values(peersRef.current).map(async (peerConnection) => {
              const videoSender = peerConnection.getSenders().find(sender => 
                sender.track && sender.track.kind === 'video'
              );
              if (videoSender) {
                try {
                  await videoSender.replaceTrack(cameraStreamRef.current.getVideoTracks()[0]);
                  console.log('✅ Camera track restored for peer');
                } catch (error) {
                  console.error('❌ Error restoring camera track:', error);
                }
              }
            });
            await Promise.all(replaceBackPromises);
          }
        };
        
        setScreen(true);
        toast.info('Screen sharing started');
      } else {
        console.log('📺 Stopping screen share manually');
        
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Notify other users screen sharing ended
        if (socketRef.current) {
          socketRef.current.emit('screen-share-ended', 'self');
        }
        
        // Switch back to camera
        if (cameraStreamRef.current) {
          const replaceBackPromises = Object.values(peersRef.current).map(async (peerConnection) => {
            const videoSender = peerConnection.getSenders().find(sender => 
              sender.track && sender.track.kind === 'video'
            );
            if (videoSender) {
              try {
                await videoSender.replaceTrack(cameraStreamRef.current.getVideoTracks()[0]);
                console.log('✅ Camera track restored for peer');
              } catch (error) {
                console.error('❌ Error restoring camera track:', error);
              }
            }
          });
          await Promise.all(replaceBackPromises);
        }
        
        setScreenStream(null);
        screenStreamRef.current = null;
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
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      socketRef.current.emit('chat-message', message, username);
      // Stop typing indicator when message is sent
      socketRef.current.emit('typing-stop');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleTyping = (value) => {
    setMessage(value);
    
    // Emit typing-start event
    if (socketRef.current && value.trim()) {
      socketRef.current.emit('typing-start', username);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to emit typing-stop after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current) {
          socketRef.current.emit('typing-stop');
        }
      }, 2000);
    } else if (socketRef.current && !value.trim()) {
      // If input is empty, stop typing
      socketRef.current.emit('typing-stop');
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const insertEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const handlePinNote = () => {
    const wordCount = getWordCount(noteText);
    
    if (wordCount < 10 || wordCount > 20) {
      toast.error('Note must be 10-20 words');
      return;
    }

    const noteData = {
      text: noteText.trim(),
      author: username,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    };

    if (socketRef.current) {
      socketRef.current.emit('pin-note', noteData);
    }

    setNoteText('');
    setShowNoteInput(false);
    toast.success('Note pinned!');
  };

  const handleDismissNote = () => {
    if (socketRef.current) {
      socketRef.current.emit('dismiss-note');
    }
    setPinnedNote(null);
  };

  const calculateEngagement = (userId) => {
    const key = userId === 'self' ? 'self' : userId;
    const data = engagementData[key];
    
    if (!data || data.totalTime === 0) {
      return { score: 0, color: '#ef4444', label: 'Low' };
    }

    // Calculate mic usage score (0-100)
    const micScore = data.totalTime > 0 ? (data.micTime / data.totalTime) * 100 : 0;
    
    // Calculate chat activity score (0-100, capped at 5 messages = 100%)
    const chatScore = Math.min((data.chatMessages / 5) * 100, 100);
    
    // Weighted average: 60% mic, 40% chat
    const score = (micScore * 0.6) + (chatScore * 0.4);
    
    // Determine color and label
    let color, label;
    if (score >= 70) {
      color = '#10b981'; // Green
      label = 'High';
    } else if (score >= 40) {
      color = '#f59e0b'; // Yellow/Amber
      label = 'Medium';
    } else {
      color = '#ef4444'; // Red
      label = 'Low';
    }
    
    return { score: Math.round(score), color, label };
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
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
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
                disabled={!username.trim() || !socketConnected}
                className="w-full h-12 text-base font-medium"
                style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
              >
                {!socketConnected ? 'Connecting...' : 'Join Meeting'}
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
          <Button 
            onClick={() => setShowNoteInput(true)} 
            variant="ghost" 
            className="h-8 px-3 text-xs bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
            title="Pin a note for all participants"
          >
            <Pin className="w-3 h-3 mr-1" /> Pin Note
          </Button>
          {(() => {
            console.log('📊 Analytics Button Render Check:', { isHost, isConnected, username });
            return isHost && (
              <Button 
                onClick={() => setShowAnalytics(!showAnalytics)} 
                variant="ghost" 
                className={`h-8 px-3 text-xs ${showAnalytics ? 'bg-amber-500/30' : 'bg-amber-500/20'} text-amber-300 hover:bg-amber-500/30`}
                title="View engagement analytics (Host only)"
              >
                <BarChart3 className="w-3 h-3 mr-1" /> Analytics
              </Button>
            );
          })()}
          <Button onClick={() => setShowParticipants(!showParticipants)} variant="ghost" className={showParticipants ? 'bg-cyan-500/20' : ''}>
            <Users className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Note Input Modal */}
      {showNoteInput && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowNoteInput(false)}
        >
          <Card 
            className="w-full max-w-md mx-4"
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="pt-6 pb-6 px-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Pin a Note</h3>
                <Button 
                  onClick={() => setShowNoteInput(false)} 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                Create a short note (10-20 words) visible to all participants
              </p>
              
              <div className="space-y-4">
                <div>
                  <Input
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="e.g., Break at 4 PM"
                    className="w-full"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span 
                      className="text-xs"
                      style={{ 
                        color: getWordCount(noteText) < 10 || getWordCount(noteText) > 20 
                          ? '#ef4444' 
                          : '#10b981' 
                      }}
                    >
                      {getWordCount(noteText)}/20 words
                      {getWordCount(noteText) < 10 && ' (min 10)'}
                      {getWordCount(noteText) > 20 && ' (max 20)'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowNoteInput(false)}
                    variant="ghost"
                    className="flex-1"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePinNote}
                    disabled={getWordCount(noteText) < 10 || getWordCount(noteText) > 20}
                    className="flex-1"
                    style={{ 
                      background: getWordCount(noteText) >= 10 && getWordCount(noteText) <= 20
                        ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                        : 'rgba(139, 92, 246, 0.3)',
                      cursor: getWordCount(noteText) >= 10 && getWordCount(noteText) <= 20
                        ? 'pointer'
                        : 'not-allowed'
                    }}
                  >
                    <Pin className="w-4 h-4 mr-2" /> Pin Note
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pinned Note Display */}
      {pinnedNote && (
        <div 
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 animate-in slide-in-from-top duration-300"
          style={{ maxWidth: '600px', width: 'calc(100% - 2rem)' }}
        >
          <Card
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(0, 172, 193, 0.5)',
              boxShadow: '0 10px 40px rgba(0, 172, 193, 0.3)'
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
                >
                  <Pin className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-cyan-400">{pinnedNote.author}</span>
                    <span className="text-xs text-gray-500">{pinnedNote.timestamp}</span>
                  </div>
                  <p className="text-white text-base leading-relaxed">{pinnedNote.text}</p>
                </div>
                <Button
                  onClick={handleDismissNote}
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-8 w-8 p-0 hover:bg-red-500/20"
                  title="Dismiss note"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  display: video && cameraStream ? 'block' : 'none'
                }}
                onLoadedData={() => console.log('Local video data loaded')}
                onCanPlay={() => console.log('Local video can play')}
                onPlay={() => console.log('Local video started playing')}
                onError={(e) => console.error('Local video error:', e)}
              />
              {(!video || !cameraStream) && (
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
                  style={{ background: '#2a2a2a' }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                  background: 'rgba(0, 0, 0, 0.6)'
                }}>
                  <span className="text-sm text-white font-medium">{participant.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Analytics Panel (Host Only) */}
        {showAnalytics && isHost && (
          <div className="w-96 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Engagement Analytics</h3>
                </div>
                <Button onClick={() => setShowAnalytics(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {participants.map((participant) => {
                    const engagement = calculateEngagement(participant.isSelf ? 'self' : participant.id);
                    const data = engagementData[participant.isSelf ? 'self' : participant.id];
                    
                    return (
                      <div 
                        key={participant.id}
                        className="p-3 rounded-lg"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar className="w-10 h-10" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                            <AvatarFallback className="text-white font-semibold">
                              {participant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {participant.name} {participant.isSelf && '(You)'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {engagement.label} Engagement
                            </p>
                          </div>
                          <div 
                            className="px-2 py-1 rounded text-xs font-bold"
                            style={{ 
                              background: `${engagement.color}20`,
                              color: engagement.color
                            }}
                          >
                            {engagement.score}%
                          </div>
                        </div>
                        
                        {/* Engagement Bar */}
                        <div className="mb-2">
                          <div 
                            className="h-2 rounded-full overflow-hidden"
                            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${engagement.score}%`,
                                background: `linear-gradient(to right, ${engagement.color}, ${engagement.color}dd)`
                              }}
                            />
                          </div>
                        </div>
                        
                        {/* Metrics */}
                        {data && (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-400">
                              <Mic className="w-3 h-3" />
                              <span>
                                {Math.floor(data.micTime / 60)}m {data.micTime % 60}s
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <MessageCircle className="w-3 h-3" />
                              <span>{data.chatMessages} messages</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {participants.length === 0 && (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-sm text-gray-400">No participants yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">Participants</h3>
                  <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold" style={{
                    background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                    color: 'white'
                  }}>
                    {participants.length}
                  </div>
                </div>
                <Button onClick={() => setShowParticipants(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {participants.map((participant) => {
                    const status = participantStatus[participant.id] || { 
                      connectionState: 'connected', 
                      videoEnabled: true, 
                      audioEnabled: true 
                    };
                    
                    // Determine connection status color and icon
                    let statusColor = '#10b981'; // green - connected
                    let StatusIcon = Wifi;
                    if (status.connectionState === 'connecting' || status.connectionState === 'new') {
                      statusColor = '#f59e0b'; // yellow - connecting
                    } else if (status.connectionState === 'disconnected' || status.connectionState === 'failed' || status.connectionState === 'closed') {
                      statusColor = '#ef4444'; // red - disconnected
                      StatusIcon = WifiOff;
                    }
                    
                    return (
                      <div 
                        key={participant.id} 
                        className="flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-white/5" 
                        style={{
                          background: participant.isSelf ? 'rgba(0, 172, 193, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                          border: participant.isSelf ? '1px solid rgba(0, 172, 193, 0.3)' : '1px solid transparent'
                        }}
                      >
                        <div className="relative">
                          <Avatar style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                            <AvatarFallback className="text-white font-semibold">
                              {participant.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Connection status indicator */}
                          <div 
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                            style={{ 
                              background: statusColor,
                              borderColor: 'rgba(26, 26, 26, 0.95)'
                            }}
                            title={status.connectionState || 'connected'}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {participant.name}
                            </p>
                            {participant.isSelf && (
                              <span className="text-xs text-gray-400">(You)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: participant.isSelf ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                color: participant.isSelf ? '#00acc1' : '#9ca3af'
                              }}
                            >
                              {participant.isSelf ? 'Host' : 'Participant'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Audio/Video status indicators */}
                        <div className="flex items-center gap-1.5">
                          {participant.isSelf ? (
                            <>
                              <div 
                                className="p-1.5 rounded-full"
                                style={{ background: audio ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                                title={audio ? 'Microphone on' : 'Microphone off'}
                              >
                                {audio ? 
                                  <Mic className="w-3.5 h-3.5 text-green-400" /> : 
                                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                                }
                              </div>
                              <div 
                                className="p-1.5 rounded-full"
                                style={{ background: video ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                                title={video ? 'Camera on' : 'Camera off'}
                              >
                                {video ? 
                                  <Video className="w-3.5 h-3.5 text-green-400" /> : 
                                  <VideoOff className="w-3.5 h-3.5 text-red-400" />
                                }
                              </div>
                            </>
                          ) : (
                            <>
                              <div 
                                className="p-1.5 rounded-full"
                                style={{ background: status.audioEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                                title={status.audioEnabled ? 'Microphone on' : 'Microphone off'}
                              >
                                {status.audioEnabled ? 
                                  <Mic className="w-3.5 h-3.5 text-green-400" /> : 
                                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                                }
                              </div>
                              <div 
                                className="p-1.5 rounded-full"
                                style={{ background: status.videoEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}
                                title={status.videoEnabled ? 'Camera on' : 'Camera off'}
                              >
                                {status.videoEnabled ? 
                                  <Video className="w-3.5 h-3.5 text-green-400" /> : 
                                  <VideoOff className="w-3.5 h-3.5 text-red-400" />
                                }
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {participants.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                      <p className="text-sm text-gray-400">No participants yet</p>
                    </div>
                  )}
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
              
              <div 
                ref={chatScrollRef}
                className="flex-1 p-4 overflow-y-auto"
                style={{ scrollBehavior: 'smooth' }}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                    <p className="text-sm text-gray-400">No messages yet</p>
                    <p className="text-xs text-gray-500 mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div 
                        key={index} 
                        className="animate-in slide-in-from-bottom-2 duration-200"
                      >
                        <div className="flex items-start gap-2">
                          <Avatar className="w-7 h-7 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                            <AvatarFallback className="text-white text-xs font-semibold">
                              {msg.sender.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <p className="text-xs font-medium text-cyan-400">{msg.sender}</p>
                              {msg.timestamp && (
                                <p className="text-xs text-gray-500">{msg.timestamp}</p>
                              )}
                            </div>
                            <div 
                              className="inline-block px-3 py-2 rounded-lg max-w-full break-words"
                              style={{ 
                                background: 'rgba(0, 172, 193, 0.1)',
                                border: '1px solid rgba(0, 172, 193, 0.2)'
                              }}
                            >
                              <p className="text-sm text-white">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400 animate-in fade-in duration-200">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span>
                      {typingUsers.length === 1 
                        ? `${typingUsers[0].name} is typing...`
                        : typingUsers.length === 2
                        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                        : `${typingUsers.length} people are typing...`
                      }
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div 
                    className="mb-3 p-3 rounded-lg grid grid-cols-8 gap-2"
                    style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                  >
                    {['😀', '😂', '❤️', '👍', '👎', '🎉', '🔥', '✅', '❌', '🤔', '👏', '🙌', '💯', '✨', '🚀', '💪'].map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => insertEmoji(emoji)}
                        className="text-2xl hover:scale-125 transition-transform cursor-pointer"
                        style={{ background: 'transparent', border: 'none' }}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                    style={{ 
                      background: showEmojiPicker ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      color: showEmojiPicker ? '#00acc1' : '#9ca3af'
                    }}
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                  <Input
                    value={message}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
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

          <Button
            onClick={() => setShowChat(!showChat)}
            variant="ghost"
            className={`h-12 w-12 rounded-full relative ${showChat ? 'bg-cyan-500/20' : ''}`}
            style={{
              background: showChat ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <MessageCircle className="w-5 h-5" />
            {unreadMessages > 0 && !showChat && (
              <div 
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white'
                }}
              >
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </div>
            )}
          </Button>

          {/* Debug: Camera refresh button */}
          {!cameraStream && (
            <Button
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                  setCameraStream(stream);
                  toast.success('Camera refreshed');
                } catch (error) {
                  toast.error('Camera refresh failed');
                }
              }}
              variant="ghost"
              className="h-12 w-12 rounded-full bg-yellow-500/20"
            >
              <Video className="w-5 h-5 text-yellow-400" />
            </Button>
          )}

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