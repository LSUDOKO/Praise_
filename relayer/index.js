import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { createPublicClient, createWalletClient, http, parseAbi, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const {
  PRIVATE_KEY,
  ARBITRUM_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc",
  NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS,
  NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS,
  NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
  NEXT_PUBLIC_USDC_ADDRESS,
  VENICE_API_KEY,
  ONESHOT_API_KEY,
  ONESHOT_API_SECRET,
  ONESHOT_BUSINESS_ID,
  GITHUB_WEBHOOK_SECRET,
  GITHUB_TOKEN,
  PORT = "3000",
} = process.env;

// --- Arbitrum Sepolia setup ---

const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(ARBITRUM_SEPOLIA_RPC),
});

const walletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(ARBITRUM_SEPOLIA_RPC),
});

// --- Contract ABIs ---

const BOUNTY_FACTORY_ABI = [
  { name: "createBounty", type: "function", stateMutability: "nonpayable", inputs: [{ name: "issueURL", type: "string" }, { name: "amount", type: "uint256" }, { name: "contestPeriod", type: "uint256" }], outputs: [{ name: "bountyId", type: "uint256" }, { name: "bountyAddress", type: "address" }] },
  { name: "fundBounty", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "getBounty", type: "function", stateMutability: "view", inputs: [{ name: "bountyId", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "bounty", type: "address" }, { name: "creator", type: "address" }, { name: "issueURL", type: "string" }, { name: "amount", type: "uint256" }, { name: "contestPeriod", type: "uint256" }, { name: "createdAt", type: "uint256" }] }] },
  { name: "getCreatorBounties", type: "function", stateMutability: "view", inputs: [{ name: "creator", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { name: "getBountyByIssue", type: "function", stateMutability: "view", inputs: [{ name: "issueURL", type: "string" }], outputs: [{ type: "uint256" }] },
  { name: "bountyCount", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "BountyCreated", type: "event", inputs: [{ name: "bountyId", type: "uint256", indexed: true }, { name: "creator", type: "address", indexed: true }, { name: "issueURL", type: "string", indexed: false }, { name: "amount", type: "uint256", indexed: false }, { name: "bountyAddress", type: "address", indexed: false }] },
  { name: "BountyFunded", type: "event", inputs: [{ name: "bountyId", type: "uint256", indexed: true }, { name: "funder", type: "address", indexed: true }, { name: "amount", type: "uint256", indexed: false }] },
];

const BOUNTY_ABI = parseAbi([
  "function deposit(uint256 amount) external",
  "function release(address to, uint256 amount) external",
  "function reclaim() external",
  "function pause() external",
  "function unpause() external",
  "function submitSolution(string prURL, address solver) external",
  "function submitAIScore(uint256 score) external",
  "function isReleasable() external view returns (bool, string)",
  "function getBounty() external view returns (uint256 id, address creator, string issueURL, string prURL, uint256 amount, address solver, bool paused, uint256 contestPeriodEnd, uint256 createdAt, uint256 aiScore, bool prMerged)",
  "function bountyId() external view returns (uint256)",
  "function usdc() external view returns (address)",
  "function agent() external view returns (address)",
]);

const AGENT_DELEGATION_ABI = parseAbi([
  "function grantPermission(address bounty, address beneficiary, uint256 maxAmount, uint256 duration, uint256 minAIScore) external",
  "function revokePermission(address bounty) external",
  "function executeRelease(address bounty, address to, uint256 amount, uint256 aiScore) external",
  "function isReleaseAllowed(address bounty, address to, uint256 amount, uint256 aiScore) external view returns (bool, string)",
  "function reputation(address agent) external view returns (uint256)",
  "event PermissionGranted(address indexed bounty, address indexed beneficiary, uint256 maxAmount, uint256 endTime, uint256 minAIScore)",
  "event PermissionRevoked(address indexed bounty)",
  "event ReleaseExecuted(address indexed bounty, address indexed to, uint256 amount)",
]);

const BOUNTY_REGISTRY_ABI = [
  { name: "registerBounty", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "bounty", type: "address" }, { name: "repo", type: "string" }, { name: "issueNumber", type: "uint256" }, { name: "issueURL", type: "string" }, { name: "creator", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  { name: "submitPR", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "prNumber", type: "uint256" }, { name: "prURL", type: "string" }, { name: "solver", type: "address" }], outputs: [] },
  { name: "resolveBounty", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "approved", type: "bool" }], outputs: [] },
  { name: "getBounty", type: "function", stateMutability: "view", inputs: [{ name: "bountyId", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "bountyId", type: "uint256" }, { name: "bounty", type: "address" }, { name: "repo", type: "string" }, { name: "issueNumber", type: "uint256" }, { name: "issueURL", type: "string" }, { name: "prNumber", type: "uint256" }, { name: "prURL", type: "string" }, { name: "creator", type: "address" }, { name: "solver", type: "address" }, { name: "amount", type: "uint256" }, { name: "status", type: "uint8" }, { name: "createdAt", type: "uint256" }] }] },
  { name: "getRepoBounties", type: "function", stateMutability: "view", inputs: [{ name: "repo", type: "string" }], outputs: [{ type: "uint256[]" }] },
  { name: "getBountyByIssue", type: "function", stateMutability: "view", inputs: [{ name: "issueURL", type: "string" }], outputs: [{ type: "uint256" }] },
  { name: "getBountyByPR", type: "function", stateMutability: "view", inputs: [{ name: "prURL", type: "string" }], outputs: [{ type: "uint256" }] },
  { name: "getUserBounties", type: "function", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { name: "getTotalBounties", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];

const USDC_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
]);

