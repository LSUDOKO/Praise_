import { Implementation, toMetaMaskSmartAccount, SmartAccount } from '@metamask/smart-accounts-kit'
import { createPublicClient, http, createWalletClient, custom } from 'viem'
import { arbitrumSepolia } from 'viem/chains'

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc'),
})

export interface SmartAccountConfig {
  privateKey?: `0x${string}`
  walletClient?: any
}

export async function createSmartAccount(config: SmartAccountConfig): Promise<SmartAccount> {
  const ownerAddress = await getOwnerAddress(config)
  
  let signer: { walletClient: any } | { privateKey: `0x${string}` }
  if (config.privateKey) {
    signer = { privateKey: config.privateKey }
  } else {
    signer = { walletClient: config.walletClient }
  }

  const smartAccount = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [ownerAddress, [], [], []],
    deploySalt: '0x',
    signer,
  })

  return smartAccount
}

async function getOwnerAddress(config: SmartAccountConfig): Promise<`0x${string}`> {
  if (config.privateKey) {
    const walletClient = createWalletClient({
      account: config.privateKey,
      chain: arbitrumSepolia,
      transport: http(),
    })
    return walletClient.account.address
  }
  return config.walletClient!.account!.address
}

export async function deploySmartAccount(smartAccount: SmartAccount) {
  const isDeployed = await publicClient.getCode({
    address: smartAccount.address,
  })

  if (isDeployed && isDeployed !== '0x') {
    return { deployed: true, address: smartAccount.address, alreadyDeployed: true }
  }

  const hash = await smartAccount.deploy()
  await publicClient.waitForTransactionReceipt({ hash })

  return { deployed: true, address: smartAccount.address, txHash: hash }
}

export async function sendUserOperation(
  smartAccount: SmartAccount,
  calls: Array<{
    to: `0x${string}`
    value?: bigint
    data?: `0x${string}`
  }>
) {
  const bundlerClient = createBundlerClient(smartAccount)

  const hash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls,
  })

  return hash
}

export async function sendGaslessTransaction(
  smartAccount: SmartAccount,
  calls: Array<{
    to: `0x${string}`
    value?: bigint
    data?: `0x${string}`
  }>,
  paymasterClient: any
) {
  const bundlerClient = createBundlerClient(smartAccount)

  const hash = await bundlerClient.sendUserOperation({
    account: smartAccount,
    calls,
    paymaster: paymasterClient,
  })

  return hash
}

function createBundlerClient(smartAccount: SmartAccount) {
  // In a real implementation, you would use a bundler client from Pimlico, ZeroDev, etc.
  // For now, we'll use the public client as a placeholder
  return {
    sendUserOperation: async (params: any) => {
      // This is a placeholder - in production, use a real bundler
      console.log('Sending user operation:', params)
      return '0x' as `0x${string}`
    },
  }
}

export { publicClient }
