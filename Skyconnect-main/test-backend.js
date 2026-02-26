// Simple test to verify backend is working
const io = require('socket.io-client');

const socket = io('http://localhost:8000');

socket.on('connect', () => {
    console.log('✅ Connected to backend successfully!');
    
    // Test joining a room
    socket.emit('join-call', 'test-room', 'TestUser');
    console.log('📞 Joined test room');
    
    setTimeout(() => {
        socket.disconnect();
        console.log('👋 Disconnected from backend');
        process.exit(0);
    }, 2000);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
});

socket.on('user-joined', (userData) => {
    console.log('👤 User joined:', userData);
});

console.log('🔄 Attempting to connect to backend...');