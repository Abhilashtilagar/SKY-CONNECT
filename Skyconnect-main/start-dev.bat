@echo off
echo 🚀 Starting SkyConnect Development Servers...
echo.

echo 🍃 Using MongoDB Atlas (Cloud Database)
echo ✅ Database ready

echo 📡 Starting Backend Server...
start "SkyConnect Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak > nul

echo 🌐 Starting Frontend Server...
start "SkyConnect Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ All servers are starting...
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8000
echo 🍃 Database: MongoDB Atlas (Cloud)
echo.
echo 💡 Open http://localhost:3000 in TWO different browser windows to test!
pause