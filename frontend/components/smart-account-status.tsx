'use client'

import { useSmartAccountContext } from '@/components/smart-account-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Wallet, ArrowUpRight } from 'lucide-react'

export function SmartAccountStatus() {
  const {
    smartAccount,
    isDeployed,
    address,
    isLoading,
    error,
    deploySmartAccount,
  } = useSmartAccountContext()

  if (!smartAccount && !isLoading) {
    return (
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[--brand-teal]" />
            Smart Account
          </CardTitle>
          <CardDescription>
            Connect your wallet to create a smart account
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="glass border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-[--brand-teal] animate-spin" />
            Creating Smart Account...
          </CardTitle>
          <CardDescription>
            Setting up your smart account on Arbitrum Sepolia
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="glass border-red-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <XCircle className="h-5 w-5" />
            Smart Account Error
          </CardTitle>
          <CardDescription className="text-red-300">
            {error}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-[--brand-teal]" />
          Smart Account
        </CardTitle>
        <CardDescription>
          Your smart account on Arbitrum Sepolia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Address</span>
            <Badge variant="outline" className="font-mono text-xs">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Status</span>
            <Badge
              variant={isDeployed ? 'default' : 'secondary'}
              className={isDeployed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
            >
              {isDeployed ? 'Deployed' : 'Not Deployed'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Chain</span>
            <Badge variant="outline">Arbitrum Sepolia</Badge>
          </div>
        </div>

        {!isDeployed && (
          <Button
            onClick={deploySmartAccount}
            className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
          >
            Deploy Smart Account
          </Button>
        )}

        {address && (
          <a
            href={`https://sepolia.arbiscan.io/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-sm text-[--brand-blue] hover:underline"
          >
            View on Arbiscan
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  )
}
