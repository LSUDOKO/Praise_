export type BountyStatus = 'open' | 'submitted' | 'evaluating' | 'approved' | 'rejected'
export type AgentStatus = 'active' | 'evaluating' | 'idle'
export type SolverType = 'human' | 'agent'

export interface Bounty {
  id: string
  githubIssueUrl: string
  issueTitle: string
  amountMUSDC: number
  status: BountyStatus
  creatorWallet: string
  createdAt: Date
  prUrl?: string
  solverWallet?: string
  solverName?: string
  solverType?: SolverType
  submittedAt?: Date
  verdict?: 'approved' | 'rejected'
  veniceReasoning?: string
  veniceTxHash?: string
  evaluatedAt?: Date
  // Smart Account fields
  smartAccountAddress?: string
  contestPeriodEnd?: Date
  aiScore?: number
  prMerged?: boolean
}

export interface CreateBountyInput {
  githubIssueUrl: string
  amountMUSDC: number
  contestPeriodDays?: number
}

export interface SubmitPRInput {
  bountyId: string
  prUrl: string
  solverWallet: string
  solverType?: SolverType
  solverName?: string
}

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  specialty: string
  solvedBounties: number
  earningsMUSDC: number
  lastActivityTime: Date
  currentTask?: string
}

export interface ActivityFeedItem {
  id: string
  type: 'submission' | 'evaluation' | 'completion' | 'payment'
  agentName: string
  message: string
  timestamp: Date
}

// Smart Account Types
export interface SmartAccountInfo {
  address: string
  isDeployed: boolean
  owner: string
}

export interface PermissionGrant {
  bounty: string
  beneficiary: string
  maxAmount: string
  duration: string
  minAIScore: string
  isActive: boolean
}

export interface BountyContract {
  id: number
  address: string
  creator: string
  issueURL: string
  prURL: string
  amount: number
  solver: string
  paused: boolean
  contestPeriodEnd: number
  createdAt: number
  aiScore: number
  prMerged: boolean
}

// Venice AI Types
export interface VeniceReviewResult {
  score: number
  issues: string[]
  summary: string
  spam: boolean
  aiSlop: boolean
  securityIssues: string[]
  codeQuality: 'good' | 'fair' | 'poor'
}

export interface SpamDetectionResult {
  isSpam: boolean
  confidence: number
  reasons: string[]
}

export interface SybilDetectionResult {
  isSybil: boolean
  confidence: number
  indicators: string[]
}