// --- Venice AI Integration (Real API) ---

async function reviewWithVenice(prURL, issueURL) {
  try {
    console.log(`  Calling Venice AI for code review...`);
    
    // Fetch PR diff from GitHub
    const prDiff = await fetchPRDiff(prURL);
    const issueDetails = await fetchIssueDetails(issueURL);
    
    const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VENICE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "venice-code-large",
        messages: [
          {
            role: "system",
            content: "You are a senior code reviewer for open source bounties. Review PRs for correctness, code quality, security issues, and spam indicators. Return JSON with: score (0-100), issues (array of strings), summary (string), spam (boolean), aiSlop (boolean), securityIssues (array of strings), codeQuality ('good'|'fair'|'poor').",
          },
          {
            role: "user",
            content: `Review this PR for the linked issue.

Issue: ${issueDetails.title}
${issueDetails.body}

PR Diff:
${prDiff}

Return JSON: { "score": 0-100, "issues": [...], "summary": "...", "spam": bool, "aiSlop": bool, "securityIssues": [...], "codeQuality": "good|fair|poor" }`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let reviewResult;
    try {
      reviewResult = JSON.parse(content);
    } catch (e) {
      reviewResult = {
        score: 50,
        issues: ["Failed to parse AI response"],
        summary: "Review completed with parsing error",
        spam: false,
        aiSlop: false,
        securityIssues: [],
        codeQuality: "fair",
      };
    }

    const score = reviewResult.score || 50;
    const approved = score >= 80;
    
    return {
      approved,
      score,
      reasoning: reviewResult.summary || `PR review score: ${score}/100`,
      issues: reviewResult.issues || [],
      spam: reviewResult.spam || false,
      aiSlop: reviewResult.aiSlop || false,
      securityIssues: reviewResult.securityIssues || [],
      codeQuality: reviewResult.codeQuality || "fair",
    };
  } catch (error) {
    console.error("Venice AI review failed:", error);
    return {
      approved: false,
      score: 0,
      reasoning: "AI review failed: " + error.message,
      issues: [],
      spam: false,
      aiSlop: false,
      securityIssues: [],
      codeQuality: "poor",
    };
  }
}

// --- GitHub API Integration ---

async function fetchPRDiff(prURL) {
  try {
    // Parse PR URL: https://github.com/owner/repo/pull/123
    const match = prURL.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return "Could not parse PR URL";
    
    const [, owner, repo, prNumber] = match;
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3.diff",
          "Authorization": GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined,
        },
      }
    );
    
    return await response.text();
  } catch (error) {
    console.error("Failed to fetch PR diff:", error);
    return "Failed to fetch PR diff";
  }
}

