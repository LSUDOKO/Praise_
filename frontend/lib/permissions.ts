import {
  createWalletClient,
  custom,
  parseUnits,
  createPublicClient,
  http,
} from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import {
  erc7715ProviderActions,
  WalletClientWithPermissions,
} from '@metamask/smart-accounts-kit/actions'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'),
})

// USDC address on Arbitrum Sepolia
export const USDC_ADDRESS = '0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9' as `0x${string}`

export function createPermissionWalletClient(): WalletClientWithPermissions {
  if (typeof window === 'undefined') {
    throw new Error('Permission wallet client can only be created in browser')
  }

  if (!window.ethereum) {
    throw new Error('MetaMask not detected')
  }

  const walletClient = createWalletClient({
    transport: custom(window.ethereum),
  }).extend(erc7715ProviderActions() as any)

  return walletClient as unknown as WalletClientWithPermissions
}

export interface BountyPermissionParams {
  bountyAddress: string
  agentAddress: string
  maxAmount: number // in USDC (will be converted to wei)
  durationDays: number
  minAIScore: number
}

export async function requestBountyPermission(params: BountyPermissionParams) {
  const walletClient = createPermissionWalletClient()

  const currentTime = Math.floor(Date.now() / 1000)
  const expiry = currentTime + (params.durationDays * 24 * 60 * 60)

  const grantedPermissions = await walletClient.requestExecutionPermissions([
    {
      chainId: arbitrumSepolia.id,
      expiry,
      to: params.agentAddress,
      permission: {
        type: 'erc20-token-allowance',
        data: {
          tokenAddress: USDC_ADDRESS,
          allowanceAmount: parseUnits(params.maxAmount.toString(), 6),
          startTime: currentTime,
          justification: `Permission to release up to ${params.maxAmount} USDC from Bounty at ${params.bountyAddress}`,
        },
        isAdjustmentAllowed: false,
      },
    },
  ])

  return grantedPermissions
}

export async function checkSupportedPermissions() {
  const walletClient = createPermissionWalletClient()
  const supported = await walletClient.getSupportedExecutionPermissions()
  return supported
}

export async function getGrantedPermissions() {
  const walletClient = createPermissionWalletClient()
  const granted = await walletClient.getGrantedExecutionPermissions()
  return granted
}

export interface RedelegationParams {
  permissionContext: any
  toAddress: string
  maxAmount: number
}

export async function createRedelegation(params: RedelegationParams) {
  const walletClient = createPermissionWalletClient()

  // Import required functions from the kit
  const { getSmartAccountsEnvironment, CaveatType } = await import('@metamask/smart-accounts-kit')

  const environment = getSmartAccountsEnvironment(arbitrumSepolia.id)

  // Note: In production, you would use the session account's redelegatePermissionContext
  // This is a simplified version showing the concept
  console.log('Creating redelegation to:', params.toAddress)
  console.log('Max amount:', params.maxAmount, 'USDC')
  console.log('Permission context:', params.permissionContext)

  return { success: true }
}

export interface PermissionDisplayInfo {
  type: string
  token: string
  maxAmount: string
  duration: string
  minAIScore: number
  justification: string
  expiry: Date
}

export function formatPermissionForDisplay(permission: any): PermissionDisplayInfo {
  return {
    type: permission.permission?.type || 'erc20-token-allowance',
    token: 'USDC',
    maxAmount: permission.permission?.data?.allowanceAmount
      ? (Number(permission.permission.data.allowanceAmount) / 1e6).toString()
      : '0',
    duration: permission.expiry
      ? `${Math.floor((permission.expiry - Math.floor(Date.now() / 1000)) / 86400)} days`
      : 'N/A',
    minAIScore: 80,
    justification: permission.permission?.data?.justification || 'Bounty release permission',
    expiry: permission.expiry ? new Date(permission.expiry * 1000) : new Date(),
  }
}
