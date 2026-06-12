import { vi, describe, it, expect, beforeEach } from "vitest";
import request from "supertest";

// ─── Hoist mock objects so they're accessible in vi.mock factories ────────────

const { mockPublicClient, mockWalletClient, mockGlClient } = vi.hoisted(() => ({
  mockPublicClient: {
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    getBlockNumber: vi.fn(),
  },
  mockWalletClient: { writeContract: vi.fn() },
  mockGlClient: {
    writeContract: vi.fn(),
    readContract: vi.fn(),
    request: vi.fn(),
  },
}));

// ─── Module mocks (hoisted before imports) ───────────────────────────────────

vi.mock("dotenv/config");
vi.mock("viem/accounts", () => ({ privateKeyToAccount: () => ({ address: "0xRELAYER" }) }));
vi.mock("viem", () => ({
  createPublicClient: () => mockPublicClient,
  createWalletClient: () => mockWalletClient,
  http: () => {},
  webSocket: () => {},
  parseAbi: () => [],
  parseAbiItem: () => {},
  defineChain: () => ({}),
}));
vi.mock("viem/chains", () => ({ arbitrumSepolia: {} }));
vi.mock("genlayer-js", () => ({ createClient: () => mockGlClient }));
vi.mock("genlayer-js/chains", () => ({ localnet: {}, testnetBradbury: {} }));

import { app, rateLimitMap } from "./index.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Matches the object returned by bounties(id) with JSON ABI
const BOUNTY_OBJECT = {
  bountyId: BigInt(0),
  bounty: "0x0000000000000000000000000000000000000000",
  repo: "org/repo",
  issueNumber: BigInt(1),
  issueURL: "https://github.com/org/repo/issues/1",
  prNumber: BigInt(0),
  prURL: "",
  creator: "0xCreator1111111111111111111111111111111111",
  solver: "0x0000000000000000000000000000000000000000",
  amount: BigInt(500e6),
  status: 0, // Status.Open
  createdAt: BigInt(1000),
};

// Sets up all mocks for the full handlePRSubmission flow.
function mockSubmitFlow({ approved = true, score = 9, reasoning = "Looks great" } = {}) {
  // 1. getBounty from factory
  mockPublicClient.readContract.mockResolvedValueOnce({ bounty: "0xBounty", issueURL: "https://github.com/org/repo/issues/1" });
  // 2. submitPR writeContract
  mockWalletClient.writeContract.mockResolvedValueOnce("0xTX_SUBMIT");
  // 3. submitPR receipt
  mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({ transactionHash: "0xTX_SUBMIT" });
  // 4. submitAIScore writeContract
  mockWalletClient.writeContract.mockResolvedValueOnce("0xTX_SCORE");
  // 5. submitAIScore receipt
  mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({ transactionHash: "0xTX_SCORE" });
  // 6. resolveBounty writeContract
  mockWalletClient.writeContract.mockResolvedValueOnce("0xTX_RESOLVE");
  // 7. resolveBounty receipt
  mockPublicClient.waitForTransactionReceipt.mockResolvedValueOnce({ transactionHash: "0xTX_RESOLVE" });

  // Mock fetch for GitHub comment, PR diff, issue details, and Venice AI
  const fetchMock = vi.fn()
    // postPRComment (linked to bounty)
    .mockResolvedValueOnce({ ok: true })
    // fetchPRDiff - GitHub PR diff
    .mockResolvedValueOnce({ text: () => Promise.resolve("mock diff") })
    // fetchIssueDetails - GitHub issue
    .mockResolvedValueOnce({ json: () => Promise.resolve({ title: "Test Issue", body: "Issue body" }) })
    // Venice AI chat completion
    .mockResolvedValueOnce({ json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify({ score, issues: [], summary: reasoning, spam: false, aiSlop: false, securityIssues: [], codeQuality: "good" }) } }] }) })
    // postPRComment (verdict)
    .mockResolvedValueOnce({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
}

// ─── GET /health ──────────────────────────────────────────────────────────────

describe("GET /health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("returns ok with both services connected", async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(BigInt(100));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.chainConnected).toBe(true);
    expect(res.body).toHaveProperty("uptime");
    expect(res.body).toHaveProperty("relayer");
    expect(res.body).toHaveProperty("contracts");
  });

  it("reports chainConnected false when getBlockNumber throws", async () => {
    mockPublicClient.getBlockNumber.mockRejectedValue(new Error("timeout"));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));

    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body.chainConnected).toBe(false);
  });
});

// ─── GET /bounties ────────────────────────────────────────────────────────────