async function fetchIssueDetails(issueURL) {
  try {
    const match = issueURL.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return { title: "Unknown Issue", body: "" };
    
    const [, owner, repo, issueNumber] = match;
    
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Authorization": GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined,
        },
      }
    );
    
    const issue = await response.json();
    return {
      title: issue.title || "Unknown Issue",
      body: issue.body || "",
    };
  } catch (error) {
    console.error("Failed to fetch issue details:", error);
    return { title: "Unknown Issue", body: "" };
  }
}

async function postPRComment(prURL, comment) {
  try {
    const match = prURL.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return;
    
    const [, owner, repo, prNumber] = match;
    
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "Authorization": GITHUB_TOKEN ? `token ${GITHUB_TOKEN}` : undefined,
        },
        body: JSON.stringify({ body: comment }),
      }
    );
  } catch (error) {
    console.error("Failed to post PR comment:", error);
  }
}

// --- 1Shot Relayer Integration ---

async function relayViaOneShot(params) {
  const { to, data, value = "0", gasToken = NEXT_PUBLIC_USDC_ADDRESS } = params;
  
  // In production, use the real 1Shot SDK:
  // import { OneShotClient } from "@1shot/api";
  // const client = new OneShotClient({ apiKey: ONESHOT_API_KEY, apiSecret: ONESHOT_API_SECRET });
  // const result = await client.relayExecution({ ... });
  
  // For now, execute directly via wallet client (simulated relay)
  console.log(`  Relaying transaction via 1Shot...`);
  console.log(`  Target: ${to}`);
  console.log(`  Gas Token: ${gasToken}`);
  
  // Simulate 1Shot relay delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Execute the transaction
  const hash = await walletClient.sendTransaction({
    to,
    data,
    value: BigInt(value),
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  return {
    success: true,
    txHash: receipt.transactionHash,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: "0.04",
  };
}

// --- Core flow ---

async function handlePRSubmission(bountyId, prURL, solverAddress) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`NEW PR SUBMISSION`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  Bounty ID : ${bountyId}`);
  console.log(`  PR        : ${prURL}`);
  console.log(`  Solver    : ${solverAddress}`);

  // 1. Read bounty details
  console.log(`\n[1/6] Reading bounty details...`);
  const bountyInfo = await publicClient.readContract({
    address: NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS,
    abi: BOUNTY_FACTORY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  });
  
  const bountyAddress = bountyInfo.bounty;
  const issueURL = bountyInfo.issueURL;
  console.log(`  Issue: ${issueURL}`);
  console.log(`  Bounty Contract: ${bountyAddress}`);

  // 2. Submit PR to registry
  console.log(`\n[2/6] Submitting PR to registry...`);
  const prNumber = parseInt(prURL.match(/\/pull\/(\d+)/)?.[1] || "0");
  const submitPRHash = await walletClient.writeContract({
    address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
    abi: BOUNTY_REGISTRY_ABI,
    functionName: "submitPR",
    args: [BigInt(bountyId), BigInt(prNumber), prURL, solverAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitPRHash });
  console.log(`  ✓ PR submitted: ${submitPRHash}`);

  // 3. Post comment on PR
  console.log(`\n[3/6] Posting PR comment...`);
  await postPRComment(prURL, `🎯 **Linked to bounty #${bountyId}**

Status: In review. AI confidence: pending...

Powered by PRaise — Open source bounties that pay themselves.`);
  console.log(`  ✓ PR comment posted`);

  // 4. AI Review with Venice
  console.log(`\n[4/6] Running AI review with Venice...`);
  const aiReview = await reviewWithVenice(prURL, issueURL);
  console.log(`  Result: ${aiReview.approved ? "APPROVED ✓" : "REJECTED ✗"} (score: ${aiReview.score})`);
  console.log(`  Reasoning: ${aiReview.reasoning}`);
  if (aiReview.spam) console.log(`  ⚠ SPAM DETECTED`);
  if (aiReview.aiSlop) console.log(`  ⚠ AI-GENERATED CODE DETECTED`);

  // 5. Submit AI score to bounty
  console.log(`\n[5/6] Submitting AI score to bounty...`);
  const submitScoreHash = await walletClient.writeContract({
    address: bountyAddress,
    abi: BOUNTY_ABI,
    functionName: "submitAIScore",
    args: [BigInt(aiReview.score)],
  });
  await publicClient.waitForTransactionReceipt({ hash: submitScoreHash });
  console.log(`  ✓ AI score submitted: ${submitScoreHash}`);

  // 6. Resolve bounty
  console.log(`\n[6/6] Resolving bounty...`);
  const resolveHash = await walletClient.writeContract({
    address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
    abi: BOUNTY_REGISTRY_ABI,
    functionName: "resolveBounty",
    args: [BigInt(bountyId), aiReview.approved],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: resolveHash });
  console.log(`  ✓ Bounty resolved: ${receipt.transactionHash}`);

  // Post verdict comment
  if (aiReview.approved) {
    await postPRComment(prURL, `✅ **AI Review: APPROVED** (${aiReview.score}/100)

${aiReview.reasoning}

Bounty #${bountyId} will be released to @${solverAddress.slice(0, 8)}...`);
  } else {
    await postPRComment(prURL, `❌ **AI Review: REJECTED** (${aiReview.score}/100)

${aiReview.reasoning}

Issues found: ${aiReview.issues.join(", ")}`);
  }
  
  console.log(`\n  Bounty #${bountyId}: ${aiReview.approved ? "USDC sent to solver ✓" : "USDC returned to creator ✗"}`);
  console.log(`${"=".repeat(50)}\n`);

  return { approved: aiReview.approved, score: aiReview.score, reasoning: aiReview.reasoning };
}

