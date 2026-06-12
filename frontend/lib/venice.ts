const VENICE_API_KEY = process.env.VENICE_API_KEY || ''
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1'

export interface VeniceReviewRequest {
  prDiff: string
  issueTitle: string
  issueBody: string
  prTitle: string
  prDescription: string
}

export interface VeniceReviewResult {
  score: number
  issues: string[]
  summary: string
  spam: boolean
  aiSlop: boolean
  securityIssues: string[]
  codeQuality: string
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

// PR Code Review
export async function reviewPRDiff(request: VeniceReviewRequest): Promise<VeniceReviewResult> {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'venice-code-large',
        messages: [
          {
            role: 'system',
            content: `You are a senior code reviewer for open source bounties. Be terse, accurate, and skeptical.
Review the PR diff for:
1. Correctness vs the linked issue
2. Code quality (naming, structure, tests)
3. Security issues (XSS, reentrancy, OWASP top 10)
4. Spam indicators (AI-generated slop, copy-paste, off-topic)

Return JSON with this exact structure:
{
  "score": 0-100,
  "issues": ["issue1", "issue2"],
  "summary": "Brief summary",
  "spam": false,
  "aiSlop": false,
  "securityIssues": ["security1"],
  "codeQuality": "good|fair|poor"
}`,
          },
          {
            role: 'user',
            content: `Review this PR for bounty eligibility.

Issue: ${request.issueTitle}
${request.issueBody}

PR: ${request.prTitle}
${request.prDescription}

Diff:
${request.prDiff}`,
          },
        ],
        response_format: { type: 'json_object' },
        venice_parameters: {
          strip_thinking_response: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Venice AI review failed:', error)
    return {
      score: 0,
      issues: ['AI review failed'],
      summary: 'Unable to complete AI review',
      spam: false,
      aiSlop: false,
      securityIssues: [],
      codeQuality: 'fair',
    }
  }
}

// Spam Detection
export async function detectSpam(
  prTitle: string,
  prDescription: string,
  contributorHistory?: string
): Promise<SpamDetectionResult> {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'venice-large',
        messages: [
          {
            role: 'system',
            content: `You are a spam detector for GitHub PRs. Analyze the PR for spam indicators.

Spam indicators:
- Generic/template PR descriptions
- Off-topic changes
- Copy-pasted code
- AI-generated slop (repetitive patterns)
- Low effort changes
- Unrelated file modifications

Return JSON with this exact structure:
{
  "isSpam": true/false,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"]
}`,
          },
          {
            role: 'user',
            content: `Analyze this PR for spam:

Title: ${prTitle}
Description: ${prDescription}
${contributorHistory ? `Contributor History: ${contributorHistory}` : ''}`,
          },
        ],
        response_format: { type: 'json_object' },
        venice_parameters: {
          strip_thinking_response: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Spam detection failed:', error)
    return {
      isSpam: false,
      confidence: 0,
      reasons: ['Detection failed'],
    }
  }
}

// Sybil Detection
export async function detectSybil(
  contributorAddress: string,
  githubUsername: string,
  prCount: number,
  accountAge: number
): Promise<SybilDetectionResult> {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'venice-large',
        messages: [
          {
            role: 'system',
            content: `You are a Sybil attack detector for bounty platforms. Analyze contributor patterns for suspicious activity.

Sybil indicators:
- Multiple accounts from same source
- Burst activity (many PRs in short time)
- Low-quality contributions
- Account age vs activity mismatch
- Similar PR patterns across issues

Return JSON with this exact structure:
{
  "isSybil": true/false,
  "confidence": 0-100,
  "indicators": ["indicator1", "indicator2"]
}`,
          },
          {
            role: 'user',
            content: `Analyze this contributor for Sybil activity:

Address: ${contributorAddress}
GitHub: ${githubUsername}
PR Count: ${prCount}
Account Age (days): ${accountAge}`,
          },
        ],
        response_format: { type: 'json_object' },
        venice_parameters: {
          strip_thinking_response: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    return JSON.parse(content)
  } catch (error) {
    console.error('Sybil detection failed:', error)
    return {
      isSybil: false,
      confidence: 0,
      indicators: ['Detection failed'],
    }
  }
}

// Maintainer Summary
export async function generateMaintainerSummary(
  bounties: Array<{
    id: number
    title: string
    status: string
    amount: number
    prCount: number
  }>
): Promise<string> {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'venice-large',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates concise weekly digests for open source maintainers.',
          },
          {
            role: 'user',
            content: `Generate a weekly digest for these bounties:

${bounties.map(b => `- Bounty #${b.id}: ${b.title} (${b.status}, ${b.amount} USDC, ${b.prCount} PRs)`).join('\n')}

Keep it brief and actionable. Focus on what needs attention.`,
          },
        ],
        venice_parameters: {
          strip_thinking_response: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate summary'
  } catch (error) {
    console.error('Summary generation failed:', error)
    return 'Unable to generate summary at this time'
  }
}

// Dispute Explanation
export async function explainDispute(
  bountyTitle: string,
  prTitle: string,
  aiScore: number,
  reviewerNotes: string
): Promise<string> {
  try {
    const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VENICE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'venice-large',
        messages: [
          {
            role: 'system',
            content: 'You are a neutral dispute resolver for open source bounties. Explain the AI decision in plain language to both parties.',
          },
          {
            role: 'user',
            content: `Explain this bounty dispute resolution:

Bounty: ${bountyTitle}
PR: ${prTitle}
AI Score: ${aiScore}/100
Reviewer Notes: ${reviewerNotes}

Explain in plain language what the AI saw, why it scored the PR the way it did, and what the likely correct outcome is.`,
          },
        ],
        venice_parameters: {
          strip_thinking_response: true,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Venice API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate explanation'
  } catch (error) {
    console.error('Dispute explanation failed:', error)
    return 'Unable to generate explanation at this time'
  }
}
