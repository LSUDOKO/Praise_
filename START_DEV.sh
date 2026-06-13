#!/bin/bash

echo "🚀 Starting PRaise Development Server"
echo "======================================"
echo ""

# Check if root .env exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found in root directory!"
    echo "   Please copy .env.example to .env and configure."
    echo ""
    exit 1
fi

# Copy .env to frontend/ if it doesn't exist or is older
if [ ! -f frontend/.env ] || [ .env -nt frontend/.env ]; then
    echo "📋 Copying .env to frontend/..."
    cp .env frontend/.env
    echo "   ✅ Done!"
    echo ""
fi

# Check if Web3Auth Client ID is set
if ! grep -q "NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BJS8Oyqi6CCqIFEm8V9qUw_4KRR3SLeqrbwxEOwi4TytPvICQ-o3FV5okwVSbNdPcyfJVagtC07wBv9KkBmIifc" frontend/.env; then
    echo "⚠️  Warning: NEXT_PUBLIC_WEB3AUTH_CLIENT_ID not properly set"
    echo ""
fi

# Check if Bundler RPC is set
if ! grep -q "NEXT_PUBLIC_BUNDLER_RPC_URL" frontend/.env; then
    echo "⚠️  Warning: NEXT_PUBLIC_BUNDLER_RPC_URL not set"
    echo "   Get a free API key from https://dashboard.pimlico.io"
    echo ""
fi

echo "✅ Environment checks passed!"
echo ""
echo "⚠️  IMPORTANT: Disable Browser Wallet Extensions!"
echo "   Extensions like MetaMask, Nightly, Phantom conflict with Web3Auth"
echo "   Either:"
echo "   1. Disable wallet extensions in browser settings"
echo "   2. Use incognito mode (Ctrl+Shift+N / Cmd+Shift+N)"
echo "   3. Create separate browser profile without extensions"
echo ""
echo "📦 Installing dependencies..."
cd frontend
npm install --legacy-peer-deps

echo ""
echo "🔥 Starting Next.js development server..."
echo ""
echo "   ✅ Web3Auth: Enabled"
echo "   ✅ Smart Accounts: Enabled"
echo "   ✅ Delegations: Enabled"
echo ""
echo "   🌐 Visit: http://localhost:3000"
echo "   📊 Dashboard: http://localhost:3000/dashboard"
echo ""
echo "   ⚠️  Remember: Disable wallet extensions or use incognito!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
