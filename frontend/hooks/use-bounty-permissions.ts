/**
 * Unified hook for bounty permissions and delegations
 * Combines Smart Account, ERC-7715 permissions, and ERC-7710 delegations
 */

import { useState, useCallback } from "react";
import { useSmartAccount } from "@/lib/smart-account/smart-account-provider";
import { PermissionsManager } from "@/lib/smart-account/permissions-manager";
import { createDelegationManager, type BountyDelegationParams } from "@/lib/smart-account/delegation-manager";
import { useWeb3Auth } from "@/components/web3auth-provider";
import type { Address } from "viem";

interface BountyPermissionRequest {
  bountyId: string;
  bountyAddress: Address;
  agentAddress: Address;
  usdcAddress: Address;
  maxAmount: string;
  durationDays: number;
  minAIScore: number;
  contestPeriod: number;
}

export function useBountyPermissions() {
  const { provider } = useWeb3Auth();
  const { smartAccount, isDeployed, deploySmartAccount } = useSmartAccount();
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Grant bounty permission using ERC-7710 delegation
   * This is the main method to authorize an agent to release bounty funds
   */
  const grantBountyPermission = useCallback(
    async (request: BountyPermissionRequest) => {
      if (!smartAccount) {
        throw new Error("Smart Account not initialized");
      }

      setIsGranting(true);
      setError(null);

      try {
        // Ensure smart account is deployed
        if (!isDeployed) {
          console.log("📦 Deploying Smart Account first...");
          await deploySmartAccount();
        }

        // Create delegation manager
        const delegationManager = createDelegationManager(smartAccount);

        // Create delegation with proper scopes and caveats
        const delegation = await delegationManager.createBountyDelegation({
          bountyId: request.bountyId,
          bountyAddress: request.bountyAddress,
          agentAddress: request.agentAddress,
          usdcAddress: request.usdcAddress,
          maxAmount: request.maxAmount,
          durationDays: request.durationDays,
          minAIScore: request.minAIScore,
          contestPeriod: request.contestPeriod,
        });

        // Sign the delegation
        const signedDelegation = await delegationManager.signDelegation(delegation);

        console.log("✅ Bounty permission granted:", {
          bountyId: request.bountyId,
          delegation: signedDelegation,
        });

        return signedDelegation;
      } catch (err: any) {
        console.error("❌ Failed to grant permission:", err);
        setError(err.message || "Failed to grant permission");
        throw err;
      } finally {
        setIsGranting(false);
      }
    },
    [smartAccount, isDeployed, deploySmartAccount]
  );

  /**
   * Revoke a bounty permission
   */
  const revokeBountyPermission = useCallback(
    async (delegationHash: `0x${string}`) => {
      if (!smartAccount) {
        throw new Error("Smart Account not initialized");
      }

      try {
        const delegationManager = createDelegationManager(smartAccount);
        await delegationManager.disableDelegation(delegationHash);
        
        console.log("✅ Permission revoked");
      } catch (err: any) {
        console.error("❌ Failed to revoke permission:", err);
        throw err;
      }
    },
    [smartAccount]
  );

  /**
   * Get all active delegations
   */
  const getActiveDelegations = useCallback(async () => {
    if (!smartAccount) return [];

    try {
      const delegationManager = createDelegationManager(smartAccount);
      return await delegationManager.getDelegations();
    } catch (err) {
      console.error("❌ Failed to fetch delegations:", err);
      return [];
    }
  }, [smartAccount]);

  /**
   * Request ERC-7715 Advanced Permission (alternative approach)
   * This is for MetaMask extension users with EIP-7715 support
   */
  const requestAdvancedPermission = useCallback(
    async (request: BountyPermissionRequest) => {
      if (!provider) {
        throw new Error("Wallet provider not initialized");
      }

      try {
        const permissionsManager = new PermissionsManager(provider);
        
        const permission = await permissionsManager.requestBountyPermission({
          bountyId: request.bountyId,
          bountyAddress: request.bountyAddress,
          agentAddress: request.agentAddress,
          maxAmount: request.maxAmount,
          durationDays: request.durationDays,
          minAIScore: request.minAIScore,
          contestPeriod: request.contestPeriod,
        });

        console.log("✅ Advanced Permission granted:", permission);
        return permission;
      } catch (err: any) {
        console.error("❌ Failed to request advanced permission:", err);
        throw err;
      }
    },
    [provider]
  );

  return {
    // State
    smartAccount,
    isDeployed,
    isGranting,
    error,

    // Actions
    grantBountyPermission,
    revokeBountyPermission,
    getActiveDelegations,
    requestAdvancedPermission,
  };
}
