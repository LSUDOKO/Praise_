/**
 * x402 Payment Protocol Client
 * Implements HTTP 402 "Payment Required" for pay-per-call AI services
 */

import { type Address } from "viem";

const X402_ENABLED = process.env.X402_ENABLED === "true";
const X402_TOKEN_ADDRESS = process.env.X402_TOKEN_ADDRESS as Address;
const X402_RPC_URL = process.env.X402_RPC_URL;

export interface X402Payment {
  amount: string;
  token: Address;
  recipient: Address;
  signature: string;
  nonce: string;
}

export interface X402Response {
  success: boolean;
  data?: any;
  paymentReceived?: boolean;
  receiptId?: string;
}

export class X402Client {
  private enabled: boolean;
  private tokenAddress: Address;
  private rpcUrl: string;

  constructor() {
    this.enabled = X402_ENABLED;
    this.tokenAddress = X402_TOKEN_ADDRESS;
    this.rpcUrl = X402_RPC_URL || "";

    if (this.enabled && !this.tokenAddress) {
      console.warn("x402 enabled but token address missing");
    }
  }

  /**
   * Make a paid request with x402 payment
   */
  async request(params: {
    endpoint: string;
    method: "GET" | "POST";
    body?: any;
    payment: X402Payment;
  }): Promise<X402Response> {
    if (!this.enabled) {
      console.log("x402 disabled, making regular request");
      // Fall back to regular request
      return this.regularRequest(params);
    }

    try {
      const response = await fetch(params.endpoint, {
        method: params.method,
        headers: {
          "Content-Type": "application/json",
          "X-402-Payment": JSON.stringify(params.payment),
        },
        body: params.body ? JSON.stringify(params.body) : undefined,
      });

      if (response.status === 402) {
        // Payment required - should not happen if payment was valid
        return {
          success: false,
          data: await response.json(),
        };
      }

      if (!response.ok) {
        throw new Error(`x402 request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const receiptId = response.headers.get("X-402-Receipt-ID");

      return {
        success: true,
        data,
        paymentReceived: true,
        receiptId: receiptId || undefined,
      };
    } catch (error) {
      console.error("x402 request error:", error);
      return {
        success: false,
      };
    }
  }

  /**
   * Create a payment for x402 request
   */
  async createPayment(params: {
    amount: string;
    recipient: Address;
    signer: any; // Wallet signer
  }): Promise<X402Payment> {
    const nonce = Date.now().toString();
    
    // TODO: Sign the payment with wallet
    const message = `x402-payment:${params.amount}:${params.recipient}:${nonce}`;
    const signature = "0x..."; // Placeholder - actual signing needed

    return {
      amount: params.amount,
      token: this.tokenAddress,
      recipient: params.recipient,
      signature,
      nonce,
    };
  }

  /**
   * Fallback to regular request
   */
  private async regularRequest(params: {
    endpoint: string;
    method: "GET" | "POST";
    body?: any;
  }): Promise<X402Response> {
    try {
      const response = await fetch(params.endpoint, {
        method: params.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: params.body ? JSON.stringify(params.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.statusText}`);
      }

      return {
        success: true,
        data: await response.json(),
        paymentReceived: false,
      };
    } catch (error) {
      console.error("Regular request error:", error);
      return {
        success: false,
      };
    }
  }

  /**
   * Verify x402 payment receipt
   */
  async verifyReceipt(receiptId: string): Promise<boolean> {
    // TODO: Implement receipt verification
    console.log("Verifying receipt:", receiptId);
    return true;
  }
}

export const x402Client = new X402Client();

/**
 * Express middleware for x402 payment verification (server-side)
 */
export function x402Middleware(priceInUSDC: number) {
  return async (req: any, res: any, next: any) => {
    if (!X402_ENABLED) {
      return next();
    }

    const paymentHeader = req.headers["x-402-payment"];
    
    if (!paymentHeader) {
      return res.status(402).json({
        error: "Payment required",
        price: priceInUSDC,
        token: X402_TOKEN_ADDRESS,
        acceptedTokens: ["USDC", "USDT"],
      });
    }

    try {
      const payment: X402Payment = JSON.parse(paymentHeader);
      
      // TODO: Verify payment signature and amount
      const isValid = await verifyX402Payment(payment, priceInUSDC);
      
      if (!isValid) {
        return res.status(402).json({
          error: "Invalid payment",
          price: priceInUSDC,
        });
      }

      // Payment verified, proceed
      const receiptId = `rcpt_${Date.now()}`;
      res.setHeader("X-402-Receipt-ID", receiptId);
      next();
    } catch (error) {
      return res.status(400).json({
        error: "Invalid payment format",
      });
    }
  };
}

async function verifyX402Payment(
  payment: X402Payment,
  expectedAmount: number
): Promise<boolean> {
  // TODO: Implement actual payment verification
  // 1. Verify signature
  // 2. Verify amount
  // 3. Check nonce hasn't been used
  // 4. Verify token address
  console.log("Verifying x402 payment:", payment);
  return true;
}