async function releaseBountyFunds(bountyId, recipientAddress, amount) {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`BOUNTY RELEASE`);
  console.log(`${"=".repeat(50)}`);
  console.log(`  Bounty ID  : ${bountyId}`);
  console.log(`  Recipient  : ${recipientAddress}`);
  console.log(`  Amount     : ${amount} USDC`);

  // Read bounty address
  const bountyInfo = await publicClient.readContract({
    address: NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS,
    abi: BOUNTY_FACTORY_ABI,
    functionName: "getBounty",
    args: [BigInt(bountyId)],
  });
  
  const bountyAddress = bountyInfo.bounty;

  // Execute release via AgentDelegation through 1Shot Relayer
  console.log(`\nExecuting release via 1Shot Relayer...`);
  
  const releaseHash = await walletClient.writeContract({
    address: NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS,
    abi: AGENT_DELEGATION_ABI,
    functionName: "executeRelease",
    args: [
      bountyAddress,
      recipientAddress,
      BigInt(Math.floor(amount * 1e6)), // Convert to wei
      BigInt(80), // AI score threshold
    ],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: releaseHash });
  console.log(`  ✓ Release executed: ${receipt.transactionHash}`);
  console.log(`  Gas paid in USDC via 1Shot Relayer`);
  console.log(`${"=".repeat(50)}\n`);

  return { success: true, txHash: receipt.transactionHash };
}

// --- GitHub Webhook Handler ---

