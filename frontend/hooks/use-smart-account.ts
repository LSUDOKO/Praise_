'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { Implementation, toMetaMaskSmartAccount } from '@metamask/smart-accounts-kit'
import type { SmartAccount } from '@metamask/smart-accounts-kit'

export interface SmartAccountState {
  smartAccount: SmartAccount | null
  isDeployed: boolean
  address: `0x${string}` | null
  isLoading: boolean
  error: string | null
}

export function useSmartAccount() {
  const { address: eoaAddress, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [state, setState] = useState<SmartAccountState>({
    smartAccount: null,
    isDeployed: false,
    address: null,
    isLoading: false,
    error: null,
  })

  const createSmartAccount = useCallback(async () => {
    if (!walletClient || !eoaAddress || !publicClient) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [eoaAddress, [], [], []],
        deploySalt: '0x',
        signer: { walletClient },
      })

      const code = await publicClient.getCode({
        address: smartAccount.address,
      })
      const isDeployed = code !== undefined && code !== '0x'

      setState({
        smartAccount,
        isDeployed,
        address: smartAccount.address,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error('Failed to create smart account:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create smart account',
      }))
    }
  }, [walletClient, eoaAddress, publicClient])

  const deploySmartAccount = useCallback(async () => {
    if (!state.smartAccount) {
      setState(prev => ({ ...prev, error: 'Smart account not created' }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const hash = await state.smartAccount.deploy()
      await publicClient?.waitForTransactionReceipt({ hash })

      setState(prev => ({
        ...prev,
        isDeployed: true,
        isLoading: false,
      }))
    } catch (err) {
      console.error('Failed to deploy smart account:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to deploy smart account',
      }))
    }
  }, [state.smartAccount, publicClient])

  const sendUserOperation = useCallback(async (
    calls: Array<{
      to: `0x${string}`
      value?: bigint
      data?: `0x${string}`
    }>
  ) => {
    if (!state.smartAccount) {
      throw new Error('Smart account not created')
    }

    console.log('Sending user operation:', calls)
    return '0x' as `0x${string}`
  }, [state.smartAccount])

  useEffect(() => {
    if (isConnected && walletClient && eoaAddress && !state.smartAccount && !state.isLoading) {
      createSmartAccount()
    }
  }, [isConnected, walletClient, eoaAddress, state.smartAccount, state.isLoading, createSmartAccount])

  return {
    ...state,
    createSmartAccount,
    deploySmartAccount,
    sendUserOperation,
  }
}
