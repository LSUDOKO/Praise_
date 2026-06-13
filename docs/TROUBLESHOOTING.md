# Troubleshooting Guide

## Common Errors and Solutions

### 1. "Web3Auth Client ID not configured"

**Error Message:**
```
Console Error: Web3Auth Client ID not configured
```

**Cause:** Environment variable not loaded by Next.js

**Solution:**
```bash
# Kill the dev server (Ctrl+C)
./START_DEV.sh
```

Next.js only loads environment variables on startup. You MUST restart after changing `.env`.

---

### 2. Browser Extension Conflicts

**Error Messages:**
```
TypeError: Cannot set property ethereum of #<Window> which has only a getter
Error checking default wallet status
Nightly Wallet Injected Successfully
```

**Cause:** Browser wallet extensions (MetaMask, Nightly, Phantom, etc.) interfering with Web3Auth

**Solution 1 - Disable Browser Extensions (Recommended for Development):**
1. Open browser extension settings
2. Temporarily disable wallet extensions:
   - MetaMask
   - Nightly Wallet
   - Phantom
   - Rainbow
   - Coinbase Wallet
3. Refresh page

**Solution 2 - Use Incognito/Private Mode:**
```bash
# Open in incognito (no extensions)
# Chrome: Ctrl+Shift+N (Windows/Linux) or Cmd+Shift+N (Mac)
# Firefox: Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (Mac)
```

**Solution 3 - Create Separate Browser Profile:**
1. Create new browser profile for development
2. Don't install wallet extensions in this profile
3. Use for Web3Auth testing

**Why This Happens:**
- Browser extensions inject `window.ethereum`
- Web3Auth also tries to use `window.ethereum`
- They conflict and cause initialization errors
- Web3Auth is designed to work WITHOUT browser wallets

---

### 3. "Web3Auth not initialized yet"

**Error Message:**
```
Web3Auth not initialized yet
```

**Cause:** Web3Auth is still loading

**Solution:**
- Wait 1-2 seconds after page load
- Button will be disabled until ready
- Check console for "✅ Web3Auth initialized successfully"

**If it persists:**
1. Check browser console for other errors
2. Disable browser wallet extensions
3. Clear browser cache and reload
4. Restart dev server

---

### 4. Smart Account Not Creating

**Symptoms:**
- Web3Auth connects successfully
- But Smart Account stays "None" or "Creating..."

**Solutions:**

**Check 1 - Bundler API Key:**
```bash
# Verify in .env:
NEXT_PUBLIC_BUNDLER_RPC_URL=https://api.pimlico.io/v2/421614/rpc?apikey=YOUR_KEY
```

**Check 2 - Console Logs:**
Look for:
```
✅ Web3Auth initialized successfully
🔑 Wallet connected: 0x...
🔨 Creating Smart Account for: 0x...
✅ Smart Account created: 0x...
```

**Check 3 - Network Issues:**
- Are you connected to internet?
- Is Arbitrum Sepolia RPC working?
- Try: `curl https://sepolia-rollup.arbitrum.io/rpc`

---

### 5. Module Not Found Errors

**Error Message:**
```
Module not found: Can't resolve '@web3auth/modal'
Module not found: Can't resolve '@metamask/smart-accounts-kit'
```

**Solution:**
```bash
cd frontend
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is REQUIRED due to version conflicts.

---

### 6. Port Already in Use

**Error Message:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port
PORT=3001 npm run dev
```

---

### 7. Environment Variables Not Loading

**Symptoms:**
- `process.env.NEXT_PUBLIC_*` is undefined
- Client ID showing as not configured

**Solution:**
1. **Check file name:** Must be `.env` (not `.env.local` or `.env.development`)
2. **Check variable names:** Must start with `NEXT_PUBLIC_`
3. **Restart server:** `./START_DEV.sh`
4. **Clear Next.js cache:**
   ```bash
   rm -rf frontend/.next
   cd frontend
   npm run dev
   ```

---

### 8. Smart Account Deployment Fails

**Error Message:**
```
Error deploying Smart Account: insufficient funds
```

**Solution:**
- Smart Account deployment requires ETH for gas
- Get Arbitrum Sepolia ETH from faucet:
  - https://faucet.quicknode.com/arbitrum/sepolia
  - https://www.alchemy.com/faucets/arbitrum-sepolia

---

### 9. CORS Errors

**Error Message:**
```
Access to fetch blocked by CORS policy
```

**Cause:** Usually from bundler or RPC endpoint

**Solution:**
1. Check bundler API key is valid
2. Try different bundler (Pimlico → Stackup)
3. Check RPC endpoint allows localhost

---

### 10. Build Errors (Production)

**Error Message:**
```
Type error: Property 'ethereum' does not exist on type 'Window'
```

**Solution:**
Add to `frontend/types/global.d.ts`:
```typescript
interface Window {
  ethereum?: any;
}
```

---

## Development Best Practices

### 1. Clean Development Setup

**Disable all browser wallet extensions:**
- MetaMask
- Coinbase Wallet
- Rainbow
- Phantom
- Nightly
- Any other Web3 wallets

**Or use incognito mode** for development.

### 2. Always Restart After .env Changes

```bash
# Kill server
Ctrl+C

# Restart
./START_DEV.sh
```

### 3. Check Console Logs

Open browser console (F12) and look for:
- ✅ Success messages (green checkmarks)
- ❌ Error messages (red X's)
- ⚠️ Warning messages

### 4. Clear Cache When Needed

```bash
# Clear Next.js cache
rm -rf frontend/.next

# Clear node_modules (if really stuck)
rm -rf frontend/node_modules
cd frontend
npm install --legacy-peer-deps
```

---

## Still Having Issues?

### Debug Checklist

- [ ] Dev server restarted after `.env` changes?
- [ ] All browser wallet extensions disabled?
- [ ] Using incognito mode or clean browser profile?
- [ ] Checked browser console for errors?
- [ ] Bundler API key configured in `.env`?
- [ ] Dependencies installed with `--legacy-peer-deps`?
- [ ] Port 3000 not in use?
- [ ] Internet connection working?

### Get Help

1. **Check Console Logs** - Most issues show clear error messages
2. **Review Documentation:**
   - `docs/WEB3AUTH_EMBEDDED_WALLET_LIVE.md`
   - `docs/SMART_ACCOUNT_INTEGRATION.md`
   - `QUICK_START.md`

3. **Common Patterns:**
   - Browser extension conflicts → Disable extensions
   - Environment variables → Restart server
   - Dependencies → Reinstall with `--legacy-peer-deps`
   - Network issues → Check RPC endpoints

---

## Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| Web3Auth not configured | Restart dev server |
| Browser extension conflict | Disable wallet extensions or use incognito |
| Smart Account not creating | Check bundler API key |
| Module not found | `npm install --legacy-peer-deps` |
| Port in use | Kill process or use different port |
| Env vars not loading | Restart server, clear `.next` cache |
| CORS errors | Check API keys and endpoints |

---

## Prevention Tips

1. **Dedicated Development Browser Profile**
   - No wallet extensions installed
   - Used only for Web3Auth development

2. **Environment Variable Management**
   - Always restart server after `.env` changes
   - Use `./START_DEV.sh` for proper initialization

3. **Dependency Management**
   - Always use `--legacy-peer-deps` flag
   - Don't mix npm/yarn/pnpm

4. **Clean State**
   - Clear cache when switching branches
   - Reinstall dependencies after major changes

---

Good luck! Most issues are caused by browser extensions or forgetting to restart the server. 🚀
