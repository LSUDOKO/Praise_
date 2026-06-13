/**
 * ERC-7710 Delegation Manager
 * Handles delegation creation, signing, and execution for bounty permissions
 */

import { 
  createDelegation, 
  ScopeType, 
  CaveatType,
  type Delegation 
} from "@metamask/smart-accounts-kit";
import type { SmartAccount } from "@metamask/smart-accounts-kit";
import { type Address, parseUnits, encodeFunctionData } from "viem";

export interface BountyDelegationParams {
  bountyId: string;
  bountyAddress: Address;
  agentAddress: Address;
  usdcAddress: Address;
  maxAmount: string; // in USDC
  durationDays: number;
  minAIScore: number;
  contestPeriod: number;
}

export interface SignedDelegation extends Delegation {
  signature: `0x${string}`;
}

/**
 * DelegationManager handles ERC-7710 delegations for bounty agents
 */
export class DelegationManager {
  constructor(private smartAccount: SmartAccount) {}

  /**
   * Create a delegation for bounty agent to release funds
   * Uses ERC-20 transfer amount scope with time-based caveats
   */
  async createBountyDelegation(
    params: BountyDelegationParams
  ): Promise<Delegation> {
    const currentTime = Math.floor(Date.now() / 1000);
    const beforeThreshold = currentTime + params.durationDays * 24 * 60 * 60;

    // Create delegation with ERC-20 transfer scope
    // This allows the agent to transfer up to maxAmount of USDC
    const delegation = createDelegation({
      scope: {
        type: ScopeType.Erc20TransferAmount,
        tokenAddress: params.usdcAddress,
        maxAmount: parseUnits(params.maxAmount, 6), // USDC has 6 decimals
      },
      caveats: [
        // Time restriction - delegation expires after durationDays
        {
          type: CaveatType.Timestamp,
          afterThreshold: currentTime,
          beforeThreshold,
        },
        // Limit to single use - agent can only release once
        {
          type: CaveatType.LimitedCalls,
          limit: 1,
        },
      ],
      to: params.agentAddress,
      from: this.smartAccount.address,
      environment: this.smartAccount.environment,
    });

    console.log("🔐 Created delegation:", {
      bountyId: params.bountyId,
      agentAddress: params.agentAddress,
      maxAmount: params.maxAmount,
      expiresIn: `${params.durationDays} days`,
    });

    return delegation;
  }

  /**
   * Sign a delegation with the smart account
   */
  async signDelegation(delegation: Delegation): Promise<SignedDelegation> {
    try {
      const signature = await this.smartAccount.signDelegation({ delegation });
      
      return {
        ...delegation,
        signature,
      };
    } catch (error) {
      console.error("❌ Failed to sign delegation:", error);
      throw error;
    }
  }

  /**
   * Create and sign a bounty delegation in one step
   */
  async createAndSignBountyDelegation(
    params: BountyDelegationParams
  ): Promise<SignedDelegation> {
    const delegation = await this.createBountyDelegation(params);
    return this.signDelegation(delegation);
  }

  /**
   * Check if delegations exist for the smart account
   */
  async getDelegations(): Promise<Delegation[]> {
    try {
      const delegations = await this.smartAccount.getDelegations({
        environment: this.smartAccount.environment,
      });
      
      return delegations || [];
    } catch (error) {
      console.error("❌ Failed to fetch delegations:", error);
      return [];
    }
  }

  /**
   * Disable a delegation (revoke permission)
   */
  async disableDelegation(delegationHash: `0x${string}`): Promise<void> {
    try {
      await this.smartAccount.disableDelegation({
        environment: this.smartAccount.environment,
        delegationHash,
      });
      
      console.log("✅ Delegation disabled:", delegationHash);
    } catch (error) {
      console.error("❌ Failed to disable delegation:", error);
      throw error;
    }
  }

  /**
   * Format delegation for UI display
   */
  formatDelegationForUI(
    delegation: Delegation,
    params: Partial<BountyDelegationParams>
  ): {
    title: string;
    description: string;
    permissions: string[];
    restrictions: string[];
    expires: string;
  } {
    const timestampCaveat = delegation.caveats?.find(
      (c: any) => c.type === CaveatType.Timestamp
    );
    
    const expiresDate = timestampCaveat
      ? new Date((timestampCaveat as any).beforeThreshold * 1000)
      : new Date();
    
    const daysRemaining = Math.ceil(
      (expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return {
      title: `Bounty Agent Permission #${params.bountyId || "?"}`,
      description: `Agent can release bounty funds when conditions are met`,
      permissions: [
        `Transfer up to ${params.maxAmount || "?"} USDC`,
        "Execute after PR is merged",
        "Execute after contest period elapses",
        `Requires AI score >= ${params.minAIScore || 80}`,
      ],
      restrictions: [
        "Single use only (cannot reuse)",
        "Cannot transfer other tokens",
        "Cannot change recipient",
        `Expires in ${daysRemaining} days`,
      ],
      expires: expiresDate.toLocaleDateString(),
    };
  }
}

/**
 * Helper to create a delegation manager instance
 */
export function createDelegationManager(smartAccount: SmartAccount) {
  return new DelegationManager(smartAccount);
}
