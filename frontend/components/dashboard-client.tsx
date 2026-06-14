'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Wallet, Copy, CheckCircle2, ExternalLink, LogOut, ChevronDown, Shield, Rocket, Loader2 } from 'lucide-react'
import { useWallet } from '@/hooks/use-wallet'
import { useSmartAccount } from '@/lib/smart-account/smart-account-provider'
import RoleToggle from './role-toggle'
import CompanyDashboard from './company-dashboard'
import DeveloperDashboard from './developer-dashboard'
import { SmartAccountStatus } from './smart-account-status'
import { RelayerStatus } from './relayer-status'
import { VeniceStatus } from './venice-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardClient() {
  const [role, setRole] = useState<'company' | 'developer'>('company')
  const [copied, setCopied] = useState(false)
  const { isConnected, address, chainId, login, logout } = useWallet()
  const { smartAccountAddress, isDeployed, isCreating, deploySmartAccount, bundlerConfigured } = useSmartAccount()

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const needsDeploy = isConnected && smartAccountAddress && !isDeployed && bundlerConfigured
  const isDeploying = isCreating

  return (
    <div className="min-h-screen bg-background grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[var(--text-dim)] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="w-px h-5 bg-white/10" />
            <Image
              src="/praise-logo.svg"
              alt="PRaise"
              width={120}
              height={16}
              priority
            />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Smart Account Deploy Button — only if bundler is configured */}
            {needsDeploy && !isDeploying && (
              <button
                onClick={deploySmartAccount}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <Rocket className="w-3.5 h-3.5" />
                Deploy Account
              </button>
            )}
            {needsDeploy && isDeploying && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Deploying...
              </div>
            )}

            {/* Ready badge — deployed or counterfactual (auto-deploy on first tx) */}
            {isConnected && smartAccountAddress && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${isDeployed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDeployed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`text-xs font-medium ${isDeployed ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isDeployed ? 'Deployed' : 'Ready'}
                </span>
              </div>
            )}

            {/* Connect / Wallet Dropdown */}
            {!isConnected ? (
              <button
                onClick={login}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--brand-teal)]/40 text-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/10 transition-all group"
              >
                <Wallet className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Connect Wallet
              </button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all group">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                    <span className="text-xs font-mono text-white font-medium">
                      {address?.slice(0, 6)}
                    </span>
                    <ChevronDown className="w-3 h-3 text-[var(--text-dim)] group-hover:text-white transition-colors" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 bg-black/95 border-white/10 backdrop-blur-xl">
                  <DropdownMenuLabel className="text-white">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-[var(--brand-teal)]" />
                      Connected Wallet
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* Wallet Address */}
                  <div className="px-2 py-3">
                    <div className="text-xs text-[var(--text-dim)] mb-1">Address</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-white font-mono flex-1 truncate bg-white/5 px-2 py-1 rounded">
                        {address}
                      </code>
                      <button
                        onClick={copyAddress}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                        )}
                      </button>
                      <a
                        href={`https://sepolia.arbiscan.io/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-dim)] hover:text-white" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Network Info */}
                  <div className="px-2 pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-dim)]">Network</span>
                      <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                        Arbitrum Sepolia
                        {chainId === 421614 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1.5" />
                        )}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  {/* Smart Account Status */}
                  <div className="px-2 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-[var(--text-dim)]">
                        <Shield className="w-3 h-3" />
                        Smart Account
                      </div>
                      {isCreating ? (
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                          Creating...
                        </Badge>
                      ) : smartAccountAddress ? (
                        <Badge variant="outline" className={`text-xs ${isDeployed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {isDeployed ? 'Deployed' : 'Ready to Deploy'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                          None
                        </Badge>
                      )}
                    </div>
                    {smartAccountAddress && (
                      <code className="text-xs text-white/60 font-mono truncate block">
                        {smartAccountAddress.slice(0, 10)}...{smartAccountAddress.slice(-6)}
                      </code>
                    )}
                    {needsDeploy && (
                      <Button
                        onClick={deploySmartAccount}
                        size="sm"
                        className="w-full mt-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 text-xs"
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        Deploy Now
                      </Button>
                    )}
                    {smartAccountAddress && !isDeployed && !bundlerConfigured && (
                      <div className="mt-2 text-[10px] text-amber-400/70 text-center">
                        Auto-deploys on first transaction. Set <code className="text-[9px]">NEXT_PUBLIC_BUNDLER_RPC_URL</code> to deploy now.
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenuSeparator className="bg-white/10" />
                  
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect Wallet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome & Role Toggle */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                {role === 'company' 
                  ? 'Create bounties for your GitHub issues and let developers solve them'
                  : 'Browse open bounties and earn rewards by submitting PRs'
                }
              </p>
            </div>
            {isConnected && address && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-dim)] bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
              </div>
            )}
          </div>
          <div className="max-w-md">
            <RoleToggle role={role} onRoleChange={setRole} />
          </div>
        </div>

        {/* Infrastructure Status Cards (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SmartAccountStatus />
          <RelayerStatus />
          <VeniceStatus />
        </div>

        {/* Role-specific Content */}
        {role === 'company' ? <CompanyDashboard /> : <DeveloperDashboard />}
      </main>
    </div>
  )
}
