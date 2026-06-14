'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2, Wallet, Github, CheckCircle2, Rocket, Shield, ArrowRight, Sparkles, Search, Bot, User, FileText, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { useWallet } from '@/hooks/use-wallet'
import { useSmartAccount } from '@/lib/smart-account/smart-account-provider'
import { useBountyStore } from '@/lib/bounty-store'
import { NETWORKS, BOUNTY_FACTORY_ABI, USDC_ABI, CURRENT_NETWORK } from '@/lib/contracts'
import BountyList from './bounty-list'
import AgentModeContent from './agent-mode-content'

type Step = 'wallet' | 'smart-account' | 'bounty' | 'review'

export default function CompanyDashboard() {
  const [githubUrl, setGithubUrl] = useState('')
  const [amount, setAmount] = useState('')
  const { address, isConnected: walletConnected, login } = useWallet()
  const { smartAccount, smartAccountAddress, isDeployed, isCreating, deploySmartAccount, bundlerConfigured } = useSmartAccount()
  const [solverMode, setSolverMode] = useState<'human' | 'agent'>('human')
  const [txStep, setTxStep] = useState<'idle' | 'approving' | 'creating' | 'done'>('idle')

  const { createBounty, fetchBounties, isCreating: isBountyCreating } = useBountyStore()
  const { bountyFactoryAddress, usdcAddress, usdcSymbol } = CURRENT_NETWORK

  // Approve USDC
  const { writeContract: writeApprove, data: approveHash } = useWriteContract()
  const { isSuccess: approveConfirmed } = useWaitForTransactionReceipt({ hash: approveHash })

  // Create Bounty
  const { writeContract: writeCreate, data: createHash } = useWriteContract()
  const { isSuccess: createConfirmed } = useWaitForTransactionReceipt({ hash: createHash })

  // Fetch bounties on mount
  useEffect(() => { fetchBounties() }, [fetchBounties])

  // Determine current step
  const currentStep: Step = !walletConnected ? 'wallet' 
    : (!smartAccountAddress || !isDeployed) ? 'smart-account'
    : 'bounty'

  // Chain: after approve confirmed, create bounty
  useEffect(() => {
    if (approveConfirmed && txStep === 'approving') {
      setTxStep('creating')
      const amountRaw = parseUnits(amount, 6)
      writeCreate({
        address: bountyFactoryAddress,
        abi: BOUNTY_FACTORY_ABI,
        functionName: 'createBounty',
        args: [githubUrl, amountRaw, BigInt(7 * 24 * 60 * 60)], // 7 days contest period
      })
    }
  }, [approveConfirmed, txStep])

  // Chain: after create confirmed, update store
  useEffect(() => {
    if (createConfirmed && txStep === 'creating' && address) {
      setTxStep('done')
      createBounty({ githubIssueUrl: githubUrl, amountMUSDC: Number(amount) }, address)
      setGithubUrl('')
      setAmount('')
      setTimeout(() => setTxStep('idle'), 2000)
    }
  }, [createConfirmed, txStep])

  const isValidGithubUrl = /^https?:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/issues\/\d+$/.test(githubUrl)
  const isValidAmount = Number(amount) > 0
  const isBusy = txStep !== 'idle' && txStep !== 'done'
  const canSubmit = walletConnected && isDeployed && isValidGithubUrl && isValidAmount && !isBusy

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !address) return

    setTxStep('approving')
    const amountRaw = parseUnits(amount, 6)

    writeApprove({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [bountyFactoryAddress, amountRaw],
    })
  }

  // Step indicator component
  const StepIndicator = ({ step, label, description, isActive, isComplete, icon: Icon }: {
    step: number
    label: string
    description: string
    isActive: boolean
    isComplete: boolean
    icon: any
  }) => (
    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
      isActive 
        ? 'border-[var(--brand-teal)]/40 bg-[var(--brand-glow-teal)]' 
        : isComplete
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : 'border-white/5 bg-white/3'
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isActive 
          ? 'bg-[var(--brand-teal)] text-black' 
          : isComplete
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-white/10 text-[var(--text-dim)]'
      }`}>
        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--brand-teal)]' : isComplete ? 'text-emerald-400' : 'text-[var(--text-dim)]'}`} />
          <span className={`text-sm font-medium ${isActive ? 'text-white' : isComplete ? 'text-emerald-300' : 'text-[var(--text-dim)]'}`}>
            {label}
          </span>
          {isComplete && (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ml-auto">
              Done
            </Badge>
          )}
          {isActive && (
            <Badge variant="outline" className="text-[10px] bg-[var(--brand-glow-teal)] text-[var(--brand-teal)] border-[var(--brand-teal)]/20 ml-auto">
              Current
            </Badge>
          )}
        </div>
        <p className="text-xs text-[var(--text-dim)] mt-0.5">{description}</p>
      </div>
    </div>
  )

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-8">
      {/* Left Column — Steps */}
      <div className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-4">
        {/* Step-by-step flow */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[var(--brand-teal)]" />
              Setup Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <StepIndicator
              step={1}
              label="Connect Wallet"
              description="Authenticate with your Web3Auth embedded wallet"
              isActive={currentStep === 'wallet'}
              isComplete={currentStep !== 'wallet'}
              icon={Wallet}
            />
            <StepIndicator
              step={2}
              label="Deploy Smart Account"
              description="Create and deploy a non-custodial smart account"
              isActive={currentStep === 'smart-account'}
              isComplete={currentStep === 'bounty' || currentStep === 'review'}
              icon={Shield}
            />
            <StepIndicator
              step={3}
              label="Create Bounty"
              description="Set GitHub issue URL and bounty amount in USDC"
              isActive={currentStep === 'bounty'}
              isComplete={currentStep === 'review'}
              icon={Plus}
            />
            <StepIndicator
              step={4}
              label="Monitor & Release"
              description="Track submissions and release funds via 1Shot relayer"
              isActive={currentStep === 'review'}
              isComplete={false}
              icon={Zap}
            />
          </CardContent>
        </Card>

        {/* Creator Mode Toggle */}
        <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--text-dim)] mb-3 font-medium uppercase tracking-wide">How do you create bounties?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSolverMode('human')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  solverMode === 'human'
                    ? 'border-[var(--brand-teal)]/40 bg-[var(--brand-glow-teal)] text-[var(--brand-teal)]'
                    : 'border-white/10 bg-white/3 text-[var(--text-dim)] hover:border-white/20 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                Manually
              </button>
              <button
                onClick={() => setSolverMode('agent')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  solverMode === 'agent'
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

        {/* Wallet status mini-card */}
        {currentStep === 'wallet' && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Wallet className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">Wallet Required</p>
                  <p className="text-xs text-[var(--text-dim)]">Connect to start creating bounties</p>
                </div>
              </div>
              <Button
                onClick={() => login()}
                className="w-full bg-[var(--brand-teal)] text-black hover:bg-[var(--brand-blue)] font-medium"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Smart account deploy mini-card */}
        {currentStep === 'smart-account' && (
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Rocket className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-white">Deploy Smart Account</p>
                  <p className="text-xs text-[var(--text-dim)]">Required for creating on-chain bounties</p>
                </div>
              </div>
              {isCreating ? (
                <Button disabled className="w-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {smartAccountAddress ? 'Deploying...' : 'Creating Account...'}
                </Button>
              ) : smartAccountAddress && !isDeployed && bundlerConfigured ? (
                <Button
                  onClick={deploySmartAccount}
                  className="w-full bg-amber-500 text-black hover:bg-amber-400 font-medium"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  Deploy Smart Account
                </Button>
              ) : smartAccountAddress && !isDeployed && !bundlerConfigured ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-300 flex items-center gap-2">
                    <Rocket className="w-3.5 h-3.5" />
                    Smart account is ready. It will deploy automatically on your first on-chain transaction.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--text-dim)]">Smart account is being created automatically...</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-6">
        {solverMode === 'agent' ? (
          <AgentModeContent />
        ) : (
          <>
            {/* Create Bounty Form — only shown when ready */}
            {currentStep === 'bounty' && (
              <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Plus className="w-5 h-5 text-[var(--brand-teal)]" />
                    Create Bounty
                  </CardTitle>
                  <CardDescription className="text-[var(--text-dim)]">
                    Fund a GitHub issue with USDC — developers submit PRs to earn the reward
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Wallet (read-only) */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[var(--text-dim)]">Wallet</label>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--brand-teal)]/30 bg-[var(--brand-glow-teal)]">
                        <Wallet className="w-4 h-4 text-[var(--brand-teal)]" />
                        <span className="text-sm font-mono text-[var(--brand-teal)]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                        <span className="ml-auto text-xs text-[var(--brand-teal)]">Connected</span>
                      </div>
                    </div>

                    {/* GitHub Issue URL */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[var(--text-dim)]">GitHub Issue URL</label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dimmer)]" />
                        <Input
                          type="url"
                          placeholder="https://github.com/owner/repo/issues/123"
                          value={githubUrl}
                          onChange={(e) => setGithubUrl(e.target.value)}
                          className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-[var(--text-dimmer)] focus:border-[var(--brand-teal)]/50"
                        />
                      </div>
                      {githubUrl && !isValidGithubUrl && (
                        <p className="text-xs text-red-400">Please enter a valid GitHub issue URL</p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[var(--text-dim)] flex items-center gap-1.5">
                        Bounty Amount
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/usdc%20logo%20png-rwf9zJQIKtnrnZZHD07mo808CJuwkJ.webp"
                          alt="USDC"
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{usdcSymbol}</span>
                      </label>
                      <div className="relative">
                        <img
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/usdc%20logo%20png-rwf9zJQIKtnrnZZHD07mo808CJuwkJ.webp"
                          alt="USDC"
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                        />
                        <Input
                          type="number"
                          placeholder="100"
                          min="1"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-[var(--text-dim)] focus:border-[var(--brand-teal)]/50"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={!canSubmit}
                      className="w-full bg-[var(--brand-teal)] text-black font-semibold hover:bg-[var(--brand-blue)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {txStep === 'approving' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving mUSDC...
                        </>
                      ) : txStep === 'creating' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Bounty...
                        </>
                      ) : txStep === 'done' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Bounty Created!
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Bounty
                        </>
                      )}
                    </Button>

                    {/* Info: 2-step process */}
                    <div className="text-xs text-[var(--text-dimmer)] text-center bg-white/5 rounded-lg p-3">
                      <p className="mb-1 font-medium text-[var(--text-dim)]">How it works:</p>
                      <ol className="space-y-1 text-left">
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--brand-teal)]">1.</span>
                          <span>Approve USDC spending (one-time signature)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--brand-teal)]">2.</span>
                          <span>Bounty contract is created on-chain</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--brand-teal)]">3.</span>
                          <span>Funds are secured in escrow until release</span>
                        </li>
                      </ol>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Venice AI PR Review Section (shown after bounties are created) */}
            <Card className="border-white/10 bg-black/40 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <Sparkles className="w-5 h-5 text-[var(--brand-teal)]" />
                  Venice AI PR Reviews
                </CardTitle>
                <CardDescription className="text-[var(--text-dim)]">
                  AI-powered code review and spam detection for submitted PRs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-[var(--brand-teal)] font-medium mb-1">
                      <Search className="w-3.5 h-3.5" />
                      Code Review
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">Analyzes PR code quality, logic bugs, and best practices</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-[var(--brand-teal)] font-medium mb-1">
                      <FileText className="w-3.5 h-3.5" />
                      Spam Detection
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">Detects AI-generated slop, spam, and low-effort submissions</p>
                  </div>
                  <div className="p-3 rounded-lg border border-white/10 bg-white/5 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-[var(--brand-teal)] font-medium mb-1">
                      <Shield className="w-3.5 h-3.5" />
                      Sybil Protection
                    </div>
                    <p className="text-[10px] text-[var(--text-dim)]">Prevents fake identities and coordinated attacks</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 text-xs text-blue-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>PRs are automatically reviewed by Venice AI when submitted. Results appear on each bounty card.</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Bounties list */}
        <BountyList />
      </div>
    </div>
  )
}
