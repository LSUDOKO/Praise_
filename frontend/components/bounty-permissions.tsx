'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Loader2, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { CURRENT_NETWORK } from '@/lib/contracts'

interface BountyPermissionsProps {
  bountyAddress: string
  bountyAmount: number
  onPermissionGranted?: (permission: any) => void
}

export function BountyPermissions({ bountyAddress, bountyAmount, onPermissionGranted }: BountyPermissionsProps) {
  const { address, isConnected } = useAccount()
  const { requestPermission, isRequesting, isSupported } = usePermissions()
  const [agentAddress, setAgentAddress] = useState<string>(CURRENT_NETWORK.agentDelegationAddress || '')
  const [minAIScore, setMinAIScore] = useState('80')
  const [durationDays, setDurationDays] = useState('90')
  const [isGranted, setIsGranted] = useState(false)

  const handleGrantPermission = async () => {
    if (!isConnected || !bountyAddress || !agentAddress) return

    const granted = await requestPermission({
      bountyAddress,
      agentAddress,
      maxAmount: bountyAmount,
      durationDays: Number(durationDays),
      minAIScore: Number(minAIScore),
    })

    if (granted) {
      setIsGranted(true)
      onPermissionGranted?.(granted)
    }
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[--brand-teal]" />
          Bounty Permission Setup
        </CardTitle>
        <CardDescription>
          Grant the AI agent permission to release funds when conditions are met
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Preview */}
        <div className="p-4 rounded-lg bg-white/5 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Permission Details</h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Bounty</span>
              <Badge variant="outline" className="font-mono text-xs">
                {bountyAddress.slice(0, 6)}...{bountyAddress.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Max Release</span>
              <span className="text-white">{bountyAmount} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Agent</span>
              <Badge variant="outline" className="font-mono text-xs">
                {agentAddress.slice(0, 6)}...{agentAddress.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Min AI Score</span>
              <span className="text-white">≥ {minAIScore}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="text-white">{durationDays} days</span>
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agentAddress">Agent Address</Label>
            <Input
              id="agentAddress"
              placeholder="0x..."
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minAIScore">Min AI Score</Label>
              <Input
                id="minAIScore"
                type="number"
                placeholder="80"
                value={minAIScore}
                onChange={(e) => setMinAIScore(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                placeholder="90"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Grant Button */}
        {isGranted ? (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm text-green-300">Permission Granted Successfully!</p>
            <p className="text-xs text-green-400 mt-1">
              The agent can now release funds when conditions are met
            </p>
          </div>
        ) : (
          <Button
            onClick={handleGrantPermission}
            disabled={!isConnected || isRequesting || !agentAddress || !isSupported}
            className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
          >
            {isRequesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting in MetaMask...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Grant Permission to Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}

        {!isSupported && (
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-300">
              Your wallet does not support ERC-7715 Advanced Permissions. 
              Please use MetaMask Flask or MetaMask v13.23+ for full functionality.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
