import { create } from 'zustand'
import type { Bounty, CreateBountyInput, SubmitPRInput, Agent, ActivityFeedItem } from './types'
import { CURRENT_NETWORK } from './contracts'

// Mock agents (kept for UI)
const mockAgents: Agent[] = [
  {
    id: 'agent-1',
    name: 'AutoDev-01',
    status: 'active',
    specialty: 'Frontend / React',
    solvedBounties: 12,
    earningsMUSDC: 240,
    lastActivityTime: new Date(Date.now() - 2 * 60000),
  },
  {
    id: 'agent-2',
    name: 'BugHunter-X',
    status: 'evaluating',
    specialty: 'Backend / APIs',
    solvedBounties: 7,
    earningsMUSDC: 130,
    currentTask: 'Evaluating PR #182',
    lastActivityTime: new Date(Date.now() - 30000),
  },
]

const mockActivityFeed: ActivityFeedItem[] = []

function extractIssueTitle(url: string): string {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/)
  if (match) return `${match[1]}/${match[2]} #${match[3]}`
  return 'GitHub Issue'
}

interface BountyStore {
  bounties: Bounty[]
  agents: Agent[]
  activityFeed: ActivityFeedItem[]
  isCreating: boolean
  isSubmitting: boolean
  isEvaluating: string | null
  pollingInterval: ReturnType<typeof setInterval> | null

  fetchBounties: () => Promise<void>
  createBounty: (input: CreateBountyInput, creatorWallet: string) => Promise<void>
  submitPR: (input: SubmitPRInput) => Promise<void>
  evaluateBounty: (bountyId: string) => Promise<void>
  startPolling: () => void
  stopPolling: () => void
  getAgents: () => Agent[]
  getActivityFeed: () => ActivityFeedItem[]
}

export const useBountyStore = create<BountyStore>((set, get) => ({
  bounties: [],
  agents: mockAgents,
  activityFeed: mockActivityFeed,
  isCreating: false,
  isSubmitting: false,
  isEvaluating: null,
  pollingInterval: null,

  startPolling: () => {
    const interval = setInterval(() => {
      const { bounties } = get()
      const hasPending = bounties.some(b => b.status === 'submitted' || b.status === 'evaluating')
      if (hasPending) {
        get().fetchBounties()
      }
    }, 15000)
    set({ pollingInterval: interval })
  },

  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
      set({ pollingInterval: null })
    }
  },

  fetchBounties: async () => {
    try {
      const api = CURRENT_NETWORK.relayerApi
      const res = await fetch(`${api}/bounties`)
      const data = await res.json()
      const fetched: Bounty[] = data.map((b: any) => ({
        id: String(b.id),
        githubIssueUrl: b.issueURL,
        issueTitle: extractIssueTitle(b.issueURL),
        amountMUSDC: Number(b.amount) / 1e6,
        status: b.status.toLowerCase() as Bounty['status'],
        creatorWallet: b.creator,
        createdAt: new Date(),
        prUrl: b.prURL || undefined,
        solverWallet: b.solver !== '0x0000000000000000000000000000000000000000' ? b.solver : undefined,
        contestPeriodEnd: b.contestPeriodEnd ? new Date(b.contestPeriodEnd * 1000) : undefined,
        aiScore: b.aiScore,
        prMerged: b.prMerged,
      }))
      // Preserve pending bounties not yet confirmed on-chain
      set((state) => {
        const pending = state.bounties.filter(b =>
          b.id.startsWith('pending-') &&
          !fetched.some(f => f.githubIssueUrl === b.githubIssueUrl)
        )
        return { bounties: [...fetched, ...pending] }
      })
      // Start polling if there are submitted/evaluating bounties
      const allBounties = get().bounties
      const hasPending = allBounties.some(b => b.status === 'submitted' || b.status === 'evaluating')
      if (hasPending && !get().pollingInterval) get().startPolling()
      if (!hasPending) get().stopPolling()
    } catch (err) {
      console.error('Failed to fetch bounties:', err)
    }
  },

  createBounty: async (input, creatorWallet) => {
    set({ isCreating: true })

    const newBounty: Bounty = {
      id: `pending-${Date.now()}`,
      githubIssueUrl: input.githubIssueUrl,
      issueTitle: extractIssueTitle(input.githubIssueUrl),
      amountMUSDC: input.amountMUSDC,
      status: 'open',
      creatorWallet,
      createdAt: new Date(),
      contestPeriodEnd: new Date(Date.now() + (input.contestPeriodDays || 7) * 24 * 60 * 60 * 1000),
    }

    set((state) => ({
      bounties: [newBounty, ...state.bounties],
      isCreating: false,
    }))

    // Refresh from chain after a delay
    setTimeout(() => get().fetchBounties(), 8000)
  },

  submitPR: async (input) => {
    set({ isSubmitting: true })

    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === input.bountyId
          ? { ...b, status: 'submitted' as const, prUrl: input.prUrl, solverWallet: input.solverWallet, submittedAt: new Date() }
          : b
      ),
      isSubmitting: false,
    }))

    setTimeout(() => {
      get().evaluateBounty(input.bountyId)
    }, 500)
  },

  evaluateBounty: async (bountyId) => {
    set({ isEvaluating: bountyId })

    set((state) => ({
      bounties: state.bounties.map((b) =>
        b.id === bountyId ? { ...b, status: 'evaluating' as const } : b
      ),
    }))

    try {
      const bounty = get().bounties.find((b) => b.id === bountyId)
      if (!bounty?.prUrl || !bounty?.solverWallet) throw new Error('Missing PR or solver')

      const api = CURRENT_NETWORK.relayerApi

      const res = await fetch(`${api}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId: Number(bountyId),
          prURL: bounty.prUrl,
          solverAddress: bounty.solverWallet,
        }),
      })

      const result = await res.json()

      set((state) => ({
        bounties: state.bounties.map((b) =>
          b.id === bountyId
            ? {
                ...b,
                status: result.approved ? 'approved' : 'rejected',
                verdict: result.approved ? 'approved' : 'rejected',
                veniceReasoning: result.reasoning || 'Evaluated by Venice AI verification',
                veniceTxHash: result.txHash,
                evaluatedAt: new Date(),
                aiScore: result.aiScore,
              }
            : b
        ),
        isEvaluating: null,
      }))
    } catch (err) {
      console.error('Evaluation failed:', err)
      set({ isEvaluating: null })
      get().fetchBounties()
    }
  },

  getAgents: () => get().agents,
  getActivityFeed: () => get().activityFeed,
}))
