#!/usr/bin/env bash
# Startup script for Auction Intel Locally

# Find and kill any old instances of the backend or frontend
lsof -ti :8080 | xargs kill -9 2>/dev/null || true
lsof -ti :4173 | xargs kill -9 2>/dev/null || true
lsof -ti :5174 | xargs kill -9 2>/dev/null || true

echo "============================================="
echo "Building Frontend for Production preview..."
echo "============================================="
export VITE_API_URL="http://127.0.0.1:8080/api"
npm run build

echo "============================================="
echo "Starting Backend API on Port 8080..."
echo "============================================="
cd backend
host=127.0.0.1 PORT=8080 cargo run &> /tmp/auction_intel_backend.log &
cd ..

echo "Waiting for backend to boot..."
sleep 3
# Verify Backend Health
if curl -s http://127.0.0.1:8080/api/health > /dev/null; then
    echo "✅ Backend is healthy and running!"
else
    echo "❌ WARNING: Backend failed to start. Check /tmp/auction_intel_backend.log"
fi

echo "============================================="
echo "Serving Frontend built module on Port 4173..."
echo "============================================="
npm run preview -- --host 127.0.0.1 --port 4173 &> /tmp/auction_intel_frontend.log &

echo "Waiting for frontend to boot..."
sleep 2

if curl -I -s http://127.0.0.1:4173 | head -n 1 | grep "200" > /dev/null; then
    echo "✅ Frontend is serving properly!"
else
    echo "❌ WARNING: Frontend failed to start on 4173. Check /tmp/auction_intel_frontend.log"
fi

echo "============================================="
echo "🚀 PLATFORM LIVE!"
echo "Access the Production-Built platform here:"
echo "👉 http://127.0.0.1:4173/"
echo "============================================="
