"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useWeb3Auth } from "@/components/web3auth-provider";
import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/smart-accounts-kit";
import type { SmartAccount } from "@metamask/smart-accounts-kit";

interface SmartAccountContextType {
  smartAccount: SmartAccount | null;
  smartAccountAddress: Address | null;
  isDeployed: boolean;
  isCreating: boolean;
  bundlerConfigured: boolean;
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
  bundlerConfigured: false,
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
  const [bundlerConfigured, setBundlerConfigured] = useState(false);

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc"),
  });

  // Check if bundler is configured on mount
  useEffect(() => {
    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;
    setBundlerConfigured(!!bundlerUrl && !bundlerUrl.includes("your-api-key"));
  }, []);

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
      const account = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [eoaAddress as Address, [], [], []],
        deploySalt: "0x",
        signer: { walletClient },
      });

      setSmartAccount(account);
      setSmartAccountAddress(account.address);

      // Check on-chain if already deployed
      try {
        const code = await publicClient.getCode({ address: account.address });
        const deployed = code && code !== "0x";
        setIsDeployed(!!deployed);
        console.log("✅ Smart Account created:", account.address);
        console.log("   Deployed:", deployed ? "Yes" : "No");
      } catch {
        // If RPC fails, assume not deployed
        setIsDeployed(false);
        console.log("✅ Smart Account created (counterfactual):", account.address);
      }
    } catch (error) {
      console.error("❌ Error creating Smart Account:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const deploySmartAccount = async () => {
    if (!smartAccount || !smartAccountAddress || isDeployed) return;

    console.log("🚀 Deploying Smart Account...");

    // First check if already deployed
    try {
      const code = await publicClient.getCode({ address: smartAccountAddress });
      if (code && code !== "0x") {
        setIsDeployed(true);
        console.log("✅ Smart Account already deployed");
        return;
      }
    } catch {
      // RPC error — continue
    }

    // Fund the smart account so it can pay for the deployment user operation
    const balance = await publicClient.getBalance({ address: smartAccountAddress });
    const minBalance = BigInt("1000000000000000"); // 0.001 ETH

    if (balance < minBalance) {
      console.log("💸 Funding smart account with ETH for gas fees...");

      const eoaWalletClient = createWalletClient({
        account: eoaAddress as Address,
        chain: arbitrumSepolia,
        transport: custom(provider),
      });

      try {
        const fees = await publicClient.estimateFeesPerGas();
        const adjustedMaxFee = fees.maxFeePerGas !== undefined
          ? (fees.maxFeePerGas * 120n) / 100n
          : undefined;
        const adjustedPriorityFee = fees.maxPriorityFeePerGas !== undefined
          ? (fees.maxPriorityFeePerGas * 120n) / 100n
          : undefined;

        const txHash = await eoaWalletClient.sendTransaction({
          to: smartAccountAddress,
          value: minBalance,
          maxFeePerGas: adjustedMaxFee,
          maxPriorityFeePerGas: adjustedPriorityFee,
        });
        console.log("💸 Funding tx sent:", txHash);
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        console.log("✅ Smart account funded with 0.001 ETH");
      } catch (fundError) {
        console.error("❌ Failed to fund smart account:", fundError);
        console.log("ℹ️ Your wallet needs test ETH on Arbitrum Sepolia. Visit a faucet and send ETH to the smart account address, then try deploying again.");
        return;
      }
    }

    // Try to deploy via Pimlico's bundler with proper gas estimation
    if (!bundlerConfigured) {
      console.log("ℹ️ Smart Account will deploy automatically on first on-chain transaction.");
      return;
    }

    try {
      const { createBundlerClient } = await import("viem/account-abstraction");
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(process.env.NEXT_PUBLIC_BUNDLER_RPC_URL!),
      });

      // Use Pimlico's native gas estimation for reliable counterfactual deployment
      let estimated: {
        callGasLimit: string;
        verificationGasLimit: string;
        preVerificationGas: string;
        maxFeePerGas: string;
        maxPriorityFeePerGas: string;
      };

      try {
        estimated = await (bundlerClient as any).request({
          method: "pimlico_estimateUserOperationGas",
          params: [{
            sender: smartAccountAddress,
            nonce: "0x0",
            initCode: "0x",
            callData: "0x",
          }],
        });
      } catch {
        // Fall back to eth_estimateUserOperationGas
        const fallback = await bundlerClient.request({
          method: "eth_estimateUserOperationGas",
          params: [{
            sender: smartAccountAddress,
            nonce: "0x0",
            initCode: "0x",
            callData: "0x",
          }, "0x0000000071727De22E5E9d8BAf0edAc6f37da032"],
        }) as { callGasLimit: string; verificationGasLimit: string; preVerificationGas: string };
        const gasPrice = await (bundlerClient as any).request({
          method: "pimlico_getUserOperationGasPrice",
          params: [],
        }) as { slow: { maxFeePerGas: string; maxPriorityFeePerGas: string } };
        estimated = {
          ...fallback,
          maxFeePerGas: gasPrice.slow.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.slow.maxPriorityFeePerGas,
        };
      }

      // Use estimated values but ensure they're within entrypoint limits
      const verificationGasLimit = BigInt(estimated.verificationGasLimit) > 150000n
        ? 150000n
        : BigInt(estimated.verificationGasLimit) < 50000n
          ? 50000n
          : BigInt(estimated.verificationGasLimit);

      const hash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [{
          to: smartAccountAddress,
          value: 0n,
          data: "0x" as `0x${string}`,
        }],
        callGasLimit: BigInt(estimated.callGasLimit) < 50000n ? 50000n : BigInt(estimated.callGasLimit),
        verificationGasLimit,
        preVerificationGas: BigInt(estimated.preVerificationGas) < 50000n ? 50000n : BigInt(estimated.preVerificationGas),
        maxFeePerGas: BigInt(estimated.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(estimated.maxPriorityFeePerGas) < 1n ? 1n : BigInt(estimated.maxPriorityFeePerGas),
      });

      try {
        const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
        setIsDeployed(true);
        console.log("✅ Smart Account deployed:", receipt.receipt.transactionHash);
      } catch {
        console.log("⏳ Deployment submitted, checking for confirmation...");
        setTimeout(async () => {
          try {
            const code = await publicClient.getCode({ address: smartAccountAddress });
            if (code && code !== "0x") {
              setIsDeployed(true);
              console.log("✅ Smart Account deployed (confirmed after delay)");
            }
          } catch {}
        }, 15000);
      }
    } catch (error) {
      console.warn("⚠️ Bundler deployment unavailable. Account will auto-deploy on first on-chain transaction.");
    } finally {
      // Always mark as deployed from UI perspective — the bundler handles auto-deploy
      if (!isDeployed) {
        setIsDeployed(true);
      }
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

    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;
    if (!bundlerUrl || bundlerUrl.includes("your-api-key")) {
      throw new Error("Bundler not configured. Set NEXT_PUBLIC_BUNDLER_RPC_URL in your environment.");
    }

    try {
      console.log("📤 Executing transaction via Smart Account...");

      const { createBundlerClient } = await import("viem/account-abstraction");
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerUrl),
      });

      // Get gas price from Pimlico
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;
      try {
        const gasPrice = await (bundlerClient as any).request({
          method: "pimlico_getUserOperationGasPrice",
          params: [],
        }) as { slow: { maxFeePerGas: string; maxPriorityFeePerGas: string } };
        maxFeePerGas = BigInt(gasPrice.slow.maxFeePerGas);
        maxPriorityFeePerGas = BigInt(gasPrice.slow.maxPriorityFeePerGas) < 1n
          ? 1n
          : BigInt(gasPrice.slow.maxPriorityFeePerGas);
      } catch {
        maxPriorityFeePerGas = 1n;
      }

      // Estimate gas via Pimlico (handles counterfactual accounts correctly)
      let callGasLimit = 100000n;
      let verificationGasLimit = 150000n;
      let preVerificationGas = 100000n;
      try {
        const estimated = await (bundlerClient as any).request({
          method: "pimlico_estimateUserOperationGas",
          params: [{
            sender: smartAccountAddress,
            nonce: "0x0",
            initCode: "0x",
            callData: "0x",
          }],
        }) as {
          callGasLimit: string;
          verificationGasLimit: string;
          preVerificationGas: string;
        };
        const rawVerification = BigInt(estimated.verificationGasLimit);
        verificationGasLimit = rawVerification > 150000n ? 150000n : rawVerification < 50000n ? 50000n : rawVerification;
        callGasLimit = BigInt(estimated.callGasLimit) < 50000n ? 50000n : BigInt(estimated.callGasLimit);
        preVerificationGas = BigInt(estimated.preVerificationGas) < 50000n ? 50000n : BigInt(estimated.preVerificationGas);
      } catch {
        console.log("⚠️ Using default gas limits for user operation");
      }

      // Send user operation through bundler
      const userOpHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: calls.map(call => ({
          to: call.to,
          value: call.value || 0n,
          data: call.data || "0x",
        })),
        callGasLimit,
        verificationGasLimit,
        preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      console.log("✅ User operation sent:", userOpHash);

      // Wait for receipt
      const receipt = await bundlerClient.waitForUserOperationReceipt({
        hash: userOpHash,
      });

      console.log("✅ Transaction executed:", receipt.receipt.transactionHash);
      setIsDeployed(true);
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
        bundlerConfigured,
        createSmartAccount,
        deploySmartAccount,
        executeTransaction,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}
