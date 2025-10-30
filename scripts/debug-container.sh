#!/bin/bash
# Debug script to diagnose container startup issues
# Run this inside the container to see what's failing

echo "🔍 Container Diagnostic Report"
echo "=============================="
echo ""

echo "📁 File System Check:"
echo "---------------------"
echo "Current directory:"
pwd
echo ""

echo "App directory contents:"
ls -la /app/ || echo "❌ /app directory not found"
echo ""

echo "Dist directory contents:"
ls -la /app/dist/ || echo "❌ /app/dist directory not found"
echo ""

echo "Main.js exists?"
if [ -f "/app/dist/main.js" ]; then
    echo "✅ /app/dist/main.js exists"
    ls -lh /app/dist/main.js
else
    echo "❌ /app/dist/main.js NOT FOUND"
fi
echo ""

echo "📦 Node.js Environment:"
echo "----------------------"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "TSX version: $(tsx --version 2>&1 || echo 'not installed')"
echo ""

echo "👤 User & Permissions:"
echo "---------------------"
echo "Current user: $(whoami)"
echo "User ID: $(id -u)"
echo "Group ID: $(id -g)"
echo ""

echo "🔑 Critical Environment Variables:"
echo "----------------------------------"
echo "NODE_ENV: ${NODE_ENV:-not set}"
echo "PORT: ${PORT:-not set}"
echo "DATABASE_URL: ${DATABASE_URL:+<set>} ${DATABASE_URL:-not set}"
echo "PRIVATE_KEY: ${PRIVATE_KEY:+<set (${#PRIVATE_KEY} chars)>} ${PRIVATE_KEY:-not set}"
echo "PUBLIC_KEY: ${PUBLIC_KEY:+<set (${#PUBLIC_KEY} chars)>} ${PUBLIC_KEY:-not set}"
echo ""

echo "🧪 Test Node Execution:"
echo "----------------------"
echo "Testing: node dist/main.js"
timeout 5s node dist/main.js 2>&1 || echo "❌ Node execution failed or timed out"
echo ""

echo "📋 Last 50 lines of logs (if available):"
echo "---------------------------------------"
if [ -f "/app/logs/app.log" ]; then
    tail -50 /app/logs/app.log
else
    echo "No log file found at /app/logs/app.log"
fi
echo ""

echo "🏥 Health Check Test:"
echo "--------------------"
echo "Attempting to start server and check health..."
timeout 10s node dist/main.js &
NODE_PID=$!
sleep 5
curl -f http://localhost:3000/health 2>&1 || echo "❌ Health check failed"
kill $NODE_PID 2>/dev/null
echo ""

echo "✅ Diagnostic complete!"
