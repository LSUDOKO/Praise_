'use client'

import { useWeb3Auth } from '@/components/web3auth-provider'

/**
 * Unified wallet hook that wraps Web3Auth embedded wallet.
 * Provides a consistent interface for all components that need wallet access.
 * Use this instead of wagmi's useAccount for the embedded wallet experience.
 */
export function useWallet() {
  const {
    address,
    isConnected,
    isInitializing,
    userInfo,
    chainId,
    login,
    logout,
    getBalance,
    signMessage,
    getAccounts,
    switchChain,
  } = useWeb3Auth()

  const isConnecting = isInitializing

  return {
    address: address as `0x${string}` | undefined,
    isConnected,
    isConnecting,
    chainId,
    userInfo,
    login,
    logout,
    getBalance,
    signMessage,
    getAccounts,
    switchChain,
  }
}
