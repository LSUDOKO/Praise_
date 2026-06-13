#!/bin/bash

# PRaise Web3Auth Integration Test Script
# Run this to test the Web3Auth integration

echo "🚀 PRaise - Web3Auth Integration Test"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✓ Project root detected"
echo ""

# Check environment variables
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."
    cp .env.example .env 2>/dev/null || echo "   No .env.example found"
fi

# Check if Client ID is configured
if grep -q "NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=" .env; then
    echo "✓ Web3Auth Client ID configured"
else
    echo "❌ Error: NEXT_PUBLIC_WEB3AUTH_CLIENT_ID not set in .env"
    exit 1
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "frontend/node_modules/@web3auth" ]; then
    echo "⚠️  Web3Auth packages not found"
    echo "   Installing dependencies..."
    cd frontend
    npm install --legacy-peer-deps
    cd ..
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies installed"
fi

echo ""
echo "🔧 Starting development server..."
echo ""
echo "   Frontend: http://localhost:3000"
echo "   Test Page: http://localhost:3000/test-wallet"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the development server
cd frontend
npm run dev
