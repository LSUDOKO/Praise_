# PRaise Setup Instructions

Complete step-by-step guide to set up PRaise for development and production.

## Prerequisites

- Node.js 18+ (recommended: 22+)
- pnpm or npm
- Git
- GitHub account
- Venice AI API key
- 1Shot API credentials
- MetaMask or compatible wallet

## Installation

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install @web3auth/modal @web3auth/base
npm install
```

### 2. Install Relayer Dependencies

```bash
cd relayer
npm install
```

### 3. Install Smart Contract Dependencies (if needed)

```bash
cd contracts/solidity
forge install
```

## Configuration

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables (already configured in your `.env`):

- `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` - From https://developer.metamask.io
- `VENICE_API_KEY` - From Venice AI dashboard
- `ONESHOT_API_KEY`, `ONESHOT_API_SECRET`, `ONESHOT_BUSINESS_ID` - From 1Shot
- `GITHUB_TOKEN` - Personal access token from GitHub
- `GITHUB_WEBHOOK_SECRET` - Random string for webhook verification
- All contract addresses (already deployed)

### 2. Web3Auth Dashboard Setup

1. Go to https://developer.metamask.io
2. Create/select your project
3. Add allowed domains:
   - Development: `http://localhost:3000`
   - Production: Your production domain
4. Configure social logins (Google, GitHub, Discord, Email)
5. Set session duration and other preferences

### 3. GitHub App Setup

1. Go to GitHub Settings → Developer Settings → GitHub Apps
2. Create new GitHub App:
   - **Name**: PRaise Bot
   - **Homepage URL**: https://your-domain.com
   - **Webhook URL**: https://your-domain.com/webhook/github
   - **Webhook Secret**: Copy from `.env`
   - **Permissions**:
     - Issues: Read & Write
     - Pull Requests: Read & Write
     - Contents: Read
     - Metadata: Read
   - **Events**:
     - Issues
     - Pull Request
     - Issue Comment
3. Install the app on your test repository

### 4. 1Shot Webhook Setup

Configure webhook URL in 1Shot dashboard:
```
https://your-domain.com/webhook/1shot
```

## Running Locally

### Terminal 1: Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000

### Terminal 2: Relayer

```bash
cd relayer
npm start
```

API available at: http://localhost:3000

### Terminal 3: Ngrok (for GitHub webhooks)

```bash
ngrok http 3000
```

Update GitHub webhook URL with ngrok URL.

## Testing

### Test Web3Auth Integration

1. Visit http://localhost:3000
2. Click "Connect Wallet"
3. Login with Google/GitHub
4. Check console - should see wallet address
5. Logout and try again

### Test Venice AI Integration

```bash
cd relayer
node -e "
const { veniceClient } = require('./lib/venice-client.js');
veniceClient.reviewPR({
  issueTitle: 'Test bug fix',
  issueBody: 'Auth is broken',
  prDiff: '- const x = 1;\\n+ const x = 2;',
  prDescription: 'Fixed the bug'
}).then(r => console.log(JSON.stringify(r, null, 2)));
"
```

Expected output: JSON with score, issues, summary, spam flags.

### Test GitHub Integration

```bash
cd relayer
node -e "
const { githubClient } = require('./github-client.js');
githubClient.getPullRequest('torvalds', 'linux', 1)
  .then(pr => console.log('PR Title:', pr.title))
  .catch(e => console.log('Error:', e.message));
"
```

### Test Relayer API

```bash
# Get health status
curl http://localhost:3000/health

# List bounties
curl http://localhost:3000/bounties

# Submit PR (requires valid bounty)
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/json" \
  -d '{
    "bountyId": 0,
    "prURL": "https://github.com/owner/repo/pull/1",
    "solverAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  }'
```

### Test Complete Flow

1. **Create a test repository** on GitHub
2. **Install PRaise GitHub App** on the repo
3. **Create an issue** with label `bounty:100`
4. **Fund a bounty** via the frontend
5. **Open a PR** that references the issue (e.g., "Fixes #1")
6. **Watch relayer logs** - should see:
   - Webhook received
   - PR fetched
   - Venice AI review
   - Comment posted on PR
7. **Merge the PR** (if AI approved)
8. **Watch for auto-release** - USDC sent to contributor

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │ ← User connects with Web3Auth
│   (Next.js)     │ ← Creates bounties
└────────┬────────┘ ← Views dashboard
         │
         ▼
