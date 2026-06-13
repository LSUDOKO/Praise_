# Web3Auth Integration - Complete Guide

## Overview

PRaise uses **MetaMask Embedded Wallets (Web3Auth)** to provide seamless wallet onboarding via social login. Users can connect with Google, GitHub, Discord, or Email without managing seed phrases.

## Features Implemented

✅ **Social Login** - Google, GitHub, Discord, Email passwordless
✅ **Embedded Wallet** - Non-custodial wallet created automatically
✅ **Ethereum Provider** - Full EVM blockchain access
✅ **Message Signing** - Sign messages for authentication
✅ **Balance Queries** - Check ETH/token balances
✅ **Network Support** - Arbitrum Sepolia (testnet)
✅ **Persistent Sessions** - Stay logged in across page refreshes

## Architecture

```
┌─────────────────────────────────────────┐
│         Web3Auth Provider               │
│  • Initializes Web3Auth SDK            │
│  • Manages authentication state         │
│  • Provides wallet access               │
└────────────┬────────────────────────────┘
             │
             ├─→ Social Login (Google/GitHub/Discord/Email)
             ├─→ Embedded Wallet Creation
             ├─→ Ethereum Provider (EVM)
             ├─→ Sign Messages & Transactions
             └─→ Query Balances & State
```

## Files Structure

```
frontend/
├── lib/
│   └── web3auth-config.ts          # Configuration (DEPRECATED - moved to provider)
├── components/
│   ├── web3auth-provider.tsx       # Main provider with hooks
│   └── web3auth-login.tsx          # UI component for login
├── app/
│   ├── layout.tsx                  # Provider wrapped here
│   └── test-wallet/
│       └── page.tsx                # Test page for integration
└── WEB3AUTH_INTEGRATION.md         # This file
```

## Configuration

### Environment Variables

Required in `.env.local` or `.env`:

```env
# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=BJS8Oyqi6CCqIFEm8V9qUw_4KRR3SLeqrbwxEOwi4TytPvICQ-o3FV5okwVSbNdPcyfJVagtC07wBv9KkBmIifc
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet

# Network Configuration (Optional - defaults provided)
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

### Dashboard Setup

1. **Create Project**: https://developer.metamask.io
2. **Get Client ID**: Copy from dashboard
3. **Add Domains**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
4. **Configure Social Logins**:
   - Google ✓
   - GitHub ✓
   - Discord ✓
   - Email Passwordless ✓

### Network Configuration

Currently configured for **Arbitrum Sepolia**:
- Chain ID: `421614` (hex: `0x66eee`)
- RPC: `https://sepolia-rollup.arbitrum.io/rpc`
- Explorer: `https://sepolia.arbiscan.io`
- Currency: ETH

**For Production**: Switch to Arbitrum One (mainnet):
```typescript
chainId: "0xa4b1", // 42161
rpcTarget: "https://arb1.arbitrum.io/rpc",
```

## Usage

### Basic Integration

```typescript
import { useWeb3Auth } from "@/components/web3auth-provider";

function MyComponent() {
  const { 
    isConnected, 
    address, 
    userInfo,
    login, 
    logout,
    signMessage,
    getBalance 
  } = useWeb3Auth();

  return (
    <div>
      {!isConnected ? (
        <button onClick={login}>Connect Wallet</button>
      ) : (
        <>
          <p>Connected: {address}</p>
          <p>User: {userInfo?.name}</p>
          <button onClick={logout}>Disconnect</button>
        </>
      )}
    </div>
  );
}
```

### Sign Message

```typescript
const { signMessage, address } = useWeb3Auth();

async function handleSign() {
  const message = `Verify ownership of ${address}`;
  const signature = await signMessage(message);
  console.log("Signature:", signature);
}
```

### Get Balance

```typescript
const { getBalance, address } = useWeb3Auth();

async function checkBalance() {
  const balance = await getBalance();
  const ethBalance = formatEther(BigInt(balance));
  console.log("Balance:", ethBalance, "ETH");
}
```

### Send Transaction

```typescript
const { provider, address } = useWeb3Auth();

async function sendTransaction() {
  if (!provider) return;

  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [{
      from: address,
      to: "0x...",
      value: "0x...",
      data: "0x...",
    }],
  });
  
  console.log("Transaction:", txHash);
}
```

## Testing

### Test Page

Visit: http://localhost:3000/test-wallet

Features tested:
- Social login flow
- Wallet connection
- Message signing
- Balance queries
- Provider status
- Network information

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open Test Page**
   ```
   http://localhost:3000/test-wallet
   ```

3. **Test Login Flow**
   - Click "Connect with Web3Auth"
   - Choose Google/GitHub/Discord/Email
   - Authorize the app
   - See wallet address and user info

4. **Test Signing**
   - Click "Sign Message"
   - Approve in modal
   - See signature displayed

