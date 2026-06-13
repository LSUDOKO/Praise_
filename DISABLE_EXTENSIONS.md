# How to Disable Browser Wallet Extensions

## Chrome / Brave

### Method 1: Extensions Page
```
1. Type in address bar: chrome://extensions
2. Find wallet extensions:
   - Nightly Wallet
   - MetaMask
   - Phantom
   - Rainbow
   - Coinbase Wallet
3. Toggle them OFF (click the blue switch)
4. Refresh your app page
```

### Method 2: Extension Icon
```
1. Click puzzle icon (????) in top-right
2. Click "Manage extensions"
3. Toggle OFF all wallet extensions
4. Refresh your app page
```

## Firefox

```
1. Type in address bar: about:addons
2. Click "Extensions" in left sidebar
3. Find wallet extensions
4. Click "Disable" button
5. Refresh your app page
```

## Use Incognito Instead (Easier!)

### Chrome / Brave
```
Windows/Linux: Ctrl + Shift + N
Mac: Cmd + Shift + N
```

### Firefox
```
Windows/Linux: Ctrl + Shift + P
Mac: Cmd + Shift + P
```

**Then:** Navigate to `http://localhost:3000` in incognito window

## Verify It Worked

After disabling or using incognito, check browser console:

??? **Should see:**
```
??? Web3Auth initialized successfully
```

??? **Should NOT see:**
```
Nightly Wallet Injected Successfully
TypeError: Cannot set property ethereum
```

## Why?

- Web3Auth provides embedded wallet (no extension needed)
- Browser wallet extensions interfere
- They both want to control `window.ethereum`
- Disabling extensions = no conflict = works perfectly

## Re-enable Later

After testing, you can re-enable your wallet extensions for regular browsing.

**OR** keep them disabled in your dev profile and use a separate profile for crypto.
