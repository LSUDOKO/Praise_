/**
 * Venice AI Client for PRaise
 * Handles code review, spam detection, and PR verification
 */

const VENICE_API_KEY = process.env.VENICE_API_KEY || process.env.VENEICE_API;
const VENICE_BASE_URL = "https://api.venice.ai/api/v1";

export interface CodeReviewResult {
  score: number; // 0-100
  issues: Array<{
    severity: "critical" | "high" | "medium" | "low" | "info";
    type: string;
    description: string;
    line?: number;
  }>;
  summary: string;
  spam: boolean;
  aiSlop: boolean;
  confidence: number;
}

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  patterns: string[];
  burstAccount: boolean;
  duplicateCode: boolean;
  accountAge: number;
}

export class VeniceClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || VENICE_API_KEY || "";
    this.baseUrl = VENICE_BASE_URL;

    if (!this.apiKey) {
      throw new Error("Venice API key is required");
    }
  }

  /**
   * Review a PR diff against the linked issue
   */
  async reviewPR(params: {
    issueTitle: string;
    issueBody: string;
    prDiff: string;
    prDescription: string;
  }): Promise<CodeReviewResult> {
    const prompt = `Review this PR diff for the linked issue.

Issue: ${params.issueTitle}
${params.issueBody}

PR Description:
${params.prDescription}

PR Diff:
${params.prDiff}

Return JSON: { 
  "score": 0-100, 
  "issues": [{"severity": "critical|high|medium|low|info", "type": "...", "description": "...", "line": 0}], 
  "summary": "...", 
  "spam": bool, 
  "aiSlop": bool,
  "confidence": 0-100
}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "You are a senior code reviewer. Be terse, accurate, and skeptical. Return only valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No response from Venice AI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error calling Venice AI:", error);
      throw error;
    }
  }

  /**
   * Detect spam and sybil patterns
   */
  async detectSpam(params: {
    githubUsername: string;
    accountCreated: string;
    commitHistory: string[];
    prContent: string;
  }): Promise<SpamDetectionResult> {
    const prompt = `Analyze this contributor for spam/sybil patterns:

GitHub: ${params.githubUsername}
Account Created: ${params.accountCreated}
Recent Commits: ${params.commitHistory.join(", ")}

PR Content:
${params.prContent}

Check for:
- Burst account patterns (new account, sudden activity)
- AI-generated code slop
- Copy-paste from other PRs
- Low-quality contributions

Return JSON: {
  "isSpam": bool,
  "confidence": 0-100,
  "patterns": ["pattern1", "pattern2"],
  "burstAccount": bool,
  "duplicateCode": bool,
  "accountAge": days
}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "You are a security analyst detecting spam and sybil patterns. Return only valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error("No response from Venice AI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Error calling Venice AI:", error);
      throw error;
    }
  }

  /**
   * Generate a summary for maintainers
   */
  async generateSummary(params: {
    bountyActivity: any[];
    period: string;
  }): Promise<string> {
    const prompt = `Generate a weekly summary for this bounty activity:

Period: ${params.period}
Activity: ${JSON.stringify(params.bountyActivity, null, 2)}

Summarize:
- Number of PRs submitted
- Quality assessment
- Estimated release queue value
- Action items for maintainer`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes bounty activity.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Venice API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error("Error calling Venice AI:", error);
      throw error;
    }
  }
}

export const veniceClient = new VeniceClient();
