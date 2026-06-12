'use client'

import { useRelayer } from '@/hooks/use-relayer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Zap, CheckCircle2, XCircle, RefreshCw, DollarSign, Link } from 'lucide-react'

export function RelayerStatus() {
  const {
    isConnected,
    chainId,
    balance,
    isReleasing,
    lastReleaseResult,
    error,
    checkStatus,
  } = useRelayer()

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-[--brand-teal]" />
          1Shot Relayer
        </CardTitle>
        <CardDescription>
          Gasless transactions via 1Shot Permissionless Relayer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Connection</span>
          </div>
          <Badge
            variant={isConnected ? 'default' : 'secondary'}
            className={isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
          >
            {isConnected ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>

        {/* Chain Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <span className="text-sm text-gray-400">Chain</span>
          <Badge variant="outline">
            {chainId === 421614 ? 'Arbitrum Sepolia' : `Chain ${chainId}`}
          </Badge>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Relayer Balance (USDC)</span>
          </div>
          <span className="text-sm font-medium text-white">{balance} USDC</span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Last Release Result */}
        {lastReleaseResult && (
          <div className={`p-3 rounded-lg ${lastReleaseResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {lastReleaseResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${lastReleaseResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {lastReleaseResult.success ? 'Release Successful' : 'Release Failed'}
              </span>
            </div>
            {lastReleaseResult.txHash && (
              <p className="text-xs text-gray-400 font-mono">
                TX: {lastReleaseResult.txHash.slice(0, 10)}...{lastReleaseResult.txHash.slice(-8)}
              </p>
            )}
            {lastReleaseResult.gasUsed && (
              <p className="text-xs text-gray-400 mt-1">
                Gas: {lastReleaseResult.gasUsed} | Price: {lastReleaseResult.gasPrice} gwei
              </p>
            )}
          </div>
        )}

        {/* Features */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Features</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Gas in USDC
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              No ETH Required
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Public Relayer
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" />
              Webhook Status
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={checkStatus}
          variant="outline"
          className="w-full border-white/10 hover:bg-white/5"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
