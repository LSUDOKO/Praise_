'use client'

import { useSmartAccount } from '@/lib/smart-account/smart-account-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, Wallet, ArrowUpRight, Rocket } from 'lucide-react'

export function SmartAccountStatus() {
  const {
    smartAccount,
    smartAccountAddress,
    isDeployed,
    isCreating,
    deploySmartAccount,
    bundlerConfigured,
  } = useSmartAccount()

  if (!smartAccount && !isCreating) {
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

  if (isCreating) {
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
              {smartAccountAddress?.slice(0, 6)}...{smartAccountAddress?.slice(-4)}
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

        {!isDeployed && smartAccount && (
          <Button
            onClick={deploySmartAccount}
            className="w-full bg-amber-500 text-black hover:bg-amber-400 font-medium"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Deploy Smart Account
          </Button>
        )}

        {smartAccountAddress && (
          <a
            href={`https://sepolia.arbiscan.io/address/${smartAccountAddress}`}
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
