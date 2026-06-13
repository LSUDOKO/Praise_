# Smart Account & Delegations Integration

Complete guide for MetaMask Smart Accounts with ERC-7710 delegations and ERC-7715 advanced permissions in PRaise.

## Overview

PRaise uses **MetaMask Smart Accounts** to enable autonomous bounty agents with secure, limited permissions. The integration combines:

- **Web3Auth Embedded Wallets** - Passwordless authentication via social logins
- **MetaMask Smart Accounts** - ERC-4337 smart contract wallets with programmable logic
- **ERC-7710 Delegations** - Scoped permissions for agents to act on user's behalf
- **ERC-7715 Advanced Permissions** - Fine-grained wallet execution permissions
- **ERC-4337 Bundlers** - Gasless transactions via account abstraction

## Architecture

```
User (Web3Auth EOA)
  └─> Smart Account (Hybrid Implementation)
      └─> Delegation → Agent Account
          └─> Can release bounty if:
              - PR is merged ✓
              - Contest period elapsed ✓
              - AI score >= threshold ✓
              - Amount <= max ✓
```

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install @metamask/smart-accounts-kit viem@^2.21.54 --legacy-peer-deps
```

### 2. Configure Environment Variables

```bash
# Web3Auth Client ID (get from https://dashboard.web3auth.io)
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet

# Bundler RPC (get from https://dashboard.pimlico.io)
NEXT_PUBLIC_BUNDLER_RPC_URL=https://api.pimlico.io/v2/421614/rpc?apikey=your_api_key

# Arbitrum Sepolia RPC
NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
```

### 3. Wrap App with Providers

The app is already configured with the proper provider hierarchy:

```tsx
<Web3AuthProvider>           {/* Web3Auth authentication */}
  <SmartAccountProvider>      {/* Smart Account creation */}
    {children}
  </SmartAccountProvider>
</Web3AuthProvider>
```

## Usage

### Grant Bounty Permission

Use the `useBountyPermissions` hook to grant permissions to agents:

```tsx
import { useBountyPermissions } from "@/hooks/use-bounty-permissions";

function BountyComponent() {
  const { grantBountyPermission, isGranting } = useBountyPermissions();

  const handleGrantPermission = async () => {
    await grantBountyPermission({
      bountyId: "1",
      bountyAddress: "0x...",
      agentAddress: "0x...",
      usdcAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      maxAmount: "100", // 100 USDC
      durationDays: 30,
      minAIScore: 80,
      contestPeriod: 7 * 24 * 60 * 60, // 7 days
    });
  };

  return (
    <button onClick={handleGrantPermission} disabled={isGranting}>
      Grant Permission to Agent
    </button>
  );
}
```

### Smart Account Status

Check Smart Account status:

```tsx
import { useSmartAccount } from "@/lib/smart-account/smart-account-provider";

function StatusComponent() {
  const { smartAccount, smartAccountAddress, isDeployed, isCreating } = useSmartAccount();

  return (
    <div>
      <p>Smart Account: {smartAccountAddress || "Not created"}</p>
      <p>Status: {isDeployed ? "Deployed" : "Not deployed"}</p>
      {isCreating && <p>Creating...</p>}
    </div>
  );
}
```

### Execute Transactions

Execute transactions through Smart Account:

```tsx
const { executeTransaction } = useSmartAccount();

