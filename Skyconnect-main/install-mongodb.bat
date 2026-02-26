@echo off
echo 🍃 Installing MongoDB for SkyConnect...
echo.

echo 📥 Downloading MongoDB Community Server...
echo 💡 This will open MongoDB download page in your browser
echo.
echo After installation:
echo 1. MongoDB will run automatically as a Windows service
echo 2. Default connection: mongodb://localhost:27017
echo 3. No additional setup needed!
echo.

start https://www.mongodb.com/try/download/community

echo.
echo 🔄 Alternative: Use MongoDB Atlas (Cloud)
echo 1. Go to https://cloud.mongodb.com
echo 2. Create free account
echo 3. Create cluster
echo 4. Get connection string
echo 5. Update .env file with your connection string
echo.

pause