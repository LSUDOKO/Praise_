'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import RoleToggle from './role-toggle'
import CompanyDashboard from './company-dashboard'
import DeveloperDashboard from './developer-dashboard'
import { SmartAccountStatus } from './smart-account-status'
import { RelayerStatus } from './relayer-status'
import { VeniceStatus } from './venice-status'

export default function DashboardClient() {
  const [role, setRole] = useState<'company' | 'developer'>('company')

  return (
    <div className="min-h-screen bg-background grid-bg noise">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            {/* Custom Wallet Button */}
            <ConnectButton.Custom>
              {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
                if (!mounted) return null
                if (!account) return (
                  <button
                    onClick={openConnectModal}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[var(--brand-teal)]/40 text-[var(--brand-teal)] hover:bg-[var(--brand-teal)]/10 transition-all"
                  >
                    Connect Wallet
                  </button>
                )
                return (
                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-teal)]" />
                    <span className="text-xs font-mono text-white">
                      {account.address.slice(0, 6)}…{account.address.slice(-4)}
                    </span>
                  </button>
                )
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Role Toggle */}
        <div className="mb-8 max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-sm text-[var(--text-dim)] mb-4">
            {role === 'company' 
              ? 'Create bounties for your GitHub issues and let developers solve them'
              : 'Browse open bounties and earn rewards by submitting PRs'
            }
          </p>
          <RoleToggle role={role} onRoleChange={setRole} />
        </div>

        {/* Infrastructure Status */}
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