┌─────────────────┐
│ Smart Contracts │ ← Bounty.sol (escrow)
│ (Arbitrum)      │ ← AgentDelegation.sol (permissions)
└────────┬────────┘ ← BountyRegistry.sol (tracking)
         │
         ▼
┌─────────────────┐
│   Relayer       │ ← Receives GitHub webhooks
│   (Node.js)     │ ← Calls Venice AI
└────────┬────────┘ ← Executes releases via 1Shot
         │
         ▼
┌─────────────────────────────────┐
│ External Services               │
│ • GitHub API (fetch PRs)        │
│ • Venice AI (code review)       │
│ • 1Shot (gasless transactions)  │
└─────────────────────────────────┘
```

## Key Features Integrated

✅ **Web3Auth** - Social login, embedded wallets
✅ **Venice AI** - Code review, spam detection
✅ **1Shot Relayer** - Gasless transactions (gas paid in USDC)
✅ **Smart Accounts** - ERC-7715 advanced permissions
✅ **GitHub Integration** - Webhooks, comments, PR tracking
✅ **x402 Protocol** - Pay-per-call agent services

## Common Issues

### Web3Auth Modal Not Appearing

**Cause**: Client ID mismatch or network mismatch
**Fix**:
- Check `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` matches dashboard
- Verify `NEXT_PUBLIC_WEB3AUTH_NETWORK` (devnet vs mainnet)
- Clear browser cache and localStorage

### Venice AI Rate Limit

**Cause**: Too many requests
**Fix**:
- Implement request caching
- Add retry logic with exponential backoff
- Upgrade Venice AI plan

### 1Shot Transaction Failing

**Cause**: Insufficient USDC for gas or invalid signature
**Fix**:
- Check USDC balance in bounty contract
- Verify permission is granted correctly
- Check 1Shot dashboard for error details

### GitHub Webhook Not Received

**Cause**: Endpoint not publicly accessible
**Fix**:
- Use ngrok for local development
- Verify webhook URL in GitHub app settings
- Check webhook delivery logs on GitHub

### Relayer Crashes on Startup

**Cause**: Missing environment variables or invalid private key
**Fix**:
- Check all required env vars are set
- Verify private key format (with or without 0x)
- Check RPC endpoint is accessible

## Production Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard.

### Relayer (Railway/Render)

```bash
# railway.json already configured
railway up

# Or use Render
# render.yaml already configured
```

Set environment variables in hosting dashboard.

### Database (Optional)

For production, consider adding:
- PostgreSQL for bounty history
- Redis for caching and rate limiting
- Prisma for ORM

### Monitoring

Set up monitoring for production:
- **Sentry** for error tracking
- **DataDog/NewRelic** for APM
- **Uptime Robot** for health checks
- **LogDNA/Papertrail** for log aggregation

## Security Checklist

Before going live:

- [ ] Rotate all API keys
- [ ] Use secure secret management (Vault, AWS Secrets Manager)
- [ ] Enable rate limiting on all endpoints
- [ ] Verify webhook signatures always
- [ ] Sanitize all user inputs
- [ ] Add CORS whitelist
- [ ] Enable HTTPS everywhere
- [ ] Implement request logging
- [ ] Add DDoS protection (Cloudflare)
- [ ] Set up automated backups
- [ ] Create incident response plan
- [ ] Conduct security audit
- [ ] Test disaster recovery

## Next Steps

1. **UI/UX Polish**
   - Design bounty creation form
   - Build dashboard with filtering
   - Add contributor profiles
   - Implement notifications

2. **Smart Contract Audits**
   - Get contracts audited
   - Implement upgradeable proxies
   - Add emergency pause functionality
   - Create comprehensive test suite

3. **Additional Features**
   - Multi-token support (USDT, DAI)
   - Bounty templates
   - Recurring bounties
   - Auto-split for multiple contributors
   - Reputation system
   - Leaderboards

4. **Marketing**
   - Create demo video
   - Write blog posts
   - Engage on Twitter/Discord
   - Submit to Product Hunt
   - Reach out to OSS foundations

## Support

- **Documentation**: https://docs.praise.xyz (to be created)
- **Discord**: https://discord.gg/praise (to be created)
- **Email**: team@praise.xyz
- **GitHub**: https://github.com/praise/praise

## License

MIT - See LICENSE file for details.

---

**Built with love for the open source community** 💙
