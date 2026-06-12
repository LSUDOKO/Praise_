# PRaise

> **Open source bounties that pay themselves.**
> GitHub bounties, settled by AI agents, released by Smart Accounts, gasless in stablecoins.

---

## Live Links

| Service | URL |
|---------|-----|
| **Frontend** | [frontend-two-drab-47.vercel.app](https://frontend-two-drab-47.vercel.app) |
| **Relayer API** | [praiser-relayer.onrender.com](https://praiser-relayer.onrender.com) |
| **Health Check** | [praiser-relayer.onrender.com/health](https://praiser-relayer.onrender.com/health) |

---

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐     ┌──────────────┐
│  GitHub Repo │     │  Arbitrum    │     │     Venice AI Review      │     │  Arbitrum    │
│              │     │  Sepolia     │     │                          │     │  Sepolia     │
│  Issue #42   │────>│ Create Bounty│────>│  Code review + scoring   │────>│ Release USDC │
│  + PR #43    │     │ (lock USDC)  │     │  Spam + Sybil detection  │     │ to solver    │
└──────────────┘     └──────────────┘     └──────────────────────────┘     └──────────────┘
```

GitHub bounty platforms move $100M+/year in developer rewards, but verification is 100% manual. PRaise replaces the human reviewer with AI agents and enforces rules onchain via Smart Accounts. When a contributor submits a PR, the AI reviews the code, scores it against the issue, and if approved, the Smart Account automatically releases payment — gasless, non-custodial, no platform cut.

---

## Deployed Smart Contracts

### Arbitrum Sepolia (Chain ID: 421614)

| Contract | Address | Explorer |
|----------|---------|----------|
| **BountyFactory** | [`0xb238F82e842dDF05ED60e967FF936897729bd2bA`](https://sepolia.arbiscan.io/address/0xb238F82e842dDF05ED60e967FF936897729bd2bA) | [Arbiscan](https://sepolia.arbiscan.io/address/0xb238F82e842dDF05ED60e967FF936897729bd2bA) |
| **AgentDelegation** | [`0xde4549eC44ddda863F06c6D0589332930e8C1298`](https://sepolia.arbiscan.io/address/0xde4549eC44ddda863F06c6D0589332930e8C1298) | [Arbiscan](https://sepolia.arbiscan.io/address/0xde4549eC44ddda863F06c6D0589332930e8C1298) |
| **BountyRegistry** | [`0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D`](https://sepolia.arbiscan.io/address/0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D) | [Arbiscan](https://sepolia.arbiscan.io/address/0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D) |
| **DisputeResolver** | [`0x05123409689B7BA30Ebb28d750d5250f242eA99E`](https://sepolia.arbiscan.io/address/0x05123409689B7BA30Ebb28d750d5250f242eA99E) | [Arbiscan](https://sepolia.arbiscan.io/address/0x05123409689B7BA30Ebb28d750d5250f242eA99E) |
| **SmartAccountAdapter** | [`0x78a5258dB533F8Ac986668DfFEB05019819eeC79`](https://sepolia.arbiscan.io/address/0x78a5258dB533F8Ac986668DfFEB05019819eeC79) | [Arbiscan](https://sepolia.arbiscan.io/address/0x78a5258dB533F8Ac986668DfFEB05019819eeC79) |
| **USDC** | [`0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9`](https://sepolia.arbiscan.io/address/0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9) | [Arbiscan](https://sepolia.arbiscan.io/address/0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9) |

### Avalanche Mainnet (Chain ID: 43114)

| Contract | Address | Explorer |
|----------|---------|----------|
| **BountyEscrow** | [`0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932`](https://snowtrace.io/address/0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932) | [Snowtrace](https://snowtrace.io/address/0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932) |
| **USDC** | [`0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E`](https://snowtrace.io/address/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E) | [Snowtrace](https://snowtrace.io/address/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E) |

### Avalanche Fuji Testnet (Chain ID: 43113)

| Contract | Address | Explorer |
|----------|---------|----------|
| **BountyEscrow** | [`0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932`](https://testnet.snowtrace.io/address/0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932) | [Snowtrace Testnet](https://testnet.snowtrace.io/address/0xB61Dc153eB4B149C5cb6Ed46FD67c62063311932) |
| **MockUSDC** | [`0x4a7B3cD32D8f43FaDb08Cb2d0752BB87328b574d`](https://testnet.snowtrace.io/address/0x4a7B3cD32D8f43FaDb08Cb2d0752BB87328b574d) | [Snowtrace Testnet](https://testnet.snowtrace.io/address/0x4a7B3cD32D8f43FaDb08Cb2d0752BB87328b574d) |

---

## Architecture

### Smart Contract Architecture

```
BountyFactory.sol
   ├── creates → Bounty.sol (one per bounty, holds USDC)
   ├── creates → AgentDelegation.sol (one per agent, holds delegated authority)
   └── reads  → BountyRegistry.sol (lookup bounties by repo/issue/PR)

Bounty.sol
   ├── deposit(usdcAmount)             // maintainer funds
   ├── release(to, amount)             // called only by AgentDelegation
   ├── reclaim()                        // maintainer reclaims unclaimed
   ├── pause() / unpause()              // maintainer pauses
   └── isReleasable() → (bool, reason)  // conditions check

AgentDelegation.sol
   ├── executeRelease(bountyId, to)    // called by relayer, validates permission
   ├── attest(prMerged, aiScore)       // called by oracle + Venice
   └── revoke()                         // maintainer revokes
```

### System Architecture

```
┌─────────────────┐
│  GitHub Webhook │ → triggers on PR/issue events
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│         PRaise Agent Service                │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ PR Watcher   │→ │ Venice Code      │    │
│  │              │  │ Reviewer         │    │
│  └──────────────┘  └──────────────────┘    │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ CI Waiter    │→ │ Sybil Detector   │    │
│  └──────────────┘  └──────────────────┘    │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Approver     │→ │ Notification     │    │
│  │ (rule engine)│  │ Service          │    │
│  └──────────────┘  └──────────────────┘    │
└────────┬────────────────────────────────────┘
         │ (when conditions met)
         ▼
┌─────────────────────────────────────────────┐
│   Smart Account Release (ERC-7710 call)     │
│   Bounty.sol → release(contributor, amt)    │
└────────┬────────────────────────────────────┘
         │ (relayed)
         ▼
┌─────────────────────────────────────────────┐
│      1Shot Permissionless Relayer           │
│      Gas paid in USDC, webhooks back        │
└────────┬────────────────────────────────────┘
         │
         ▼
    Contributor gets USDC
```

---

## User Flows

### Flow A — Maintainer Posts a Bounty

1. Connect wallet — Smart Account is auto-created (or use existing)
2. Pick an issue from the GitHub API
3. Set bounty terms: amount, auto-release conditions, contest period
4. Fund the escrow — USDC transferred to the Bounty Smart Account
5. The PRaise bot comments on the issue: "Bounty #42 — 100 USDC"

### Flow B — Contributor Submits Work

1. Contributor sees the bounty in the GitHub comment
2. Forks the repo, writes code, opens a PR
3. Bot comments on the PR: "Linked to bounty #42. AI confidence: 82%."

### Flow C — Auto-Release on Merge

1. PR is merged by the maintainer
2. PRaise agent runs the verification pipeline:
   - Venice AI performs code review and scores the PR
   - CI checks pass
   - All release conditions are met
3. Smart Account releases USDC to the contributor's wallet
4. 1Shot relays the transaction — gas paid in USDC, contributor needs 0 ETH

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Accounts** | MetaMask Smart Accounts Kit (kernel, EIP-7702, ERC-7715, ERC-7710) |
| **Relayer** | 1Shot Permissionless Relayer (gas in USDC) |
| **AI** | Venice AI (code review, spam detection, sybil detection) |
| **Payment Protocol** | x402 (HTTP 402) |
| **Stablecoin** | USDC on Arbitrum Sepolia |
| **Chain** | Arbitrum Sepolia (testnet) |
| **Frontend** | Next.js 16, RainbowKit, Wagmi, Viem |
| **Relayer Backend** | Node.js, Express, viem |
| **AI Models** | Venice Code LLM for PR review |

---

## API Endpoints

### Relayer API (`https://praiser-relayer.onrender.com`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/submit` | Submit a PR for AI review `{ bountyId, prURL, solverAddress }` |
| `POST` | `/release` | Release bounty funds `{ bountyId, recipientAddress, amount }` |
| `GET` | `/bounties` | List all bounties |
| `GET` | `/status/:id` | Get bounty details by ID |
| `POST` | `/webhook/github` | GitHub webhook receiver |
| `POST` | `/webhook/1shot` | 1Shot relayer webhook receiver |
| `GET` | `/health` | Health check and system status |

### x402 Payment Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/x402/pay` | Create x402 payment request for AI services |

---

## Smart Contract Details

### BountyFactory.sol

Creates and manages bounty instances. Each bounty gets its own `Bounty.sol` contract.

**Key Functions:**
- `createBounty(issueURL, amount, contestPeriod)` — Create a new bounty
- `fundBounty(bountyId, amount)` — Add funds to a bounty
- `getCreatorBounties(creator)` — List bounties by creator
- `bountyCount()` — Total number of bounties

### Bounty.sol

Holds USDC for a specific bounty. Enforces contest period, pause/unpause, and release conditions.

**Key Functions:**
- `deposit(amount)` — Fund the bounty (owner only)
- `release(to, amount)` — Release funds (agent only)
- `reclaim()` — Reclaim unclaimed funds after 365 days
- `pause()` / `unpause()` — Owner controls
- `isReleasable()` — Check if bounty can be released

### AgentDelegation.sol

Manages delegated authority for AI agents. Time-bounded, scope-bounded, amount-bounded permissions.

**Key Functions:**
- `grantPermission(bounty, beneficiary, maxAmount, duration, minAIScore)` — Grant agent permission
- `executeRelease(bounty, to, amount, aiScore)` — Execute release with validation
- `revokePermission(bounty)` — Revoke agent permission
- `reputation(agent)` — Check agent reputation

### BountyRegistry.sol

Indexes bounties by repo, issue, and PR for efficient lookup.

**Key Functions:**
- `registerBounty(bountyId, bounty, repo, issueNumber, issueURL, creator, amount)` — Register bounty
- `submitPR(bountyId, prNumber, prURL, solver)` — Submit PR for bounty
- `resolveBounty(bountyId, approved)` — Resolve bounty status
- `getRepoBounties(repo)` — List bounties by repository
- `getBountyByIssue(issueURL)` — Find bounty by issue URL
- `getBountyByPR(prURL)` — Find bounty by PR URL

---

## Setup

### Prerequisites

- Node.js 18+
- pnpm or npm
- MetaMask browser wallet

### Frontend

```bash
cd frontend
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Relayer

```bash
cd relayer
npm install
cp .env.example .env   # edit with your keys
node index.js
```

### Environment Variables

```bash
# Arbitrum Sepolia
PRIVATE_KEY=your_relayer_private_key
ARBITRUM_SEPOLIA_RPC=https://sepolia-rollup.arbitrum.io/rpc

# Contract Addresses
NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS=0xb238F82e842dDF05ED60e967FF936897729bd2bA
NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS=0xde4549eC44ddda863F06c6D0589332930e8C1298
NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS=0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D
NEXT_PUBLIC_USDC_ADDRESS=0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9

# AI & Relayer
VENICE_API_KEY=your_venice_api_key
ONESHOT_API_KEY=your_oneshot_api_key
ONESHOT_API_SECRET=your_oneshot_api_secret
GITHUB_TOKEN=your_github_pat
```

---

## Testing

```bash
# Relayer tests
cd relayer
npm test

# All 24 tests should pass
```

---

## Competitive Advantage

| Feature | PRaise | Gitcoin | Bountysource | OnlyDust | Polar |
|---------|--------|---------|--------------|----------|-------|
| **Non-custodial** | Yes | No | No | No | No |
| **Agentic** | Yes | No | No | Partial | No |
| **Gasless for contributors** | Yes (1Shot) | No | No | No | No |
| **AI-verified** | Yes (Venice) | No | No | No | No |
| **Smart Account native** | Yes | No | No | No | No |
| **Bounded permissions** | Yes (ERC-7715) | No | No | No | No |
| **Public, open source** | Yes | Partial | No | No | No |
| **x402 endpoint** | Yes | No | No | No | No |
| **Privacy-first AI** | Yes (Venice) | No | No | No | No |

---

## Hackathon Tracks

- **MetaMask Smart Accounts Kit x 1Shot API Hackathon** — 2026
- **Best x402 + ERC-7710** — Core flow uses both
- **Best Agent** — Multi-agent verification pipeline
- **Best A2A coordination** — x402 endpoint for autonomous agents
- **Best use of Venice AI** — Code review, spam detection, summaries

---

## License

MIT
