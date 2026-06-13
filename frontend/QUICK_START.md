# Quick Start - Web3Auth Integration

Get Web3Auth working in 5 minutes!

## Step 1: Install Dependencies (Already Done ✓)

```bash
npm install @web3auth/modal @web3auth/base @web3auth/ethereum-provider --legacy-peer-deps
```

## Step 2: Environment Variables

Make sure `.env.local` has:

```env
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BJS8Oyqi6CCqIFEm8V9qUw_4KRR3SLeqrbwxEOwi4TytPvICQ-o3FV5okwVSbNdPcyfJVagtC07wBv9KkBmIifc
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet
```

Already configured in your `.env` file! ✓

## Step 3: Start Development Server

```bash
npm run dev
```

## Step 4: Test the Integration

Open: http://localhost:3000/test-wallet

You should see:
- ✅ Connect Wallet button
- ✅ Social login options (Google, GitHub, Discord, Email)
- ✅ User info after login
- ✅ Wallet address
- ✅ Balance
- ✅ Sign message button

## Step 5: Try It Out

1. **Click "Connect with Web3Auth"**
2. **Choose a login method** (Google recommended for first test)
3. **Authorize the app**
4. **See your wallet info displayed**
5. **Click "Sign Message"** to test signing
6. **Click "Logout"** and try logging in again

## Expected Result

After successful login, you should see:

```
✓ Connected Badge
✓ User Avatar (from social profile)
✓ User Name (from social profile)  
✓ Wallet Address (0x...)
✓ Email (if available)
✓ Balance (0.0000 ETH initially)
✓ Login Type Badge
```

## Troubleshooting

### Issue: Modal doesn't appear

**Solution**:
```bash
# Clear browser cache and localStorage
# Check browser console for errors
# Verify Client ID matches dashboard
```

### Issue: "Client ID not configured"

**Solution**:
```bash
# Check .env.local file exists
# Verify NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is set
# Restart dev server
```

### Issue: Network error

**Solution**:
```bash
# Check internet connection
# Verify RPC endpoint accessible:
curl https://sepolia-rollup.arbitrum.io/rpc
```

### Issue: Popup blocked

**Solution**:
- Allow popups in browser settings
- Try incognito mode
- Check browser extensions (ad blockers)

## Integration Status

Check the test page for real-time status:

- [x] Web3Auth SDK - Modal initialized
- [x] Ethereum Provider - EVM blockchain access
- [ ] Wallet Connected - Connect to see ✓
- [x] Network - Arbitrum Sepolia

## What's Next?

Once Web3Auth is working:

1. ✅ **Web3Auth Integration** ← YOU ARE HERE
2. ⏭️ **Smart Account Creation** - Auto-create Smart Account after login
3. ⏭️ **Permission Grants** - Grant permissions to AI agent
4. ⏭️ **Bounty Creation** - Create bounties with embedded wallet
5. ⏭️ **Auto-Release Flow** - Complete end-to-end bounty flow

## Quick Commands

```bash
# Start frontend
npm run dev

# Check build
npm run build

# Run in production mode
npm run start

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Support

- 📖 Full Guide: `WEB3AUTH_INTEGRATION.md`
- 🔧 Setup Instructions: `../SETUP_INSTRUCTIONS.md`
- 🚀 Integration Guide: `../INTEGRATION_GUIDE.md`

## Demo Video Script

1. Open http://localhost:3000/test-wallet
2. Show "Connect with Web3Auth" button
3. Click and select Google login
4. Show authorization flow
5. Display connected wallet with user info
6. Click "Sign Message" 
7. Show signature output
8. Click "Logout"
9. Show disconnected state
10. Login again to show session persistence

**Duration**: ~2 minutes

---

**Status**: 🟢 Ready to Test

**Test URL**: http://localhost:3000/test-wallet
