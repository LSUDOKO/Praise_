# PRaise - Quick Start Guide

## Start Development Server

### Option 1: Use Start Script (Recommended)

```bash
./START_DEV.sh
```

### Option 2: Manual Start

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Then visit: **http://localhost:3000**

## Features Available

✅ **Web3Auth Embedded Wallet** - Connect with Google/GitHub/Discord  
✅ **Smart Accounts** - Auto-created with ERC-4337  
✅ **Delegations** - ERC-7710 scoped permissions  
✅ **Navbar Integration** - Real wallet connection (no test page)  
✅ **Mobile Responsive** - Works on all devices  

## Test the Integration

1. Click **"Connect Wallet"** in navbar
2. Choose social login (Google/GitHub/Discord/Email)
3. Authenticate
4. See your profile dropdown appear
5. Check Smart Account status
6. Click **"Launch App"** → Dashboard

## Troubleshooting

### "Web3Auth Client ID not configured" Error

**Solution:** Restart the dev server

```bash
# Kill current server (Ctrl+C)
./START_DEV.sh
```

Next.js only loads environment variables on startup.

### Smart Account Not Creating

**Check:**
1. Web3Auth connected? (green checkmarks)
2. Console logs show "Creating Smart Account"?
3. Bundler API key configured in `.env`?

### Missing Dependencies

```bash
cd frontend
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is required due to wagmi/RainbowKit version conflicts.

## Configuration

All environment variables are set in `.env`:

```bash
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BJS8Oyqi6CCqIFEm8V9qUw_4KRR3SLeqrbwxEOwi4TytPvICQ-o3FV5okwVSbNdPcyfJVagtC07wBv9KkBmIifc
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet
NEXT_PUBLIC_BUNDLER_RPC_URL=https://api.pimlico.io/v2/421614/rpc?apikey=pim_kKatFAxsC6zxTgfzYjhVcb
```

## Documentation

- ✅ `docs/WEB3AUTH_EMBEDDED_WALLET_LIVE.md` - Production integration guide
- ✅ `docs/SMART_ACCOUNT_INTEGRATION.md` - Smart Account & delegations
- ✅ `docs/PHASE2_SMART_ACCOUNTS_COMPLETE.md` - Implementation summary
- ✅ `frontend/WEB3AUTH_INTEGRATION.md` - Web3Auth setup guide
- ✅ `frontend/QUICK_START.md` - Quick start (this file)

## Next Steps

1. ✅ Web3Auth integration - **COMPLETE**
2. ✅ Smart Account integration - **COMPLETE**
3. ✅ Delegations (ERC-7710) - **COMPLETE**
4. ⏳ Connect to bounty contracts
5. ⏳ Implement agent execution logic
6. ⏳ Venice AI verification
7. ⏳ 1Shot gasless relayer
8. ⏳ x402 payment handling

## Support

Questions? Check the docs above or review console logs for errors.

Happy coding! 🚀
