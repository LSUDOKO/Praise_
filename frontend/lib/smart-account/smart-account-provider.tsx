"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWeb3Auth } from "@/components/web3auth-provider";
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { createBundlerClient } from "viem/account-abstraction";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import type { SmartAccount } from "@metamask/smart-accounts-kit";

interface SmartAccountContextType {
  smartAccount: SmartAccount | null;
  smartAccountAddress: Address | null;
  isDeployed: boolean;
  isCreating: boolean;
  createSmartAccount: () => Promise<void>;
  deploySmartAccount: () => Promise<void>;
  executeTransaction: (calls: Array<{
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }>) => Promise<`0x${string}`>;
}

const SmartAccountContext = createContext<SmartAccountContextType>({
  smartAccount: null,
  smartAccountAddress: null,
  isDeployed: false,
  isCreating: false,
  createSmartAccount: async () => {},
  deploySmartAccount: async () => {},
  executeTransaction: async () => "0x" as `0x${string}`,
});

export const useSmartAccount = () => useContext(SmartAccountContext);

export function SmartAccountProvider({ children }: { children: ReactNode }) {
  const { provider, address: eoaAddress, isConnected } = useWeb3Auth();
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"),
  });

  // Auto-create Smart Account when Web3Auth connects
  useEffect(() => {
    if (isConnected && provider && eoaAddress && !smartAccount && !isCreating) {
      createSmartAccount();
    }
  }, [isConnected, provider, eoaAddress, smartAccount, isCreating]);

  const createSmartAccount = async () => {
    if (!provider || !eoaAddress || isCreating) return;

    setIsCreating(true);
    try {
      console.log("🔨 Creating Smart Account for:", eoaAddress);

      // Create wallet client from Web3Auth provider
      const walletClient = createWalletClient({
        account: eoaAddress as Address,
        chain: arbitrumSepolia,
        transport: custom(provider),
      });

      // Create Smart Account using MetaMask Smart Accounts Kit
      // Implementation.Hybrid supports both EOA owner and passkey signers
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [eoaAddress as Address, [], [], []], // owner, admins, plugins, hooks
        deploySalt: "0x", // deterministic address
        signer: { walletClient },
      });

      setSmartAccount(account);
      setSmartAccountAddress(account.address);

      // Check if already deployed
      const code = await publicClient.getCode({ address: account.address });
      const deployed = code && code !== "0x";
      setIsDeployed(!!deployed);

      console.log("✅ Smart Account created:", account.address);
      console.log("   Deployed:", deployed ? "Yes" : "No");
    } catch (error) {
      console.error("❌ Error creating Smart Account:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deploySmartAccount = async () => {
    if (!smartAccount || !smartAccountAddress || isDeployed) return;

    try {
      console.log("🚀 Deploying Smart Account...");
      
      // Use the MetaMask Smart Accounts Kit's own deploy method via the account
      // If it doesn't exist, we simulate deployment by checking if code exists
      const code = await publicClient.getCode({ address: smartAccountAddress });
      if (code && code !== "0x") {
        setIsDeployed(true);
        console.log("✅ Smart Account already deployed");
        return;
      }

      // For the MetaMask Smart Accounts Kit, deployment happens automatically
      // when the first user operation is sent through a bundler.
      // We simulate the check since deploy() may not be exposed directly.
      const bundlerRpcUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL || 
        "https://api.pimlico.io/v2/421614/rpc?apikey=your-api-key";
      
      try {
        const bundlerClient = createBundlerClient({
          client: publicClient,
          transport: http(bundlerRpcUrl),
        });

        // Send a self-call to trigger deployment
        // This deploys the account by sending a user operation from it
        const hash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [{
            to: smartAccountAddress,
            value: 0n,
            data: "0x" as `0x${string}`,
          }],
        });

        try {
          const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
          await publicClient.waitForTransactionReceipt({ hash: receipt.receipt.transactionHash });
          setIsDeployed(true);
          console.log("✅ Smart Account deployed via bundler:", receipt.receipt.transactionHash);
        } catch {
          // If wait fails, the deployment may still have been initiated
          // Check again after a delay
          setTimeout(async () => {
            const checkCode = await publicClient.getCode({ address: smartAccountAddress });
            if (checkCode && checkCode !== "0x") {
              setIsDeployed(true);
              console.log("✅ Smart Account deployed (confirmed after delay)");
            }
          }, 10000);
          throw new Error("Bundler submission initiated — check back shortly");
        }
      } catch (bundlerError) {
        // If bundler is not configured, mark as ready but not deployed
        console.warn("⚠️ Bundler not available. Smart Account ready for deployment when bundler is configured.");
        // Deployment will happen automatically on first real transaction
      }
    } catch (error) {
      console.error("❌ Error deploying Smart Account:", error);
      // Don't throw — deployment will happen automatically on first tx anyway
    }
  };

  const executeTransaction = async (calls: Array<{
    to: Address;
    value?: bigint;
    data?: `0x${string}`;
  }>): Promise<`0x${string}`> => {
    if (!smartAccount) {
      throw new Error("Smart Account not initialized");
    }

    try {
      console.log("📤 Executing transaction via Smart Account...");
      
      // Create bundler client for gasless transactions
      // Note: You need to configure a bundler RPC endpoint for production
      // Using Pimlico, Stackup, or another bundler service
      const bundlerRpcUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL || 
        "https://api.pimlico.io/v2/421614/rpc?apikey=your-api-key";
      
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerRpcUrl),
      });

      // Send user operation through bundler
      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: calls.map(call => ({
          to: call.to,
          value: call.value || 0n,
          data: call.data || "0x",
        })),
      });

      console.log("✅ User operation sent:", userOpHash);

      // Wait for receipt
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log("✅ Transaction executed:", receipt.receipt.transactionHash);
      return receipt.receipt.transactionHash;
    } catch (error) {
      console.error("❌ Error executing transaction:", error);
      throw error;
    }
  };

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccount,
        smartAccountAddress,
        isDeployed,
        isCreating,
        createSmartAccount,
        deploySmartAccount,
        executeTransaction,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}
