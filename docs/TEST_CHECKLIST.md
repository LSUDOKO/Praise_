# Web3Auth Testing Checklist

## Pre-Test Setup ✅

- [x] Dependencies installed (`@web3auth/modal`, `@web3auth/base`, `@web3auth/ethereum-provider`)
- [x] Environment variables configured (Client ID in `.env`)
- [x] Provider component created and wrapped in layout
- [x] Test page created (`/test-wallet`)
- [x] UI components ready (login card, nav button)
- [x] Toast notifications configured

## Test 1: Basic Connection

- [ ] Start dev server: `npm run dev` in `frontend/`
- [ ] Open: http://localhost:3000/test-wallet
- [ ] See "Connect with Web3Auth" button
- [ ] Click button → Modal appears
- [ ] Modal shows social login options (Google, GitHub, Discord, Email)

**Expected**: ✅ Modal appears with 4 login options

## Test 2: Google Login

- [ ] Click "Google" in modal
- [ ] Redirected to Google OAuth
- [ ] Select Google account
- [ ] Authorize application
- [ ] Redirected back to app
- [ ] See connected state with:
  - [ ] User avatar
  - [ ] User name
  - [ ] Wallet address (0x...)
  - [ ] Email
  - [ ] Balance (0.0000 ETH)
  - [ ] "Connected" badge

**Expected**: ✅ Wallet connected, all info displayed

## Test 3: Message Signing

- [ ] Click "Sign Message" button
- [ ] Modal appears with message to sign
- [ ] Click "Sign" in modal
- [ ] See signature output (starts with 0x...)
- [ ] Signature is 132 characters long

**Expected**: ✅ Message signed successfully

## Test 4: Balance Query

- [ ] Balance displayed automatically after login
- [ ] Shows "0.0000 ETH" for new wallet
- [ ] If funded, shows correct balance

**Expected**: ✅ Balance displayed correctly

## Test 5: Logout

- [ ] Click "Logout" button
- [ ] Modal may appear for confirmation
- [ ] After logout:
  - [ ] Back to "Connect" button
  - [ ] No user info displayed
  - [ ] No wallet address shown

**Expected**: ✅ Clean logout, back to initial state

## Test 6: Re-Login (Session)

- [ ] Click "Connect" again
- [ ] Choose same login method (Google)
- [ ] May auto-connect without full OAuth
- [ ] Same wallet address as before
- [ ] Same user info

**Expected**: ✅ Same wallet address (session works)

## Test 7: Different Login Method

- [ ] Logout
- [ ] Login with different method (GitHub)
- [ ] Complete OAuth for GitHub
- [ ] Get different wallet address

**Expected**: ✅ Different address for different login method

## Test 8: Browser Console

Open browser DevTools console, check for:

- [ ] "✅ Web3Auth initialized successfully"
- [ ] "🔑 Wallet connected: 0x..."
- [ ] No red errors
- [ ] No warnings about missing config

**Expected**: ✅ Clean console, no errors

## Test 9: Network Status

On test page, check status indicators:

- [ ] Web3Auth SDK: ✓ Active
- [ ] Ethereum Provider: ✓ Active (when connected)
- [ ] Wallet Connected: ✓ Active (when connected)
- [ ] Network: ✓ Active (Arbitrum Sepolia)

**Expected**: ✅ All green when connected

## Test 10: Navigation Component

- [ ] Go to homepage: http://localhost:3000
- [ ] See wallet button in navigation (if added to navbar)
- [ ] Click button → Connect
- [ ] After connect → See dropdown with address
- [ ] Click address → See menu with:
  - [ ] Copy Address
  - [ ] View on Explorer
  - [ ] Disconnect

**Expected**: ✅ Dropdown works, actions functional

## Test 11: Toast Notifications

- [ ] Login → Toast: Success notification
- [ ] Copy address → Toast: "Address copied"
- [ ] Sign message → Toast: "Message signed"
- [ ] Any error → Toast: Error message

**Expected**: ✅ Toasts appear in top-right

## Test 12: Mobile Browser (Optional)

- [ ] Open on mobile browser
- [ ] Connect button works
- [ ] Modal is responsive
- [ ] OAuth redirect works
- [ ] Can sign messages
- [ ] Can logout

**Expected**: ✅ Works on mobile

## Test 13: Persistence

- [ ] Login
- [ ] Refresh page (F5)
- [ ] Still connected (no re-login needed)
- [ ] Same wallet address
- [ ] Same user info

**Expected**: ✅ Session persists across refresh

## Test 14: Incognito Mode

- [ ] Open in incognito/private window
- [ ] Connect wallet
- [ ] Close incognito window
- [ ] Reopen incognito
- [ ] Need to login again (no session)

**Expected**: ✅ No session in incognito (correct behavior)

## Test 15: Multiple Tabs

- [ ] Login in Tab 1
- [ ] Open Tab 2
- [ ] Check if connected in Tab 2
- [ ] Logout in Tab 1
- [ ] Check Tab 2 (should also logout)

**Expected**: ✅ State synced across tabs

## Debugging Checklist

If tests fail:

### Modal doesn't appear
- [ ] Check Client ID in `.env`
- [ ] Verify `NEXT_PUBLIC_` prefix
- [ ] Check browser console for errors
- [ ] Try clearing localStorage: `localStorage.clear()`
- [ ] Restart dev server

### Login fails
- [ ] Check internet connection
- [ ] Allow browser popups
- [ ] Try incognito mode
- [ ] Check domain is whitelisted on dashboard
- [ ] Verify Client ID is correct

### Wrong network
- [ ] Check `NEXT_PUBLIC_WEB3AUTH_NETWORK`
- [ ] Should be `sapphire_devnet` for testing
- [ ] Check chain ID in provider config

### Balance shows 0
- [ ] Correct - new wallet has 0 ETH
- [ ] To test with funds, send testnet ETH to address
- [ ] Get testnet ETH from faucet: https://faucet.quicknode.com/arbitrum/sepolia

### Provider is null
- [ ] Web3Auth still initializing
- [ ] Wait for initialization (~2-3 seconds)
- [ ] Check for initialization errors in console

## Performance Benchmarks

Expected timings:

- [ ] Initial load: < 3 seconds
- [ ] Login flow: < 10 seconds
- [ ] Sign message: < 2 seconds
- [ ] Balance query: < 1 second
- [ ] Logout: < 1 second

## Browser Compatibility

Test on:

- [ ] Chrome/Chromium (Recommended)
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile Chrome
- [ ] Mobile Safari

## Final Verification

- [ ] All 15 tests passed
- [ ] No console errors
- [ ] Toast notifications work
- [ ] Login/logout cycle smooth
- [ ] Session persistence works
- [ ] Performance acceptable
- [ ] Works on multiple browsers
- [ ] Ready for demo

## Sign-Off

- [ ] **Functional**: All features work
- [ ] **Stable**: No crashes or errors
- [ ] **UX**: Smooth user experience
- [ ] **Documented**: All docs complete
- [ ] **Demo-Ready**: Can present to stakeholders

---

## Quick Test Command

```bash
# Start server
cd frontend && npm run dev

# Open test page
open http://localhost:3000/test-wallet

# Or use script
./START_WEB3AUTH_TEST.sh
```

## Success Criteria

✅ User can login with social account
✅ Wallet address displayed correctly
✅ Can sign messages
✅ Can logout and re-login
✅ Session persists
✅ No errors in console
✅ Toast notifications work
✅ Ready for Smart Account integration

---

**Status**: Ready for Testing

**Date**: 2026-06-12

**Tester**: _______________

**Result**: [ ] PASS  [ ] FAIL

**Notes**: _______________
