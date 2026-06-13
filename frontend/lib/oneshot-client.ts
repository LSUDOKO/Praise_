/**
 * 1Shot Permissionless Relayer Client
 * Enables gasless transactions paid in USDC
 */

const ONESHOT_API_KEY = process.env.ONESHOT_API_KEY;
const ONESHOT_API_SECRET = process.env.ONESHOT_API_SECRET;
const ONESHOT_BUSINESS_ID = process.env.ONESHOT_BUSINESS_ID;
const ONESHOT_BASE_URL = "https://api.1shot.io/v1";

export interface RelayExecutionParams {
  chainId: number;
  target: string;
  value: bigint;
  callData: string;
  gasToken: string; // USDC address
  from: string;
  webhookUrl?: string;
}

export interface RelayResult {
  success: boolean;
  txHash?: string;
  relayId?: string;
  error?: string;
  gasPaidInToken?: string;
}

export class OneShotClient {
  private apiKey: string;
  private apiSecret: string;
  private businessId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = ONESHOT_API_KEY || "";
    this.apiSecret = ONESHOT_API_SECRET || "";
    this.businessId = ONESHOT_BUSINESS_ID || "";
    this.baseUrl = ONESHOT_BASE_URL;

    if (!this.apiKey || !this.apiSecret || !this.businessId) {
      console.warn("1Shot credentials missing - gasless transactions disabled");
    }
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-API-Key": this.apiKey,
      "X-API-Secret": this.apiSecret,
      "X-Business-ID": this.businessId,
    };
  }

  /**
   * Relay a transaction with gas paid in USDC
   */
  async relayExecution(params: RelayExecutionParams): Promise<RelayResult> {
    try {
      const response = await fetch(`${this.baseUrl}/relay/execute`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          chainId: params.chainId,
          target: params.target,
          value: params.value.toString(),
          callData: params.callData,
          gasToken: params.gasToken,
          from: params.from,
          webhookUrl: params.webhookUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `1Shot API error: ${error}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        txHash: data.txHash,
        relayId: data.relayId,
        gasPaidInToken: data.gasPaidInToken,
      };
    } catch (error) {
      console.error("Error calling 1Shot:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get relay transaction status
   */
  async getRelayStatus(relayId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/relay/${relayId}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`1Shot API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting relay status:", error);
      throw error;
    }
  }

  /**
   * Estimate gas cost in USDC
   */
  async estimateGasCost(params: {
    chainId: number;
    target: string;
    callData: string;
    gasToken: string;
  }): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/relay/estimate`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`1Shot API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.estimatedCost || "0";
    } catch (error) {
      console.error("Error estimating gas cost:", error);
      return "0";
    }
  }
}

export const oneshotClient = new OneShotClient();