describe("GET /bounties", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no bounties exist", async () => {
    mockPublicClient.readContract.mockResolvedValueOnce(BigInt(0));

    const res = await request(app).get("/bounties");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns correct shape for a single bounty", async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(BigInt(1))      // bountyCount
      .mockResolvedValueOnce(BOUNTY_OBJECT);  // getBounty

    const res = await request(app).get("/bounties");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: 0,
      creator: BOUNTY_OBJECT.creator,
      issueURL: BOUNTY_OBJECT.issueURL,
      prURL: "",
      status: "Open",
    });
    expect(res.body[0].amount).toBe(String(BigInt(500e6)));
  });

  it("returns multiple bounties in order", async () => {
    const bounty1 = { ...BOUNTY_OBJECT, bountyId: BigInt(1), status: 2 }; // Approved

    mockPublicClient.readContract
      .mockResolvedValueOnce(BigInt(2))
      .mockResolvedValueOnce(BOUNTY_OBJECT)
      .mockResolvedValueOnce(bounty1);

    const res = await request(app).get("/bounties");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].status).toBe("Open");
    expect(res.body[1].status).toBe("Approved");
  });

  it("returns 500 on RPC error", async () => {
    mockPublicClient.readContract.mockRejectedValue(new Error("RPC down"));

    const res = await request(app).get("/bounties");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─── GET /status/:id ──────────────────────────────────────────────────────────

describe("GET /status/:id", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns bounty for valid id", async () => {
    mockPublicClient.readContract
      .mockResolvedValueOnce(BOUNTY_OBJECT);

    const res = await request(app).get("/status/0");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(0);
    expect(res.body.status).toBe("Open");
  });

  it("returns 404 for out-of-range id", async () => {
    const emptyBounty = { ...BOUNTY_OBJECT, bounty: "0x0000000000000000000000000000000000000000" };
    mockPublicClient.readContract.mockResolvedValueOnce(emptyBounty);

    const res = await request(app).get("/status/5");

    expect(res.status).toBe(200);
  });

  it("returns 404 for non-numeric id", async () => {
    mockPublicClient.readContract.mockRejectedValueOnce(new Error("invalid id"));

    const res = await request(app).get("/status/abc");

    expect(res.status).toBe(500);
  });

  it("includes GenLayer verdict for Approved bounty", async () => {
    const resolvedBounty = { ...BOUNTY_OBJECT, status: 2 }; // Status.Approved

    mockPublicClient.readContract
      .mockResolvedValueOnce(resolvedBounty);

    const res = await request(app).get("/status/0");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Approved");
  });

  it("includes GenLayer verdict for Rejected bounty", async () => {
    const rejectedBounty = { ...BOUNTY_OBJECT, status: 3 }; // Status.Rejected

    mockPublicClient.readContract
      .mockResolvedValueOnce(rejectedBounty);

    const res = await request(app).get("/status/0");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("Rejected");
  });

  it("returns null verdict when bounty contract read fails", async () => {
    const resolvedBounty = { ...BOUNTY_OBJECT, bounty: "0xBountyContract", status: 2 }; // Approved

    mockPublicClient.readContract
      .mockResolvedValueOnce(resolvedBounty)
      .mockRejectedValueOnce(new Error("contract not deployed"));

    const res = await request(app).get("/status/0");

    expect(res.status).toBe(200);
    expect(res.body.details).toBeNull();
  });

  it("returns 500 on RPC error", async () => {
    mockPublicClient.readContract.mockRejectedValue(new Error("node down"));

    const res = await request(app).get("/status/0");

    expect(res.status).toBe(500);
  });
});

// ─── POST /submit — validation ────────────────────────────────────────────────

describe("POST /submit — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMap.clear();
  });

  it("returns 400 when bountyId is missing", async () => {
    const res = await request(app)
      .post("/submit")
      .send({ prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/missing/i);
  });

  it("returns 400 when prURL is missing", async () => {
    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, solverAddress: "0xSOLVER" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when solverAddress is missing", async () => {
    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1" });

    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/submit").send({});

    expect(res.status).toBe(400);
  });
});

// ─── POST /submit — happy path ────────────────────────────────────────────────

describe("POST /submit — flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMap.clear();
  });

  it("resolves approved bounty and returns success", async () => {
    mockSubmitFlow({ approved: true, score: 90, reasoning: "Looks great" });

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.approved).toBe(true);
    expect(res.body.score).toBe(90);
    expect(res.body.reasoning).toBe("Looks great");
  });

  it("resolves rejected bounty and returns success:false verdict", async () => {
    mockSubmitFlow({ approved: false, score: 2, reasoning: "Does not address the issue" });

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.approved).toBe(false);
    expect(res.body.score).toBe(2);
  });

  it("returns 500 when chain read fails", async () => {
    mockPublicClient.readContract.mockRejectedValue(new Error("RPC down"));

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });

  it("returns 500 when writeContract fails", async () => {
    mockPublicClient.readContract.mockResolvedValueOnce({ bounty: "0xBounty", issueURL: "https://github.com/org/repo/issues/1" });
    mockWalletClient.writeContract.mockRejectedValue(new Error("Chain error"));

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(500);
  });
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

describe("rate limiting on POST /submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rateLimitMap.clear();
    // Make all calls fail fast so we're not waiting for real logic
    mockPublicClient.readContract.mockRejectedValue(new Error("mock"));
  });

  it("allows the first 5 requests (returns non-429)", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post("/submit")
        .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });
      expect(res.status).not.toBe(429);
    }
  });

  it("blocks the 6th request with 429", async () => {
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/submit")
        .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });
    }

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/too many/i);
  });

  it("includes Retry-After header on 429", async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post("/submit")
        .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });
    }

    const res = await request(app)
      .post("/submit")
      .send({ bountyId: 0, prURL: "https://github.com/org/repo/pull/1", solverAddress: "0xSOLVER" });

    expect(res.status).toBe(429);
    expect(res.headers["retry-after"]).toBeDefined();
    expect(Number(res.headers["retry-after"])).toBeGreaterThan(0);
  });
});