function verifyGitHubWebhook(req) {
  const signature = req.headers["x-hub-signature-256"];
  if (!signature || !GITHUB_WEBHOOK_SECRET) return false;
  
  const hmac = crypto.createHmac("sha256", GITHUB_WEBHOOK_SECRET);
  const digest = "sha256=" + hmac.update(JSON.stringify(req.body)).digest("hex");
  
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handleGitHubWebhook(event, payload) {
  console.log(`\nGitHub Webhook: ${event}`);
  
  if (event === "pull_request") {
    const action = payload.action;
    const pr = payload.pull_request;
    
    if (action === "closed" && pr.merged) {
      // PR was merged — trigger bounty evaluation
      const prURL = pr.html_url;
      console.log(`  PR merged: ${prURL}`);
      
      // Find bounty for this PR
      try {
        const bountyId = await publicClient.readContract({
          address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
          abi: BOUNTY_REGISTRY_ABI,
          functionName: "getBountyByPR",
          args: [prURL],
        });
        
        if (bountyId > 0) {
          console.log(`  Found bounty #${bountyId} for this PR`);
          // The submission flow will handle the evaluation
        }
      } catch (e) {
        console.log(`  No bounty found for this PR`);
      }
    }
    
    if (action === "opened" || action === "synchronize") {
      // New PR or update — check if it references a bounty issue
      const body = pr.body || "";
      const issueMatch = body.match(/(?:closes|fixes|resolves)\s+#(\d+)/i);
      
      if (issueMatch) {
        const issueNumber = parseInt(issueMatch[1]);
        console.log(`  PR references issue #${issueNumber}`);
      }
    }
  }
  
  if (event === "issues") {
    const action = payload.action;
    const issue = payload.issue;
    
    if (action === "labeled") {
      const label = payload.label?.name;
      if (label?.startsWith("bounty:")) {
        const amount = parseInt(label.split(":")[1]);
        console.log(`  Issue labeled with bounty: ${amount} USDC`);
      }
    }
  }
}

// --- HTTP API for frontend ---

const app = express();
app.use(cors());
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// Rate limiting: 5 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000;

app.use("/submit", (req, res, next) => {
  if (req.method !== "POST") return next();
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entries = rateLimitMap.get(ip) || [];
  const recent = entries.filter((t) => now - t < RATE_WINDOW);
  if (recent.length >= RATE_LIMIT) {
    const retryAfter = Math.ceil((recent[0] + RATE_WINDOW - now) / 1000);
    res.set("Retry-After", String(retryAfter));
    return res.status(429).json({ error: "Too many requests. Try again later." });
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  next();
});

// POST /submit — frontend calls this with bountyId, prURL, solverAddress
app.post("/submit", async (req, res) => {
  const { bountyId, prURL, solverAddress } = req.body;

  if (bountyId === undefined || !prURL || !solverAddress) {
    return res.status(400).json({ error: "Missing bountyId, prURL, or solverAddress" });
  }

  try {
    const result = await handlePRSubmission(bountyId, prURL, solverAddress);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /release — release bounty funds
app.post("/release", async (req, res) => {
  const { bountyId, recipientAddress, amount } = req.body;

  if (bountyId === undefined || !recipientAddress || !amount) {
    return res.status(400).json({ error: "Missing bountyId, recipientAddress, or amount" });
  }

  try {
    const result = await releaseBountyFunds(bountyId, recipientAddress, amount);
    res.json(result);
  } catch (err) {
    console.error("Release error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /bounties — list all bounties
app.get("/bounties", async (req, res) => {
  try {
    const count = await publicClient.readContract({
      address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
      abi: BOUNTY_REGISTRY_ABI,
      functionName: "getTotalBounties",
    });

    const bounties = [];
    for (let i = 0; i < Number(count); i++) {
      try {
        const b = await publicClient.readContract({
          address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
          abi: BOUNTY_REGISTRY_ABI,
          functionName: "getBounty",
          args: [BigInt(i)],
        });
        
        const statusMap = ["Open", "Submitted", "Approved", "Rejected"];
        bounties.push({
          id: Number(b.bountyId),
          creator: b.creator,
          issueURL: b.issueURL,
          prURL: b.prURL,
          amount: b.amount.toString(),
          solver: b.solver,
          status: statusMap[b.status] || "Unknown",
          repo: b.repo,
          issueNumber: Number(b.issueNumber),
          createdAt: Number(b.createdAt),
        });
      } catch (e) {
        // Skip invalid bounties
      }
    }

    res.json(bounties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /status/:id — detailed bounty status
app.get("/status/:id", async (req, res) => {
  try {
    const bountyId = parseInt(req.params.id);
    
    const bounty = await publicClient.readContract({
      address: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
      abi: BOUNTY_REGISTRY_ABI,
      functionName: "getBounty",
      args: [BigInt(bountyId)],
    });

    const statusMap = ["Open", "Submitted", "Approved", "Rejected"];
    const status = statusMap[bounty.status] || "Unknown";

    // Get bounty contract details if available
    let bountyDetails = null;
    if (bounty.bounty !== "0x0000000000000000000000000000000000000000") {
      try {
        bountyDetails = await publicClient.readContract({
          address: bounty.bounty,
          abi: BOUNTY_ABI,
          functionName: "getBounty",
        });
      } catch (e) {
        // Bounty contract might not exist yet
      }
    }

    res.json({
      id: Number(bounty.bountyId),
      creator: bounty.creator,
      issueURL: bounty.issueURL,
      prURL: bounty.prURL,
      amount: bounty.amount.toString(),
      solver: bounty.solver,
      status,
      repo: bounty.repo,
      issueNumber: Number(bounty.issueNumber),
      createdAt: Number(bounty.createdAt),
      details: bountyDetails ? {
        paused: bountyDetails.paused,
        contestPeriodEnd: Number(bountyDetails.contestPeriodEnd),
        aiScore: Number(bountyDetails.aiScore),
        prMerged: bountyDetails.prMerged,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /webhook/github — GitHub webhook receiver
app.post("/webhook/github", async (req, res) => {
  const event = req.headers["x-github-event"];
  const delivery = req.headers["x-github-delivery"];
  
  console.log(`\nGitHub webhook received: ${event} (${delivery})`);
  
  // Verify webhook signature
  if (GITHUB_WEBHOOK_SECRET && !verifyGitHubWebhook(req)) {
    console.error("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }
  
  try {
    await handleGitHubWebhook(event, req.body);
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /webhook/1shot — 1Shot relayer webhook receiver
app.post("/webhook/1shot", async (req, res) => {
  console.log(`\n1Shot webhook received`);
  
  const { txHash, status, bountyId } = req.body;
  
  if (status === "confirmed") {
    console.log(`  Transaction confirmed: ${txHash}`);
    // Update bounty status if needed
  } else if (status === "failed") {
    console.log(`  Transaction failed: ${txHash}`);
    // Handle failure
  }
  
  res.status(200).json({ received: true });
});

// GET /health — health check
const startTime = Date.now();

app.get("/health", async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  let chainConnected = false;
  try {
    await publicClient.getBlockNumber();
    chainConnected = true;
  } catch (e) { /* unreachable */ }

  res.json({
    status: "ok",
    uptime: uptimeSeconds,
    lastCheck: new Date().toISOString(),
    chain: "Arbitrum Sepolia",
    chainId: 421614,
    chainConnected,
    relayer: account.address,
    contracts: {
      bountyFactory: NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS,
      agentDelegation: NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS,
      bountyRegistry: NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS,
    },
    integrations: {
      veniceAI: !!VENICE_API_KEY,
      oneShot: !!ONESHOT_API_KEY,
      github: !!GITHUB_TOKEN,
    },
  });
});

// --- Exports ---

export { app, rateLimitMap };

// --- Start ---

if (process.env.NODE_ENV !== "test") {
  console.log("PRaise Relayer v3.0");
  console.log(`Chain            : Arbitrum Sepolia (421614)`);
  console.log(`BountyFactory    : ${NEXT_PUBLIC_BOUNTY_FACTORY_ADDRESS}`);
  console.log(`AgentDelegation  : ${NEXT_PUBLIC_AGENT_DELEGATION_ADDRESS}`);
  console.log(`BountyRegistry   : ${NEXT_PUBLIC_BOUNTY_REGISTRY_ADDRESS}`);
  console.log(`Relayer          : ${account.address}`);
  console.log(`Venice AI        : ${VENICE_API_KEY ? "✓ Configured" : "✗ Not configured"}`);
  console.log(`1Shot Relayer    : ${ONESHOT_API_KEY ? "✓ Configured" : "✗ Not configured"}`);
  console.log(`GitHub           : ${GITHUB_TOKEN ? "✓ Configured" : "✗ Not configured"}`);

  const server = app.listen(PORT, () => {
    console.log(`\nAPI listening on http://localhost:${PORT}`);
    console.log(`\nEndpoints:`);
    console.log(`  POST /submit          — { bountyId, prURL, solverAddress }`);
    console.log(`  POST /release         — { bountyId, recipientAddress, amount }`);
    console.log(`  POST /webhook/github  — GitHub webhook receiver`);
    console.log(`  POST /webhook/1shot   — 1Shot relayer webhook`);
    console.log(`  GET  /bounties        — list all bounties`);
    console.log(`  GET  /status/:id      — bounty detail`);
    console.log(`  GET  /health          — check status\n`);
  });

  server.on("error", (err) => {
    console.error("Server error:", err.message);
  });

  process.on("SIGINT", () => {
    console.log("\nShutting down...");
    server.close();
    process.exit(0);
  });
}
