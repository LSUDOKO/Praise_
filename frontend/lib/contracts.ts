import { parseAbi } from 'viem'
import { arbitrumSepolia } from 'wagmi/chains'

export const NETWORKS = {
  testnet: {
    name: 'Arbitrum Sepolia',
    chain: arbitrumSepolia,
    bountyFactoryAddress: (process.env.NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS || '0xb238F82e842dDF05ED60e967FF936897729bd2bA') as `0x${string}`,
    agentDelegationAddress: (process.env.NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS || '0xde4549eC44ddda863F06c6D0589332930e8C1298') as `0x${string}`,
    bountyRegistryAddress: (process.env.NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS || '0x5a2C278979da1eefc5C016c8d478ccBCcbB4294D') as `0x${string}`,
    usdcAddress: '0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9' as `0x${string}`,
    usdcSymbol: 'USDC',
    canMint: false,
    relayerApi: process.env.NEXT_PUBLIC_RELAYER_URL_TESTNET || 'http://localhost:3100',
  },
} as const

export type Network = keyof typeof NETWORKS

export const CURRENT_NETWORK = NETWORKS.testnet

// Contract ABIs
export const BOUNTY_FACTORY_ABI = parseAbi([
  'function createBounty(string issueURL, uint256 amount, uint256 contestPeriod) external returns (uint256 bountyId, address bountyAddress)',
  'function fundBounty(uint256 bountyId, uint256 amount) external',
  'function getBounty(uint256 bountyId) external view returns (tuple(address bounty, address creator, string issueURL, uint256 amount, uint256 contestPeriod, uint256 createdAt))',
  'function getCreatorBounties(address creator) external view returns (uint256[])',
  'function getBountyByIssue(string issueURL) external view returns (uint256)',
  'function bountyCount() external view returns (uint256)',
  'event BountyCreated(uint256 indexed bountyId, address indexed creator, string issueURL, uint256 amount, address bountyAddress)',
  'event BountyFunded(uint256 indexed bountyId, address indexed funder, uint256 amount)',
])

export const BOUNTY_ABI = parseAbi([
  'function deposit(uint256 amount) external',
  'function release(address to, uint256 amount) external',
  'function reclaim() external',
  'function pause() external',
  'function unpause() external',
  'function submitSolution(string prURL, address solver) external',
  'function submitAIScore(uint256 score) external',
  'function isReleasable() external view returns (bool, string)',
  'function getBounty() external view returns (uint256 id, address creator, string issueURL, string prURL, uint256 amount, address solver, bool paused, uint256 contestPeriodEnd, uint256 createdAt, uint256 aiScore, bool prMerged)',
  'function bountyId() external view returns (uint256)',
  'function usdc() external view returns (address)',
  'function agent() external view returns (address)',
])

export const AGENT_DELEGATION_ABI = parseAbi([
  'function grantPermission(address bounty, address beneficiary, uint256 maxAmount, uint256 duration, uint256 minAIScore) external',
  'function revokePermission(address bounty) external',
  'function executeRelease(address bounty, address to, uint256 amount, uint256 aiScore) external',
  'function isReleaseAllowed(address bounty, address to, uint256 amount, uint256 aiScore) external view returns (bool, string)',
  'function getPermission(address bounty) external view returns (tuple(address bounty, address beneficiary, uint256 maxAmount, uint256 startTime, uint256 endTime, uint256 minAIScore, bool active))',
  'function reputation(address agent) external view returns (uint256)',
  'event PermissionGranted(address indexed bounty, address indexed beneficiary, uint256 maxAmount, uint256 endTime, uint256 minAIScore)',
  'event PermissionRevoked(address indexed bounty)',
  'event ReleaseExecuted(address indexed bounty, address indexed to, uint256 amount)',
])

export const BOUNTY_REGISTRY_ABI = parseAbi([
  'function registerBounty(uint256 bountyId, address bounty, string repo, uint256 issueNumber, string issueURL, address creator, uint256 amount) external',
  'function submitPR(uint256 bountyId, uint256 prNumber, string prURL, address solver) external',
  'function resolveBounty(uint256 bountyId, bool approved) external',
  'function getBounty(uint256 bountyId) external view returns (tuple(uint256 bountyId, address bounty, string repo, uint256 issueNumber, string issueURL, uint256 prNumber, string prURL, address creator, address solver, uint256 amount, uint8 status, uint256 createdAt))',
  'function getRepoBounties(string repo) external view returns (uint256[])',
  'function getBountyByIssue(string issueURL) external view returns (uint256)',
  'function getBountyByPR(string prURL) external view returns (uint256)',
  'function getUserBounties(address user) external view returns (uint256[])',
  'function getTotalBounties() external view returns (uint256)',
])

export const USDC_ABI = parseAbi([
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
])

export const STATUS_MAP = ['Open', 'Submitted', 'Approved', 'Rejected'] as const
