'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  releaseBountyFunds,
  checkRelayerStatus,
  BountyReleaseParams,
  RelayerTransactionResult,
} from '@/lib/relayer'

export interface RelayerState {
  isConnected: boolean
  chainId: number
  balance: string
  isReleasing: boolean
  lastReleaseResult: RelayerTransactionResult | null
  error: string | null
}

export function useRelayer() {
  const [state, setState] = useState<RelayerState>({
    isConnected: false,
    chainId: 0,
    balance: '0',
    isReleasing: false,
    lastReleaseResult: null,
    error: null,
  })

  const checkStatus = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }))

    try {
      const status = await checkRelayerStatus()
      setState(prev => ({
        ...prev,
        isConnected: status.connected,
        chainId: status.chainId,
        balance: status.balance,
        error: status.error || null,
      }))
    } catch (err) {
      console.error('Failed to check relayer status:', err)
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to check relayer status',
      }))
    }
  }, [])

  const releaseBounty = useCallback(async (params: BountyReleaseParams): Promise<RelayerTransactionResult> => {
    setState(prev => ({ ...prev, isReleasing: true, error: null, lastReleaseResult: null }))

    try {
      const result = await releaseBountyFunds(params)

      setState(prev => ({
        ...prev,
        isReleasing: false,
        lastReleaseResult: result,
        error: result.success ? null : result.error || 'Release failed',
      }))

      return result
    } catch (err) {
      console.error('Bounty release failed:', err)
      const errorResult: RelayerTransactionResult = {
        success: false,
        error: err instanceof Error ? err.message : 'Bounty release failed',
      }

      setState(prev => ({
        ...prev,
        isReleasing: false,
        lastReleaseResult: errorResult,
        error: errorResult.error || 'Release failed',
      }))

      return errorResult
    }
  }, [])

  // Check status on mount
  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  return {
    ...state,
    checkStatus,
    releaseBounty,
  }
}
