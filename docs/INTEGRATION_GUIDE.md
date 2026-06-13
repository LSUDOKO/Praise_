# PRaise Integration Guide

Complete integration guide for making PRaise fully functional with all required services.

## 1. Web3Auth (Embedded Wallet Integration)

### Setup
1. Dashboard: https://developer.metamask.io
2. Client ID configured: `your_web3auth_client_id_here`
3. Network: Sapphire Devnet (for development)

### Usage in Frontend
```typescript
import { useWeb3Auth } from "@/components/web3auth-provider";

// In your component
const { login, logout, isConnected, getAccounts } = useWeb3Auth();

// Login
await login();

// Get user's wallet address
const accounts = await getAccounts();
```

### Files Created
- `frontend/lib/web3auth-config.ts` - Configuration
- `frontend/components/web3auth-provider.tsx` - Provider component

### Integration Steps
1. Wrap your app with `Web3AuthProvider` in `layout.tsx`
2. Use the hook in any component that needs wallet functionality
3. User can login with Google, GitHub, Discord, or email

---

## 2. Venice AI (Code Review & Verification)

### Setup
- API Key: Configured in `.env` as `VENICE_API_KEY`
- Base URL: `https://api.venice.ai/api/v1`
- Model: `llama-3.3-70b`

### Features Implemented
1. **Code Review** - Reviews PR diffs against issue requirements
2. **Spam Detection** - Detects spam, sybil attacks, and AI-generated code
3. **Summary Generation** - Weekly digests for maintainers

### Usage
```typescript
import { veniceClient } from "@/lib/venice-client";

// Review a PR
const review = await veniceClient.reviewPR({
  issueTitle: "Fix bug in auth",
  issueBody: "Auth flow is broken...",
  prDiff: "diff --git a/...",
  prDescription: "This PR fixes...",
});

// Detect spam
const spamCheck = await veniceClient.detectSpam({
  githubUsername: "contributor",
  accountCreated: "2024-01-01",
  commitHistory: [...],
  prContent: "PR description",
});
```

### Files Created
- `frontend/lib/venice-client.ts` - Client implementation
- `relayer/agent-verifier.js` - Multi-agent verification pipeline

### Integration in Relayer
Already integrated in `relayer/index.js` - automatically reviews PRs when submitted.

---

## 3. 1Shot Permissionless Relayer (Gasless Transactions)

### Setup
- API Key: `your_oneshot_api_key`
- API Secret: `your_oneshot_api_secret`
- Business ID: `your_oneshot_business_id`
- Webhook Public Key: `your_oneshot_webhook_public_key`

### Features
1. **Gasless Transactions** - Pay gas in USDC instead of ETH
2. **Webhook Updates** - Real-time transaction status
3. **EIP-7702 Support** - Upgrade EOAs to Smart Accounts

### Usage
```typescript
import { oneshotClient } from "@/lib/oneshot-client";

// Relay a transaction
const result = await oneshotClient.relayExecution({
  chainId: 421614, // Arbitrum Sepolia
  target: bountyAddress,
  value: 0n,
  callData: "0x...",
  gasToken: usdcAddress,
  from: userAddress,
  webhookUrl: "https://api.praise.xyz/webhooks/1shot",
});
```

### Files Created
- `frontend/lib/oneshot-client.ts` - Client implementation

### Webhooks
Set up webhook endpoint at `/webhook/1shot` in relayer to receive transaction status updates.

---

## 4. MetaMask Smart Accounts (Advanced Permissions)

### Setup
- Uses MetaMask Smart Accounts Kit
- ERC-7715 (Advanced Permissions)
- ERC-7710 (Delegations)

### Features
1. **Smart Account Creation** - Auto-create or import existing
2. **Permission Grants** - Time-bounded, scope-bounded permissions
3. **Delegated Execution** - Agent executes on behalf of user

### Usage
```typescript
import { SmartAccountManager, createBountyPermissionRequest } from "@/lib/smart-account-integration";

// Create Smart Account
const manager = new SmartAccountManager(provider);
const smartAccount = await manager.getOrCreateSmartAccount(ownerAddress);

// Grant permission to agent
const permission = await manager.grantBountyPermission({
  bountyAddress: "0x...",
  agentAddress: "0x...",
  amount: parseUnits("100", 6), // 100 USDC
  contestPeriod: 7 * 24 * 60 * 60, // 7 days
  minAIScore: 80,
});
```

