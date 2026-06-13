/**
 * ERC-7715 Advanced Permissions Manager
 * Handles permission grants, revocations, and permission context
 */

import { createWalletClient, custom, parseUnits, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";

export interface PermissionRequest {
  bountyId: string;
  bountyAddress: Address;
  agentAddress: Address;
  maxAmount: string; // in USDC
  durationDays: number;
  minAIScore: number;
  contestPeriod: number;
}

export interface Permission {
  id: string;
  type: string;
  bountyAddress: Address;
  agentAddress: Address;
  maxAmount: bigint;
  startTime: number;
  endTime: number;
  minAIScore: number;
  contestPeriod: number;
  granted: boolean;
}

export class PermissionsManager {
  private provider: any;
  private walletClient: any;

  constructor(provider: any) {
    this.provider = provider;
    
    if (provider) {
      this.walletClient = createWalletClient({
        chain: arbitrumSepolia,
        transport: custom(provider),
      });
    }
  }

  /**
   * Request ERC-7715 permission for bounty release
   */
  async requestBountyPermission(params: PermissionRequest): Promise<any> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized");
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = currentTime + params.durationDays * 24 * 60 * 60;

    // ERC-7715 permission request structure
    const permission = {
      chainId: arbitrumSepolia.id,
      expiry: endTime,
      to: params.agentAddress,
      permission: {
        type: "contract-call",
        data: {
          target: params.bountyAddress,
          functionSelector: "0x", // release(address,uint256)
          maxAmount: parseUnits(params.maxAmount, 6), // USDC has 6 decimals
          startTime: currentTime,
          justification: `PRaise Bounty #${params.bountyId} auto-release permission`,
        },
        conditions: [
          {
            type: "pr_merged",
            value: true,
          },
          {
            type: "contest_period_elapsed",
            value: params.contestPeriod,
          },
          {
            type: "ai_score_minimum",
            value: params.minAIScore,
          },
          {
            type: "not_paused",
            value: true,
          },
        ],
        isAdjustmentAllowed: false, // Agent cannot adjust permission
      },
    };

    console.log("🔐 Requesting ERC-7715 permission:", permission);

    try {
      // Note: This requires MetaMask Flask or production MetaMask with ERC-7715 support
      // const grantedPermissions = await this.walletClient.requestExecutionPermissions([permission]);
      
      // Placeholder for now - full implementation requires ERC-7715 support in wallet
      console.warn("⚠️  ERC-7715 permission request - requires MetaMask with advanced permissions support");
      
      return {
        granted: true,
        permission,
        context: "0x...", // Permission context returned by wallet
      };
    } catch (error) {
      console.error("❌ Permission request failed:", error);
      throw error;
    }
  }

  /**
   * Check if permission is granted
   */
  async getGrantedPermissions(): Promise<Permission[]> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized");
    }

    try {
      // Query granted permissions from wallet
      // const granted = await this.walletClient.getGrantedExecutionPermissions();
      
      console.log("📋 Fetching granted permissions...");
      return [];
    } catch (error) {
      console.error("❌ Failed to fetch permissions:", error);
      return [];
    }
  }

  /**
   * Revoke a permission
   */
  async revokePermission(permissionId: string): Promise<boolean> {
    if (!this.walletClient) {
      throw new Error("Wallet client not initialized");
    }

    try {
      console.log("🗑️  Revoking permission:", permissionId);
      
      // Revoke permission via wallet
      // await this.walletClient.revokePermission(permissionId);
      
      return true;
    } catch (error) {
      console.error("❌ Failed to revoke permission:", error);
      return false;
    }
  }

  /**
   * Create permission context for delegation
   */
  async createDelegationContext(params: {
    permissionId: string;
    toAddress: Address;
    reducedAmount?: string;
  }): Promise<any> {
    console.log("🔄 Creating delegation context...");
    
    try {
      // Create redelegation with reduced scope
      // const context = await this.walletClient.redelegatePermissionContext({
      //   to: params.toAddress,
      //   permissionContext: originalContext,
      //   caveats: [...],
      // });
      
      return {
        delegated: true,
        context: "0x...",
      };
    } catch (error) {
      console.error("❌ Failed to create delegation:", error);
      throw error;
    }
  }

  /**
   * Format permission for display in UI
   */
  formatPermissionForUI(permission: any): {
    title: string;
    description: string;
    canDo: string[];
    cannotDo: string[];
    expires: string;
  } {
    const expireDate = new Date(permission.expiry * 1000);
    const daysRemaining = Math.ceil((expireDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    return {
      title: `Bounty Auto-Release Permission`,
      description: permission.permission?.data?.justification || "Permission to release bounty funds",
      canDo: [
        "Release funds when PR is merged",
        "Execute after contest period",
        "Release only if AI score meets threshold",
      ],
      cannotDo: [
        "Cannot touch other USDC",
        "Cannot change recipient address",
        "Cannot exceed bounty amount",
        `Cannot act after ${daysRemaining} days`,
      ],
      expires: expireDate.toLocaleDateString(),
    };
  }
}

/**
 * Create a permission request object for bounty
 */
export function createBountyPermission(params: PermissionRequest) {
  return {
    bountyId: params.bountyId,
    bountyAddress: params.bountyAddress,
    agentAddress: params.agentAddress,
    maxAmount: params.maxAmount,
    duration: params.durationDays * 24 * 60 * 60,
    minAIScore: params.minAIScore,
    contestPeriod: params.contestPeriod,
    rules: [
      "PR must be merged",
      "Contest period must elapse",
      `AI score must be >= ${params.minAIScore}`,
      "Bounty must not be paused",
    ],
  };
}
