'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import {
  requestBountyPermission,
  checkSupportedPermissions,
  getGrantedPermissions,
  formatPermissionForDisplay,
  PermissionDisplayInfo,
  BountyPermissionParams,
} from '@/lib/permissions'

export interface PermissionState {
  supportedPermissions: any[]
  grantedPermissions: PermissionDisplayInfo[]
  isSupported: boolean
  isLoading: boolean
  isRequesting: boolean
  error: string | null
}

export function usePermissions() {
  const { address, isConnected } = useAccount()
  const [state, setState] = useState<PermissionState>({
    supportedPermissions: [],
    grantedPermissions: [],
    isSupported: false,
    isLoading: false,
    isRequesting: false,
    error: null,
  })

  const checkSupport = useCallback(async () => {
    if (!isConnected) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const supported = await checkSupportedPermissions()
      const permissions = Array.isArray(supported) ? supported : (supported as any)?.permissions || []
      setState(prev => ({
        ...prev,
        supportedPermissions: permissions,
        isSupported: permissions.length > 0,
        isLoading: false,
      }))
    } catch (err) {
      console.error('Failed to check permission support:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        isSupported: false,
        error: err instanceof Error ? err.message : 'Failed to check permission support',
      }))
    }
  }, [isConnected])

  const fetchGrantedPermissions = useCallback(async () => {
    if (!isConnected) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const granted = await getGrantedPermissions()
      const formattedPermissions = (granted || []).map(formatPermissionForDisplay)

      setState(prev => ({
        ...prev,
        grantedPermissions: formattedPermissions,
        isLoading: false,
      }))
    } catch (err) {
      console.error('Failed to fetch granted permissions:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch granted permissions',
      }))
    }
  }, [isConnected])

  const requestPermission = useCallback(async (params: BountyPermissionParams) => {
    if (!isConnected) {
      setState(prev => ({ ...prev, error: 'Wallet not connected' }))
      return null
    }

    setState(prev => ({ ...prev, isRequesting: true, error: null }))

    try {
      const granted = await requestBountyPermission(params)

      // Refresh granted permissions
      await fetchGrantedPermissions()

      setState(prev => ({ ...prev, isRequesting: false }))
      return granted
    } catch (err) {
      console.error('Failed to request permission:', err)
      setState(prev => ({
        ...prev,
        isRequesting: false,
        error: err instanceof Error ? err.message : 'Failed to request permission',
      }))
      return null
    }
  }, [isConnected, fetchGrantedPermissions])

  // Check support on mount
  useEffect(() => {
    if (isConnected) {
      checkSupport()
      fetchGrantedPermissions()
    }
  }, [isConnected, checkSupport, fetchGrantedPermissions])

  return {
    ...state,
    checkSupport,
    fetchGrantedPermissions,
    requestPermission,
  }
}