### Files Created
- `frontend/lib/smart-account-integration.ts` - Smart Account manager

### Contracts Integration
- `AgentDelegation.sol` - Handles delegated releases
- `Bounty.sol` - Bounty escrow with permissions

---

## 5. x402 Payment Protocol (Pay-Per-Call)

### Setup
- Enabled: `true`
- Token: USDC on Arbitrum Sepolia
- Price: `0.10 USDC` for bounty creation via API

### Features
1. **Agent-to-Agent Payments** - AI agents can pay for services
2. **Pay-Per-Call** - No subscriptions, pay only when used
3. **Signed Receipts** - Cryptographic payment proofs

### Usage (Client)
```typescript
import { x402Client } from "@/lib/x402-client";

// Create payment
const payment = await x402Client.createPayment({
  amount: "0.10",
  recipient: serviceAddress,
  signer: walletSigner,
});

// Make paid request
const result = await x402Client.request({
  endpoint: "https://api.praise.xyz/bounties",
  method: "POST",
  body: { bountyData },
  payment,
});
```

### Usage (Server)
```javascript
import { x402Middleware } from "@/lib/x402-client";

// Protect endpoint with payment requirement
app.post("/bounties", x402Middleware(0.10), async (req, res) => {
  // Payment verified, process request
  const bounty = await createBounty(req.body);
  res.json({ bountyId: bounty.id });
});
```

### Files Created
- `frontend/lib/x402-client.ts` - Client and middleware

---

## 6. GitHub Integration (Webhooks & API)

### Setup
- Token: `your_github_personal_access_token`
- Webhook Secret: `your_github_webhook_secret`
- Webhook URL: `https://your-domain.com/webhook/github`

### Features
1. **PR Monitoring** - Detect PR opens, updates, merges
2. **Issue Tracking** - Link bounties to issues
3. **Bot Comments** - Post updates to PRs and issues
4. **CI Status Checks** - Verify all checks pass before release

### Usage
```javascript
import { githubClient } from "./github-client";

// Fetch PR details
const pr = await githubClient.getPullRequest("owner", "repo", 123);

// Get PR diff
const diff = await githubClient.getPullRequestDiff("owner", "repo", 123);

// Post comment
await githubClient.postPullRequestComment(
  "owner", 
  "repo", 
  123, 
  "🎯 Bounty linked!"
);
```

### Files Created
- `relayer/github-client.js` - GitHub API client

### Webhook Events Handled
- `pull_request` - opened, synchronized, closed
- `issues` - opened, labeled, closed

---

## 7. Complete Flow Integration

### Bounty Creation Flow

1. **User connects wallet** via Web3Auth
2. **User creates bounty** on GitHub issue
3. **Smart Account created** automatically
4. **USDC deposited** to bounty contract
5. **Permission granted** to agent (ERC-7715)
6. **Bot comments** on issue with bounty details

### PR Submission Flow

1. **Contributor submits PR** referencing issue
2. **GitHub webhook** triggers relayer
3. **Agent fetches** PR diff and issue details
4. **Venice AI reviews** code quality and correctness
5. **Spam detection** checks for sybil/bot activity
6. **CI status** verified (all checks passing)
7. **Bot comments** on PR with AI score

### Auto-Release Flow

1. **PR merged** by maintainer
2. **GitHub webhook** triggers release evaluation
3. **Agent verifier** runs complete pipeline:
   - Contest period elapsed ✓
   - CI checks passed ✓
   - AI score >= 80 ✓
   - Not paused ✓
4. **Agent executes** release via delegation (ERC-7710)
5. **1Shot relays** transaction (gas paid in USDC)
6. **USDC sent** to contributor's wallet
7. **Bot posts** confirmation with tx hash

---

## 8. Environment Variables Checklist

