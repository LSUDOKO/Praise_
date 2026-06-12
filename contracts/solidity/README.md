# PRaise Smart Contracts

Solidity smart contracts for the PRaise bounty platform on Arbitrum Sepolia.

## Architecture

```
BountyFactory.sol
   ├── creates → Bounty.sol (one per bounty, holds USDC)
   ├── creates → AgentDelegation.sol (one per agent, holds delegated authority)
   └── reads  → BountyRegistry.sol (lookup bounties by repo/issue/PR)
```

## Contracts

### Bounty.sol

- Holds USDC for a specific bounty
- Supports pause/unpause by creator
- Contest period enforcement
- Release conditions (AI score, PR merge)
- Reclaim after 365 days if unclaimed

### AgentDelegation.sol

- Manages delegated authority for AI agents
- Time-bounded, scope-bounded, amount-bounded permissions
- Validates release conditions before execution
- Reputation system for agents

### BountyFactory.sol

- Creates Bounty instances
- Manages bounty lifecycle
- Grants permissions to AgentDelegation
- Tracks bounties by creator and issue

### BountyRegistry.sol

- Indexes bounties by repo, issue, and PR
- Provides lookup functions
- Tracks bounty status changes

## Deployment

### Prerequisites

1. Install Foundry
2. Get Arbitrum Sepolia ETH from faucet
3. Get USDC on Arbitrum Sepolia

### Deploy

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export TRUSTED_SIGNER=your_relayer_address
export ETHERSCAN_API_KEY=your_etherscan_api_key

# Deploy
cd contracts/solidity
forge script script/DeployPRaise.s.sol --rpc-url arbitrum_sepolia --broadcast --verify
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer private key |
| `TRUSTED_SIGNER` | Relayer address for AgentDelegation |
| `ETHERSCAN_API_KEY` | Etherscan API key for verification |

## Contract Addresses (Arbitrum Sepolia)

After deployment, update your `.env` file with the deployed addresses:

```
NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS=<deployed_address>
NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS=<deployed_address>
NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS=<deployed_address>
NEXT_PUBLIC_BOUNTY_RESOLVER_ADDRESS=<deployed_address>
NEXT_PUBLIC_SMART_ACCOUNT_ADAPTER_ADDRESS=<deployed_address>
```

## Testing

```bash
# Run all tests
forge test

# Run specific test
forge test --match-contract BountyTest
```

## Verification

```bash
# Verify contracts on Arbiscan
forge verify-contract <contract_address> <contract_name> \
  --chain-id 421614 \
  --etherscan-api-key $ETHERSCAN_API_KEY
```