await executeTransaction([
  {
    to: usdcAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [recipient, parseUnits("10", 6)],
    }),
  },
]);
```

## Components

### Smart Account Provider

`frontend/lib/smart-account/smart-account-provider.tsx`

- Creates Smart Account from Web3Auth EOA
- Uses `Implementation.Hybrid` for flexible signing
- Auto-creates when Web3Auth connects
- Integrates with bundler for gasless transactions

### Permissions Manager

`frontend/lib/smart-account/permissions-manager.ts`

- Handles ERC-7715 Advanced Permissions
- Request execution permissions from MetaMask users
- Format permissions for UI display
- Create delegation contexts

### Delegation Manager

`frontend/lib/smart-account/delegation-manager.ts`

- Handles ERC-7710 Delegations
- Create scoped delegations for agents
- Apply caveats (time limits, call limits)
- Sign and manage delegations

### Bounty Permissions Hook

`frontend/hooks/use-bounty-permissions.ts`

- Unified interface for bounty permissions
- Combines delegations and permissions
- Handles deployment and signing
- Error handling and state management

## Delegation Scopes

PRaise uses **ERC-20 Transfer Amount** scope with additional caveats:

```typescript
{
  type: ScopeType.Erc20TransferAmount,
  tokenAddress: usdcAddress,
  maxAmount: parseUnits("100", 6),
  caveats: [
    {
      type: CaveatType.Timestamp,
      afterThreshold: currentTime,
      beforeThreshold: currentTime + 30 * 24 * 60 * 60, // 30 days
    },
    {
      type: CaveatType.LimitedCalls,
      limit: 1, // Single use only
    },
  ],
}
```

## Permission Flow

1. **User creates bounty** → Specifies amount, duration, AI threshold
2. **Grant permission** → Creates delegation for agent
3. **Sign delegation** → User signs with Smart Account
4. **Agent waits** → Monitors PR merge + contest period
5. **Agent verifies** → Checks AI score meets threshold
6. **Agent executes** → Redeems delegation to release funds
7. **Delegation consumed** → Cannot be reused (LimitedCalls caveat)

## Security Features

- **Scoped permissions** - Agent can only transfer specified token amount
- **Time-limited** - Delegation expires after duration
- **Single-use** - Cannot be reused after execution
- **AI verification** - Requires minimum quality score
- **Contest period** - Allows time for disputes
- **Revocable** - User can disable delegation anytime

## Bundler Integration

PRaise uses Pimlico bundler for gasless transactions:

```typescript
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_URL),
});

const userOpHash = await bundlerClient.sendUserOperation({
  account: smartAccount,
  calls: [...],
});
```

**Alternative bundlers:**
- Pimlico: https://dashboard.pimlico.io
- Stackup: https://www.stackup.sh
- Alchemy: https://www.alchemy.com/account-abstraction
- Biconomy: https://www.biconomy.io

## Testing

### Manual Testing

1. Start dev server: `npm run dev`
2. Visit `/test-wallet`
3. Connect with Web3Auth (Google/GitHub/Discord)
4. Check Smart Account creation
5. Deploy Smart Account
6. Grant permission to test agent
7. Verify delegation in console

### Test Agent Address

Use this test agent address for development:
```
0x1234567890123456789012345678901234567890
```

## Troubleshooting

### Smart Account Not Creating

**Issue:** Smart Account not created after Web3Auth login

**Solution:**
- Check Web3Auth client ID is correct
- Verify provider is initialized
- Check console for errors
- Ensure `SmartAccountProvider` wraps app

### Bundler Errors

**Issue:** User operation fails with "AA10" error

**Solution:**
- Check bundler API key is valid
- Verify bundler RPC URL is correct
- Ensure Smart Account has enough ETH for gas
- Check bundler supports Arbitrum Sepolia

### Delegation Not Signing

**Issue:** Cannot sign delegation

**Solution:**
- Ensure Smart Account is deployed first
- Check wallet is connected
- Verify signer has permission
- Check delegation parameters are valid

### Type Errors

**Issue:** TypeScript errors with `@metamask/smart-accounts-kit`

**Solution:**
```bash
npm install @metamask/smart-accounts-kit viem@^2.21.54 --legacy-peer-deps
```

## Resources

- [MetaMask Smart Accounts Kit Docs](https://docs.metamask.io/smart-accounts-kit/)
- [ERC-7710 Delegation Spec](https://eips.ethereum.org/EIPS/eip-7710)
- [ERC-7715 Permissions Spec](https://eips.ethereum.org/EIPS/eip-7715)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Web3Auth Documentation](https://web3auth.io/docs)
- [Pimlico Bundler Docs](https://docs.pimlico.io/)
- [Viem Account Abstraction](https://viem.sh/account-abstraction)

## Next Steps

1. ✅ Web3Auth integration - Complete
2. ✅ Smart Account creation - Complete
3. ✅ Delegation manager - Complete
4. ⏳ Connect to bounty contracts
5. ⏳ Implement agent execution logic
6. ⏳ Add Venice AI verification
7. ⏳ Integrate 1Shot gasless relayer
8. ⏳ Add x402 payment handling