### Required Variables
```env
# Web3Auth
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_devnet

# Venice AI
VENICE_API_KEY=your_venice_api_key_here

# 1Shot Relayer
ONESHOT_API_KEY=your_oneshot_api_key
ONESHOT_API_SECRET=your_oneshot_api_secret
ONESHOT_BUSINESS_ID=your_oneshot_business_id
ONESHOT_WEBHOOK_PUBLIC_KEY=your_oneshot_webhook_public_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret

# Smart Contracts
NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS=0xde4549eC44ddda863F06c6D0589332930e8C1298
NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS=0xb238F82e842dDF05ED60e967FF936897729bd2bA
NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS=0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D
USDC_ADDRESS=0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9

# Chain
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc
ARBITRUM_SEPOLIA_CHAIN_ID=421614
PRIVATE_KEY=your_private_key_here

# x402
X402_ENABLED=true
X402_BOUNTY_CREATE_PRICE_USDC=0.10
X402_TOKEN_ADDRESS=0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d
```

---

## 9. Testing the Integration

### Test Web3Auth
```bash
cd frontend
npm run dev
# Visit http://localhost:3000
# Click "Connect Wallet"
# Login with Google/GitHub
# Check console for wallet address
```

### Test Venice AI
```bash
cd relayer
node -e "
const venice = require('./agent-verifier.js');
venice.agentVerifier.reviewCode({
  issueTitle: 'Test issue',
  issueBody: 'Test body',
  prDescription: 'Test PR',
  diff: 'console.log(\"hello\")'
}).then(console.log);
"
```

### Test Relayer
```bash
cd relayer
npm start
# In another terminal:
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{"bountyId": 0, "prURL": "https://github.com/test/test/pull/1", "solverAddress": "0x..."}'
```

### Test GitHub Webhook
```bash
# Set up ngrok for local testing
ngrok http 3000
# Configure GitHub webhook to: https://your-ngrok-url.ngrok.io/webhook/github
# Open a test PR and watch the logs
```

---

## 10. Deployment Checklist

### Before Production
- [ ] Switch Web3Auth to Sapphire Mainnet
- [ ] Update all contract addresses to mainnet
- [ ] Configure production RPC endpoints
- [ ] Set up proper secret management (Vault, AWS Secrets Manager)
- [ ] Enable rate limiting and DDoS protection
- [ ] Configure monitoring (Sentry, DataDog)
- [ ] Set up CI/CD pipeline
- [ ] Enable HTTPS for all endpoints
- [ ] Configure domain for webhooks
- [ ] Test complete flow end-to-end

### Security Notes
- **Never commit private keys** to version control
- **Rotate API keys** regularly
- **Verify webhook signatures** always
- **Sanitize user input** in all endpoints
- **Rate limit** all public endpoints
- **Log all transactions** for audit trails

---

## 11. Troubleshooting

### Web3Auth not connecting
- Check Client ID matches dashboard
- Verify network (devnet vs mainnet)
- Check browser console for errors
- Ensure domain is whitelisted on dashboard

### Venice AI not responding
- Verify API key is valid
- Check rate limits (depends on plan)
- Try with a smaller prompt
- Check network connectivity

### 1Shot transactions failing
- Verify API credentials
- Check USDC balance for gas payment
- Ensure contract has correct permissions
- Check webhook URL is reachable

### GitHub webhooks not received
- Verify webhook secret matches
- Check webhook is active on GitHub
- Ensure endpoint is publicly accessible
- Review GitHub webhook delivery logs

---

## Files Summary

### Frontend
- `frontend/lib/web3auth-config.ts` - Web3Auth setup
- `frontend/components/web3auth-provider.tsx` - Provider component
- `frontend/lib/venice-client.ts` - Venice AI client
- `frontend/lib/oneshot-client.ts` - 1Shot relayer client
- `frontend/lib/smart-account-integration.ts` - Smart Accounts
- `frontend/lib/x402-client.ts` - x402 protocol

### Relayer
- `relayer/github-client.js` - GitHub API integration
- `relayer/agent-verifier.js` - Multi-agent verification
- `relayer/index.js` - Main relayer (already integrated)

### Next Steps
1. Update `frontend/app/layout.tsx` to include Web3AuthProvider
2. Create UI components for bounty creation/submission
3. Implement Smart Account permission UX
4. Add dashboard for tracking bounties
5. Set up production deployment
