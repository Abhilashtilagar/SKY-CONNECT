// Quick test to verify backend is running
const http = require('http');

console.log('🔍 Testing SkyConnect setup...\n');

// Test backend
const testBackend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8000', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Backend is running on port 8000');
        console.log('📡 Response:', data);
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend is NOT running on port 8000');
      console.log('💡 Run: cd backend && npm run dev');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Backend connection timeout');
      resolve(false);
    });
  });
};

// Test frontend
const testFrontend = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Frontend is running on port 3000');
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend is NOT running on port 3000');
      console.log('💡 Run: cd frontend && npm start');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('⏰ Frontend connection timeout');
      resolve(false);
    });
  });
};

const runTests = async () => {
  const backendOk = await testBackend();
  const frontendOk = await testFrontend();
  
  console.log('\n📋 Setup Status:');
  console.log(`Backend (port 8000): ${backendOk ? '✅' : '❌'}`);
  console.log(`Frontend (port 3000): ${frontendOk ? '✅' : '❌'}`);
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 Both servers are running! You can test video calling now.');
    console.log('🌐 Open http://localhost:3000 in two different browser tabs/windows');
  } else {
    console.log('\n⚠️  Start the missing servers first:');
    if (!backendOk) console.log('   cd backend && npm run dev');
    if (!frontendOk) console.log('   cd frontend && npm start');
  }
};

runTests();