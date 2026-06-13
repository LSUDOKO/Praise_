/**
 * GitHub API Client for PRaise
 * Handles webhook verification, PR fetching, and bot comments
 */

import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

export class GitHubClient {
  constructor(token = GITHUB_TOKEN) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }

  /**
   * Verify GitHub webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!GITHUB_WEBHOOK_SECRET) {
      console.warn('GitHub webhook secret not configured');
      return true; // Allow in dev
    }

    const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  /**
   * Fetch PR details
   */
  async getPullRequest(owner, repo, prNumber) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch PR diff
   */
  async getPullRequestDiff(owner, repo, prNumber) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3.diff',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * Fetch issue details
   */
  async getIssue(owner, repo, issueNumber) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Post comment on issue
   */
  async postIssueComment(owner, repo, issueNumber, body) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Post comment on PR
   */
  async postPullRequestComment(owner, repo, prNumber, body) {
    return this.postIssueComment(owner, repo, prNumber, body);
  }

  /**
   * Get PR commit history
   */
  async getPullRequestCommits(owner, repo, prNumber) {
    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}/commits`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get user details
   */
  async getUser(username) {
    const response = await fetch(
      `${this.baseUrl}/users/${username}`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check if PR has required CI checks passing
   */
  async checkPRStatus(owner, repo, prNumber) {
    const pr = await this.getPullRequest(owner, repo, prNumber);
    const ref = pr.head.sha;

    const response = await fetch(
      `${this.baseUrl}/repos/${owner}/${repo}/commits/${ref}/check-runs`,
      {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    const checks = data.check_runs || [];

    // All checks must pass
    const allPassing = checks.every(check => 
      check.status === 'completed' && check.conclusion === 'success'
    );

    return {
      allPassing,
      checks: checks.map(check => ({
        name: check.name,
        status: check.status,
        conclusion: check.conclusion,
      })),
    };
  }

  /**
   * Format bounty comment for issue
   */
  formatBountyComment(bountyId, amount, currency = 'USDC') {
    return `🏆 **Bounty #${bountyId} — ${amount} ${currency}**

Submit a PR that closes this issue to claim this bounty. Payment is automatic on merge.

**Auto-release conditions:**
- PR merged by maintainer
- All CI checks passing
- AI verification score ≥ 80%
- Contest period elapsed

💡 *Powered by [PRaise](https://praise.xyz) — AI-verified, gasless bounties*`;
  }

  /**
   * Format PR tracking comment
   */
  formatPRTrackingComment(bountyId, aiScore) {
    return `🎯 **Linked to bounty #${bountyId}**

**Status:** In review
**AI confidence:** ${aiScore}%

The bounty will be automatically released when this PR is merged and all conditions are met.

💡 *Powered by [PRaise](https://praise.xyz)*`;
  }

  /**
   * Format release notification comment
   */
  formatReleaseComment(bountyId, amount, txHash, recipient) {
    return `✅ **Bounty #${bountyId} released!**

**Amount:** ${amount} USDC
**Recipient:** \`${recipient}\`
**Transaction:** [View on Arbiscan](https://sepolia.arbiscan.io/tx/${txHash})

Thank you for your contribution! 🎉

💡 *Powered by [PRaise](https://praise.xyz) — AI-verified, gasless bounties*`;
  }
}

export const githubClient = new GitHubClient();
