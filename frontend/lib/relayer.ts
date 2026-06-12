import { CURRENT_NETWORK } from './contracts'

// Relayer API URL (local relayer or production)
const RELAYER_API_URL = process.env.NEXT_PUBLIC_RELAYER_URL_TESTNET || 'http://localhost:3000'

// Arbitrum Sepolia Chain ID
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614

export interface RelayerConfig {
  apiUrl: string
  chainId: number
}

export interface ExecuteTransactionParams {
  methodId: string
  params: any[]
  walletId?: string
  memo?: string
  value?: string
  gasLimit?: string
}

export interface RelayerTransactionResult {
  success: boolean
  txHash?: string
  error?: string
  gasUsed?: string
  gasPrice?: string
}

export interface BountyReleaseParams {
  bountyAddress: string
  recipientAddress: string
  amount: number // in USDC (will be converted to wei)
  aiScore: number
}

// Relayer API Client
class OneShotRelayerClient {
  private config: RelayerConfig

  constructor(config: RelayerConfig) {
    this.config = config
  }

  private async apiCall(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.config.apiUrl}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(url, options)
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async executeTransaction(params: ExecuteTransactionParams): Promise<RelayerTransactionResult> {
    try {
      console.log('Executing transaction via relayer:', params)
      
      // Call the relayer API
      const result = await this.apiCall('/release', 'POST', {
        bountyId: params.params[0],
        recipientAddress: params.params[1],
        amount: Number(params.params[2]) / 1e6, // Convert from wei to USDC
      })

      return {
        success: result.success,
        txHash: result.txHash,
        gasUsed: result.gasUsed,
        gasPrice: result.gasPrice,
      }
    } catch (error) {
      console.error('Relayer transaction failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed',
      }
    }
  }

  async executeBatch(transactions: ExecuteTransactionParams[]): Promise<RelayerTransactionResult> {
    try {
      console.log('Executing batch transactions via relayer:', transactions)
      
      // Execute each transaction sequentially
      let lastResult: RelayerTransactionResult = { success: false }
      for (const tx of transactions) {
        lastResult = await this.executeTransaction(tx)
        if (!lastResult.success) break
      }
      
      return lastResult
    } catch (error) {
      console.error('Relayer batch transaction failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch transaction failed',
      }
    }
  }

  async getHealth(): Promise<any> {
    try {
      return await this.apiCall('/health')
    } catch (error) {
      console.error('Failed to get relayer health:', error)
      return { status: 'error', error: error instanceof Error ? error.message : 'Health check failed' }
    }
  }

  async getBounties(): Promise<any[]> {
    try {
      return await this.apiCall('/bounties')
    } catch (error) {
      console.error('Failed to get bounties:', error)
      return []
    }
  }

  async getBountyStatus(bountyId: number): Promise<any> {
    try {
      return await this.apiCall(`/status/${bountyId}`)
    } catch (error) {
      console.error('Failed to get bounty status:', error)
      return null
    }
  }
}

// Initialize relayer client
let relayerClient: OneShotRelayerClient | null = null

export function getRelayerClient(): OneShotRelayerClient {
  if (!relayerClient) {
    relayerClient = new OneShotRelayerClient({
      apiUrl: RELAYER_API_URL,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    })
  }
  return relayerClient
}

// Bounty release function
export async function releaseBountyFunds(params: BountyReleaseParams): Promise<RelayerTransactionResult> {
  const client = getRelayerClient()

  // Convert USDC amount to wei (6 decimals)
  const amountWei = BigInt(Math.floor(params.amount * 1e6))

  console.log('Releasing bounty funds:', {
    bounty: params.bountyAddress,
    recipient: params.recipientAddress,
    amount: params.amount,
    amountWei: amountWei.toString(),
    aiScore: params.aiScore,
  })

  // Call the relayer API to execute the release
  const result = await client.executeTransaction({
    methodId: 'bounty-release',
    params: [
      params.bountyAddress,
      params.recipientAddress,
      amountWei.toString(),
      params.aiScore,
    ],
    memo: `PRaise bounty release: ${params.amount} USDC`,
  })

  return result
}

// Check relayer status
export async function checkRelayerStatus(): Promise<{
  connected: boolean
  chainId: number
  balance: string
  error?: string
}> {
  try {
    const client = getRelayerClient()
    const health = await client.getHealth()

    return {
      connected: health.status === 'ok',
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      balance: health.relayer ? 'Connected' : '0',
    }
  } catch (error) {
    return {
      connected: false,
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
      balance: '0',
      error: error instanceof Error ? error.message : 'Failed to check relayer status',
    }
  }
}

// Webhook verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  publicKey: string
): boolean {
  // In production, this would verify the webhook signature
  // using crypto.createHmac('sha256', secret).update(payload).digest('hex')
  console.log('Verifying webhook signature:', { payload: payload.substring(0, 50), signature, publicKey })
  return true
}

export { ARBITRUM_SEPOLIA_CHAIN_ID }
