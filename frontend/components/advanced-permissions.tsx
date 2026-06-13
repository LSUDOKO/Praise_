'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/hooks/use-wallet'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Loader2, CheckCircle2, XCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react'
import { usePermissions } from '@/hooks/use-permissions'
import { USDC_ADDRESS } from '@/lib/permissions'
import { CURRENT_NETWORK } from '@/lib/contracts'

interface PermissionFormData {
  bountyAddress: string
  agentAddress: string
  maxAmount: string
  durationDays: string
  minAIScore: string
}

export function AdvancedPermissions() {
  const { address, isConnected } = useWallet()
  const {
    supportedPermissions,
    grantedPermissions,
    isSupported,
    isLoading,
    isRequesting,
    error,
    checkSupport,
    fetchGrantedPermissions,
    requestPermission,
  } = usePermissions()

  const [formData, setFormData] = useState<PermissionFormData>({
    bountyAddress: '',
    agentAddress: '',
    maxAmount: '',
    durationDays: '90',
    minAIScore: '80',
  })

  const handleGrantPermission = async () => {
    if (!isConnected || !formData.bountyAddress || !formData.agentAddress || !formData.maxAmount) {
      return
    }

    const granted = await requestPermission({
      bountyAddress: formData.bountyAddress,
      agentAddress: formData.agentAddress,
      maxAmount: Number(formData.maxAmount),
      durationDays: Number(formData.durationDays),
      minAIScore: Number(formData.minAIScore),
    })

    if (granted) {
      setFormData({
        bountyAddress: '',
        agentAddress: '',
        maxAmount: '',
        durationDays: '90',
        minAIScore: '80',
      })
    }
  }

  return (
    <Card className="glass border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[--brand-teal]" />
          Advanced Permissions (ERC-7715)
        </CardTitle>
        <CardDescription>
          Grant time-bounded, scope-bounded, amount-bounded authority to AI agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Support Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">ERC-7715 Support</span>
          </div>
          <Badge
            variant={isSupported ? 'default' : 'secondary'}
            className={isSupported ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : isSupported ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {isLoading ? 'Checking...' : isSupported ? 'Supported' : 'Not Supported'}
          </Badge>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Grant New Permission Form */}
        <div className="space-y-4 p-4 rounded-lg bg-white/5">
          <h4 className="text-sm font-medium text-gray-300">Grant New Permission</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bountyAddress">Bounty Contract</Label>
              <Input
                id="bountyAddress"
                placeholder="0x..."
                value={formData.bountyAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, bountyAddress: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-gray-500">
                {CURRENT_NETWORK.bountyFactoryAddress.slice(0, 6)}...{CURRENT_NETWORK.bountyFactoryAddress.slice(-4)} (Factory)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentAddress">Agent Address</Label>
              <Input
                id="agentAddress"
                placeholder="0x..."
                value={formData.agentAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, agentAddress: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
              <p className="text-xs text-gray-500">
                {CURRENT_NETWORK.agentDelegationAddress.slice(0, 6)}...{CURRENT_NETWORK.agentDelegationAddress.slice(-4)} (Delegation)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount (USDC)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="100"
                value={formData.maxAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, maxAmount: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                placeholder="90"
                value={formData.durationDays}
                onChange={(e) => setFormData(prev => ({ ...prev, durationDays: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minAIScore">Min AI Score</Label>
              <Input
                id="minAIScore"
                type="number"
                placeholder="80"
                value={formData.minAIScore}
                onChange={(e) => setFormData(prev => ({ ...prev, minAIScore: e.target.value }))}
                className="bg-white/5 border-white/10"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-300">
              <strong>Permission Preview:</strong> Agent can release up to {formData.maxAmount || '0'} USDC 
              from bounty {formData.bountyAddress ? `${formData.bountyAddress.slice(0, 6)}...${formData.bountyAddress.slice(-4)}` : '0x...'} 
              to {formData.agentAddress ? `${formData.agentAddress.slice(0, 6)}...${formData.agentAddress.slice(-4)}` : '0x...'} 
              if AI score ≥ {formData.minAIScore}. Expires in {formData.durationDays} days.
            </p>
          </div>

          <Button
            onClick={handleGrantPermission}
            disabled={!isConnected || isRequesting || !formData.bountyAddress || !formData.agentAddress || !formData.maxAmount || !isSupported}
            className="w-full bg-[--brand-teal] hover:bg-[--brand-teal]/80"
          >
            {isRequesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Requesting Permission in MetaMask...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Grant Permission (ERC-7715)
              </>
            )}
          </Button>
        </div>

        {/* Active Permissions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">Active Permissions</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchGrantedPermissions}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
          
          {grantedPermissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No permissions granted yet</p>
              <p className="text-sm">Grant permission to an AI agent to release bounty funds</p>
            </div>
          ) : (
            <div className="space-y-3">
              {grantedPermissions.map((perm, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {perm.type}
                    </Badge>
                    <Badge variant="default" className="bg-green-500/20 text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {perm.maxAmount} {perm.token}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {perm.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Score ≥{perm.minAIScore}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Justification: {perm.justification}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Expires: {perm.expiry.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supported Permission Types */}
        {supportedPermissions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Supported Permission Types</h4>
            <div className="flex flex-wrap gap-2">
              {supportedPermissions.map((permType, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {permType}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
