'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle2, XCircle, DollarSign } from 'lucide-react'
import { useX402, X402_SERVICES } from '@/hooks/use-x402'

interface PayPerCallProps {
  service: keyof typeof X402_SERVICES
  onPaymentComplete?: (txHash: string) => void
  children?: React.ReactNode
}

export function PayPerCall({ service, onPaymentComplete, children }: PayPerCallProps) {
  const {
    isPaying,
    lastPaymentHash,
    error,
    payForService,
  } = useX402()

  const config = X402_SERVICES[service]

  const handlePay = async () => {
    const txHash = await payForService(service)
    if (txHash) {
      onPaymentComplete?.(txHash)
    }
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[--brand-teal]" />
          Pay-Per-Call
        </CardTitle>
        <CardDescription>
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Cost per call</span>
          </div>
          <Badge variant="outline" className="bg-[--brand-teal]/10 text-[--brand-teal]">
            {config.amount} USDC
          </Badge>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Payment Success */}
        {lastPaymentHash && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-300">Payment Successful</span>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              TX: {lastPaymentHash.slice(0, 10)}...{lastPaymentHash.slice(-8)}
            </p>
          </div>
        )}

        {/* Pay Button */}
        <Button
          onClick={handlePay}
          disabled={isPaying}
          className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
        >
          {isPaying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay {config.amount} USDC
            </>
          )}
        </Button>

        {/* Children (content to show after payment) */}
        {lastPaymentHash && children && (
          <div className="mt-4 pt-4 border-t border-white/10">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
