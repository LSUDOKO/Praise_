'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Zap, CheckCircle2, XCircle, ArrowRight, Shield } from 'lucide-react'
import { useRelayer } from '@/hooks/use-relayer'

interface BountyReleaseProps {
  bountyAddress: string
  recipientAddress: string
  amount: number
  aiScore: number
  onReleaseComplete?: (success: boolean, txHash?: string) => void
}

export function BountyRelease({
  bountyAddress,
  recipientAddress,
  amount,
  aiScore,
  onReleaseComplete,
}: BountyReleaseProps) {
  const { address, isConnected } = useAccount()
  const { isReleasing, releaseBounty } = useRelayer()
  const [releaseStatus, setReleaseStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)

  const handleRelease = async () => {
    if (!isConnected) return

    const result = await releaseBounty({
      bountyAddress,
      recipientAddress,
      amount,
      aiScore,
    })

    if (result.success) {
      setReleaseStatus('success')
      setTxHash(result.txHash || null)
      onReleaseComplete?.(true, result.txHash)
    } else {
      setReleaseStatus('error')
      onReleaseComplete?.(false)
    }
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[--brand-teal]" />
          Bounty Release
        </CardTitle>
        <CardDescription>
          Release funds via 1Shot Relayer (gasless for recipient)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Release Details */}
        <div className="p-4 rounded-lg bg-white/5 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Release Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bounty</span>
              <Badge variant="outline" className="font-mono text-xs">
                {bountyAddress.slice(0, 6)}...{bountyAddress.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Recipient</span>
              <Badge variant="outline" className="font-mono text-xs">
                {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Amount</span>
              <span className="text-white font-medium">{amount} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">AI Score</span>
              <Badge
                variant={aiScore >= 80 ? 'default' : 'secondary'}
                className={aiScore >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
              >
                {aiScore}/100
              </Badge>
            </div>
          </div>
        </div>

        {/* Gas Info */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-blue-300">
              Gas will be paid in USDC from the released amount. 
              Recipient receives {amount} USDC without needing ETH.
            </span>
          </div>
        </div>

        {/* Release Status */}
        {releaseStatus === 'success' && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm text-green-300">Release Successful!</p>
            {txHash && (
              <p className="text-xs text-green-400 mt-1 font-mono">
                TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </p>
            )}
          </div>
        )}

        {releaseStatus === 'error' && (
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-red-300">Release Failed</p>
            <p className="text-xs text-red-400 mt-1">Please try again or contact support</p>
          </div>
        )}

        {/* Release Button */}
        {releaseStatus === 'idle' && (
          <Button
            onClick={handleRelease}
            disabled={!isConnected || isReleasing}
            className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
          >
            {isReleasing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Releasing via 1Shot...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Release {amount} USDC
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {/* Security Note */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Non-custodial: funds are released from smart contract escrow</span>
        </div>
      </CardContent>
    </Card>
  )
}
