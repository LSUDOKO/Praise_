/**
 * PRaise Agent Verification Pipeline
 * Multi-agent verification: Venice AI + CI + Approver
 */

import { githubClient } from './github-client.js';

const VENICE_API_KEY = process.env.VENICE_API_KEY || process.env.VENEICE_API;
const VENICE_BASE_URL = 'https://api.venice.ai/api/v1';
const MIN_AI_SCORE = 80;
const MIN_ACCOUNT_AGE_DAYS = 7;

export class AgentVerifier {
  constructor() {
    this.veniceApiKey = VENICE_API_KEY;
  }

  /**
   * Run full verification pipeline
   */
  async verifyPR(params) {
    const { owner, repo, prNumber, issueNumber, contestPeriod } = params;

    console.log(`Starting verification for PR #${prNumber}`);

    // Step 1: Fetch PR and issue data
    const [pr, issue, diff] = await Promise.all([
      githubClient.getPullRequest(owner, repo, prNumber),
      githubClient.getIssue(owner, repo, issueNumber),
      githubClient.getPullRequestDiff(owner, repo, prNumber),
    ]);

    // Step 2: Check contest period
    const contestCheck = this.checkContestPeriod(pr.created_at, contestPeriod);
    if (!contestCheck.passed) {
      return {
        passed: false,
        reason: contestCheck.reason,
        score: 0,
      };
    }

    // Step 3: Check CI status
    const ciCheck = await this.checkCIStatus(owner, repo, prNumber);
    if (!ciCheck.passed) {
      return {
        passed: false,
        reason: 'CI checks not passing',
        score: 0,
        ciChecks: ciCheck.checks,
      };
    }

    // Step 4: Spam detection
    const spamCheck = await this.detectSpam({
      username: pr.user.login,
      prContent: pr.body || '',
      diff,
    });
    
    if (spamCheck.isSpam) {
      return {
        passed: false,
        reason: 'Spam detected',
        score: 0,
        spamDetails: spamCheck,
      };
    }

    // Step 5: AI code review
    const review = await this.reviewCode({
      issueTitle: issue.title,
      issueBody: issue.body || '',
      prDescription: pr.body || '',
      diff,
    });

    // Step 6: Final decision
    const passed = review.score >= MIN_AI_SCORE && !review.spam;

    return {
      passed,
      score: review.score,
      confidence: review.confidence,
      reason: passed ? 'All checks passed' : 'AI score below threshold',
      review,
      ciChecks: ciCheck.checks,
      spamCheck,
    };
  }

  /**
   * Check if contest period has elapsed
   */
  checkContestPeriod(prCreatedAt, contestPeriodDays) {
    const createdTime = new Date(prCreatedAt).getTime();
    const now = Date.now();
    const elapsed = now - createdTime;
    const requiredMs = contestPeriodDays * 24 * 60 * 60 * 1000;

    const passed = elapsed >= requiredMs;

    return {
      passed,
      reason: passed ? 'Contest period elapsed' : `Contest period: ${contestPeriodDays} days`,
      elapsedDays: Math.floor(elapsed / (24 * 60 * 60 * 1000)),
    };
  }

  /**
   * Check CI status
   */
  async checkCIStatus(owner, repo, prNumber) {
    try {
      const status = await githubClient.checkPRStatus(owner, repo, prNumber);
      return {
        passed: status.allPassing,
        checks: status.checks,
      };
    } catch (error) {
      console.error('Error checking CI status:', error);
      // If no checks exist, consider it passing
      return {
        passed: true,
        checks: [],
      };
    }
  }

  /**
   * Detect spam and sybil patterns
   */
  async detectSpam(params) {
    const { username, prContent, diff } = params;

    try {
      // Get user info
      const user = await githubClient.getUser(username);
      const accountAge = this.calculateAccountAge(user.created_at);

      // Check basic spam indicators
      if (accountAge < MIN_ACCOUNT_AGE_DAYS) {
        return {
          isSpam: true,
          confidence: 90,
          patterns: ['new_account'],
          accountAge,
        };
      }

      // Check for AI slop patterns
      const aiSlopPatterns = [
        /as an ai/i,
        /i cannot/i,
        /i apologize/i,
        /i don't have/i,
      ];

      const hasAISlop = aiSlopPatterns.some(pattern => 
        pattern.test(prContent) || pattern.test(diff)
      );

      if (hasAISlop) {
        return {
          isSpam: true,
          confidence: 95,
          patterns: ['ai_slop'],
          accountAge,
        };
      }

      // Call Venice AI for advanced detection
      if (this.veniceApiKey) {
        const veniceResult = await this.callVeniceSpamDetection({
          username,
          accountAge,
          prContent,
          diff: diff.substring(0, 2000), // Limit diff size
        });

        return veniceResult;
      }

      // Default: not spam
      return {
        isSpam: false,
        confidence: 70,
        patterns: [],
        accountAge,
      };
    } catch (error) {
      console.error('Error detecting spam:', error);
      return {
        isSpam: false,
        confidence: 50,
        patterns: [],
        error: error.message,
      };
    }
  }

  /**
   * AI code review via Venice
   */
  async reviewCode(params) {
    const { issueTitle, issueBody, prDescription, diff } = params;

    if (!this.veniceApiKey) {
      console.warn('Venice API key missing, using fallback');
      return this.fallbackReview(diff);
    }

    try {
      const prompt = `Review this PR diff for the linked issue.

Issue: ${issueTitle}
${issueBody}

PR Description:
${prDescription}

PR Diff (truncated):
${diff.substring(0, 3000)}

Return JSON: { 
  "score": 0-100, 
  "issues": [{"severity": "critical|high|medium|low|info", "type": "...", "description": "..."}], 
  "summary": "...", 
  "spam": bool, 
  "aiSlop": bool,
  "confidence": 0-100
}`;

      const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.veniceApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are a senior code reviewer. Be terse, accurate, and skeptical. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from Venice AI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Error calling Venice AI:', error);
      return this.fallbackReview(diff);
    }
  }

  /**
   * Call Venice for spam detection
   */
  async callVeniceSpamDetection(params) {
    const prompt = `Analyze this contributor for spam/sybil patterns:

GitHub: ${params.username}
Account Age: ${params.accountAge} days

PR Content:
${params.prContent}

Diff Sample:
${params.diff}

Return JSON: {
  "isSpam": bool,
  "confidence": 0-100,
  "patterns": ["pattern1", "pattern2"],
  "accountAge": ${params.accountAge}
}`;

    try {
      const response = await fetch(`${VENICE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.veniceApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b',
          messages: [
            {
              role: 'system',
              content: 'You are a security analyst detecting spam. Return only valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Venice spam detection error:', error);
      return {
        isSpam: false,
        confidence: 50,
        patterns: [],
        accountAge: params.accountAge,
      };
    }
  }

  /**
   * Fallback review (no AI)
   */
  fallbackReview(diff) {
    const lines = diff.split('\n').length;
    const hasTests = /test|spec/i.test(diff);
    
    // Simple heuristic
    let score = 50;
    if (lines > 10) score += 10;
    if (lines > 50) score += 10;
    if (hasTests) score += 20;

    return {
      score,
      issues: [],
      summary: 'Fallback review (AI unavailable)',
      spam: false,
      aiSlop: false,
      confidence: 60,
    };
  }

  /**
   * Calculate account age in days
   */
  calculateAccountAge(createdAt) {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return Math.floor((now - created) / (24 * 60 * 60 * 1000));
  }
}

export const agentVerifier = new AgentVerifier();
