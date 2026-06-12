'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useSmartAccount, SmartAccountState } from '@/hooks/use-smart-account'

interface SmartAccountContextType extends SmartAccountState {
  createSmartAccount: () => Promise<void>
  deploySmartAccount: () => Promise<void>
  sendUserOperation: (calls: Array<{
    to: `0x${string}`
    value?: bigint
    data?: `0x${string}`
  }>) => Promise<`0x${string}`>
}

const SmartAccountContext = createContext<SmartAccountContextType | undefined>(undefined)

export function SmartAccountProvider({ children }: { children: ReactNode }) {
  const smartAccount = useSmartAccount()

  return (
    <SmartAccountContext.Provider value={smartAccount}>
      {children}
    </SmartAccountContext.Provider>
  )
}

export function useSmartAccountContext() {
  const context = useContext(SmartAccountContext)
  if (context === undefined) {
    throw new Error('useSmartAccountContext must be used within a SmartAccountProvider')
  }
  return context
}
