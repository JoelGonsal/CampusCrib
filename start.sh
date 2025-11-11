#!/bin/bash

echo "🚀 Starting CampusCrib Application..."

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    echo "❌ MySQL is not running. Please start MySQL first."
    echo "   You can start it with: sudo /usr/local/mysql/support-files/mysql.server start"
    exit 1
fi

echo "✅ MySQL is running"

# Kill any existing processes on these ports
echo "🧹 Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend server on port 3000..."
cd server
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on port 8080..."
python3 -m http.server 8080 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

echo ""
echo "🎉 CampusCrib is now running!"
echo ""
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3000"
echo "🖼️  Images: All PG and tiffin images are now available!"
echo ""
echo "🔑 Test Login Credentials:"
echo "   Email: aksh@nmims.edu"
echo "   Password: password123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait