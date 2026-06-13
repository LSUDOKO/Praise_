'use client'

import { useState, useEffect } from 'react'
import { User, Bot, Wallet, Search, Code2, GitPullRequest, Trophy, ExternalLink } from 'lucide-react'
import BountyList from './bounty-list'
import AgentModeContent from './agent-mode-content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBountyStore } from '@/lib/bounty-store'
import { useWallet } from '@/hooks/use-wallet'

export default function DeveloperDashboard() {
  const [solverType, setSolverType] = useState<'human' | 'agent'>('human')
  const { fetchBounties, bounties } = useBountyStore()
  const { isConnected, login, address } = useWallet()

  useEffect(() => { fetchBounties() }, [fetchBounties])

  const openBounties = bounties.filter(b => b.status === 'open')
  const mySubmissions = bounties.filter(b => 
    b.solverWallet?.toLowerCase() === address?.toLowerCase()
  )

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-8">
      {/* Left Column — Developer Info & Stats */}
      <div className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-4">
        {/* Stats Overview */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--brand-teal)]" />
              Your Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
                <div className="text-2xl font-bold text-[var(--brand-teal)]">{openBounties.length}</div>
                <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Open Bounties</div>
              </div>
              <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
                <div className="text-2xl font-bold text-[var(--brand-blue)]">{mySubmissions.length}</div>
                <div className="text-[10px] text-[var(--text-dim)] mt-0.5">Your PRs</div>
              </div>
            </div>

            {!isConnected ? (
              <Button
                onClick={() => login()}
                className="w-full bg-[var(--brand-teal)] text-black hover:bg-[var(--brand-blue)] font-medium"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect to Start
              </Button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--brand-teal)]/30 bg-[var(--brand-glow-teal)]">
                <Wallet className="w-4 h-4 text-[var(--brand-teal)]" />
                <span className="text-xs font-mono text-[var(--brand-teal)]">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Connected
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Solver Type Toggle */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--text-dim)] mb-3 font-medium uppercase tracking-wide">How do you solve bounties?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSolverType('human')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                  solverType === 'human'
                    ? 'border-[var(--brand-teal)]/40 bg-[var(--brand-glow-teal)] text-[var(--brand-teal)]'
                    : 'border-white/10 bg-white/3 text-[var(--text-dim)] hover:border-white/20 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Manually
              </button>
              <button
                onClick={() => setSolverType('agent')}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                  solverType === 'agent'
                    ? 'border-[var(--brand-teal)]/40 bg-[var(--brand-glow-teal)] text-[var(--brand-teal)]'
                    : 'border-white/10 bg-white/3 text-[var(--text-dim)] hover:border-white/20 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                Via Agent
              </button>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--brand-glow-teal)] text-[var(--brand-teal)] flex items-center justify-center text-[10px] font-bold">1</span>
              <span className="text-[var(--text-dim)]">Browse open bounties and pick a GitHub issue to solve</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--brand-glow-teal)] text-[var(--brand-teal)] flex items-center justify-center text-[10px] font-bold">2</span>
              <span className="text-[var(--text-dim)]">Write code and submit a Pull Request</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--brand-glow-teal)] text-[var(--brand-teal)] flex items-center justify-center text-[10px] font-bold">3</span>
              <span className="text-[var(--text-dim)]">Venice AI reviews your PR for quality and spam</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--brand-glow-teal)] text-[var(--brand-teal)] flex items-center justify-center text-[10px] font-bold">4</span>
              <span className="text-[var(--text-dim)]">Get paid in USDC if your PR is approved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column — Bounties */}
      <div className="flex flex-col gap-6">
        {solverType === 'agent' ? (
          <AgentModeContent />
        ) : (
          <>
            {/* Welcome banner */}
            {!isConnected && (
              <Card className="border-[var(--brand-teal)]/20 bg-[var(--brand-glow-teal)]">
                <CardContent className="p-6 text-center">
                  <Code2 className="w-10 h-10 text-[var(--brand-teal)] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-white mb-1">Start Solving Bounties</h3>
                  <p className="text-sm text-[var(--text-dim)] mb-4 max-w-md mx-auto">
                    Connect your wallet to browse open bounties, submit PRs, and earn rewards in USDC.
                  </p>
                  <Button
                    onClick={() => login()}
                    className="bg-[var(--brand-teal)] text-black hover:bg-[var(--brand-blue)] font-medium"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* My Submissions (if any) */}
            {mySubmissions.length > 0 && (
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <GitPullRequest className="w-4 h-4 text-[var(--brand-blue)]" />
                    My Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mySubmissions.map((bounty) => (
                      <div key={bounty.id} className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                        <div className="flex-1 min-w-0">
                          <a
                            href={bounty.githubIssueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-white hover:text-[var(--brand-teal)] transition-colors truncate block"
                          >
                            {bounty.issueTitle}
                          </a>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">
                              {bounty.status}
                            </Badge>
                            <span className="text-[10px] text-[var(--text-dim)]">{bounty.amountMUSDC} USDC</span>
                          </div>
                        </div>
                        {bounty.prUrl && (
                          <a
                            href={bounty.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bounty List */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">Available Bounties</h3>
                <p className="text-sm text-[var(--text-dim)]">Browse and submit PRs to earn rewards</p>
              </div>
              <BountyList showOnlyOpen />
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