5. **Test Logout**
   - Click "Logout"
   - Session cleared
   - Can login again

### Automated Testing

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { Web3AuthProvider } from "@/components/web3auth-provider";

describe("Web3Auth Integration", () => {
  it("should initialize provider", async () => {
    render(
      <Web3AuthProvider>
        <TestComponent />
      </Web3AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    });
  });
});
```

## Key Derivation Rules ⚠️

**CRITICAL**: Same wallet address requires:
- ✓ Same Client ID
- ✓ Same Sapphire network (devnet **or** mainnet)
- ✓ Same connection configuration

**Changing any of these = different address forever!**

### Development vs Production

- **Development**: Use `sapphire_devnet`
  - Allows `localhost`
  - Free for testing
  - Different addresses than production

- **Production**: Use `sapphire_mainnet`
  - Requires verified domain
  - Production-ready
  - Never switch after users exist

**DO NOT** switch from devnet to mainnet after users have created wallets - they will get different addresses and lose access to their funds!

## Troubleshooting

### Modal Not Appearing

**Cause**: Configuration issue or initialization error

**Fix**:
```typescript
// Check browser console for errors
// Verify Client ID matches dashboard
// Clear browser localStorage: localStorage.clear()
```

### Wrong Network

**Cause**: Network mismatch or RPC issue

**Fix**:
```typescript
// Check chainId in provider configuration
// Verify RPC endpoint is accessible
// Try alternative RPC: Alchemy, Infura, QuickNode
```

### Login Fails

**Cause**: Domain not whitelisted or popup blocked

**Fix**:
1. Add domain to Web3Auth dashboard
2. Allow popups in browser
3. Try incognito mode
4. Clear cookies and cache

### Provider is Null

**Cause**: Web3Auth not initialized yet

**Fix**:
```typescript
// Add loading state
if (!web3auth) {
  return <div>Initializing...</div>;
}
```

### Different Address Per Login

**Cause**: Using different login methods without grouped connections

**Fix**: Configure grouped connections on dashboard (advanced)

## Advanced Features

### Grouped Connections

Link multiple login methods to same wallet:
```
Google + Email → Same Address
GitHub + Discord → Same Address
```

Configure on dashboard under "Authentication" → "Grouped Connections"

### Custom Authentication

Use your own JWT provider:
```typescript
await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
  loginProvider: "jwt",
  extraLoginOptions: {
    id_token: customJWT,
    verifierIdField: "sub",
  },
});
```

### Wallet Pregeneration

Generate wallet address before user logs in:
```typescript
// Enable useSFAKey in configuration
// Allows backend to generate address for user
// WARNING: Changes ALL wallet addresses
```

## Security Considerations

### Client ID Protection

- Client ID is **public** (safe in frontend)
- Actual wallet keys are **never exposed**
- Keys stored securely by Web3Auth

### Session Management

- Sessions persist in localStorage
- Auto-logout after configured duration
- Can be revoked from dashboard

### Transaction Signing

- All transactions require user approval
- No automatic signing without user interaction
- Signature requests show clear details

## Migration

### From v10 to v11

Current implementation uses **v11** (latest).

If migrating from older version:
```bash
npm install @web3auth/modal@latest @web3auth/base@latest
```

Key changes:
- `OPENLOGIN_NETWORK` → `WEB3AUTH_NETWORK`
- `LOGIN_PROVIDER` → Use specific adapters
- `authenticateUser()` → `getUserInfo()`

See: https://docs.metamask.io/embedded-wallets/migration-guides/

## Production Checklist

Before deploying:

- [ ] Switch to `sapphire_mainnet`
- [ ] Update Client ID (if needed)
- [ ] Add production domain to dashboard
- [ ] Test with real social accounts
- [ ] Verify RPC endpoints (use paid providers for reliability)
- [ ] Set up monitoring and error tracking
- [ ] Configure session duration appropriately
- [ ] Test wallet recovery flows
- [ ] Document user onboarding process
- [ ] Set up support for users with wallet issues

## Resources

- **Documentation**: https://docs.metamask.io/embedded-wallets/
- **Dashboard**: https://developer.metamask.io
- **Examples**: https://github.com/Web3Auth/web3auth-examples
- **Community**: https://builder.metamask.io/c/embedded-wallets/5
- **Support**: Open ticket on dashboard

## Next Steps

1. **Integrate with Smart Accounts**
   - Create Smart Account after Web3Auth login
   - Grant permissions to AI agent
   - Enable gasless transactions

2. **Add to Main Flow**
   - Replace RainbowKit with Web3Auth
   - Update all wallet connections
   - Test complete bounty flow

3. **Enhanced UX**
   - Custom modal styling
   - Better error messages
   - Wallet recovery flows
   - Multi-factor authentication

---

**Status**: ✅ Fully Functional

**Last Updated**: 2026-06-12

**Maintainer**: PRaise Team
