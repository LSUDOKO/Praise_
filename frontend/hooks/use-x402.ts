'use client'

import { useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { X402_SERVICES, type X402PaymentRequest } from '@/lib/x402'

export { X402_SERVICES }

export interface X402State {
  isPaying: boolean
  lastPaymentHash: string | null
  error: string | null
  balance: number | null
}

export function useX402() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [state, setState] = useState<X402State>({
    isPaying: false,
    lastPaymentHash: null,
    error: null,
    balance: null,
  })

  const payForService = useCallback(async (
    service: X402PaymentRequest['service']
  ): Promise<string | null> => {
    if (!walletClient || !address) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return null
    }

    setState(prev => ({ ...prev, isPaying: true, error: null }))

    try {
      const config = X402_SERVICES[service]

      const response = await fetch('/api/x402/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          amount: config.amount,
          payer: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Payment request failed')
      }

      const { paymentRequest } = await response.json()

      const txHash = await walletClient.sendTransaction({
        to: paymentRequest.payee,
        value: BigInt(paymentRequest.amountWei),
      })

      setState(prev => ({
        ...prev,
        isPaying: false,
        lastPaymentHash: txHash,
      }))

      return txHash
    } catch (err) {
      console.error('x402 payment failed:', err)
      setState(prev => ({
        ...prev,
        isPaying: false,
        error: err instanceof Error ? err.message : 'Payment failed',
      }))
      return null
    }
  }, [walletClient, address])

  const checkBalance = useCallback(async () => {
    if (!walletClient || !address) return

    try {
      const balance = await walletClient.getBalance({ address })
      setState(prev => ({
        ...prev,
        balance: Number(balance) / 1e18,
      }))
    } catch (err) {
      console.error('Failed to check balance:', err)
    }
  }, [walletClient, address])

  const reset = useCallback(() => {
    setState({
      isPaying: false,
      lastPaymentHash: null,
      error: null,
      balance: null,
    })
  }, [])

  return {
    ...state,
    payForService,
    checkBalance,
    reset,
    isConnected: !!address && !!walletClient,
  }
}
