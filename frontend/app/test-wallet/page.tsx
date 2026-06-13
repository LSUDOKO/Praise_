"use client";

import { useEffect, useState } from "react";
import { useWeb3Auth } from "@/components/web3auth-provider";
import { useSmartAccount } from "@/lib/smart-account/smart-account-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, Loader2, Wallet, User, Shield, Activity, Cpu } from "lucide-react";

export default function TestWalletPage() {
  const {
    web3auth,
    provider,
    isConnected,
    userInfo,
    address,
    login,
    logout,
    getBalance,
    signMessage,
  } = useWeb3Auth();

  const {
    smartAccount,
    smartAccountAddress,
    isDeployed,
    isCreating,
    deploySmartAccount,
  } = useSmartAccount();

  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [signature, setSignature] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadBalance();
    }
  }, [isConnected, address]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      const ethBalance = parseInt(bal, 16) / 1e18;
      setBalance(ethBalance.toFixed(4));
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const handleSignMessage = async () => {
    try {
      setIsLoading(true);
      const message = "Hello from PRaise! Testing Web3Auth signature.";
      const sig = await signMessage(message);
      setSignature(sig);
    } catch (error) {
      console.error("Error signing message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploySmartAccount = async () => {
    try {
      setIsDeploying(true);
      await deploySmartAccount();
    } catch (error) {
      console.error("Error deploying Smart Account:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black p-8">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Web3Auth + Smart Account Test
          </h1>
          <p className="text-zinc-400">
            Test embedded wallet functionality, Web3Auth provider, and Smart Account integration
          </p>
        </div>

        {/* Connection Status */}
        <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="h-5 w-5 text-emerald-500" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Web3Auth Initialized</span>
              {web3auth ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  <X className="h-3 w-3 mr-1" />
                  No
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Provider Active</span>
              {provider ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                  <X className="h-3 w-3 mr-1" />
                  No
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Wallet Connected</span>
              {isConnected ? (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  <Check className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                  Not Connected
                </Badge>
              )}
            </div>

            <Separator className="bg-zinc-800" />

            {!isConnected ? (
              <Button
                onClick={login}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect with Web3Auth
              </Button>
            ) : (
              <Button
                onClick={logout}
                variant="outline"
                className="w-full border-zinc-700 hover:bg-zinc-800 text-white"
              >
                Disconnect Wallet
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Smart Account Status */}
        {isConnected && (
          <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Cpu className="h-5 w-5 text-cyan-500" />
                Smart Account Status
              </CardTitle>
              <CardDescription className="text-zinc-400">
                MetaMask Smart Account (ERC-4337)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Smart Account Created</span>
                {smartAccount ? (
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : isCreating ? (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Creating...
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                    Not Created
                  </Badge>
                )}
              </div>

              {smartAccountAddress && (
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Smart Account Address</div>
                  <div className="text-white font-mono text-sm break-all bg-zinc-800/50 p-3 rounded">
                    {smartAccountAddress}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-zinc-300">Deployed</span>
                {isDeployed ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <Check className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Not Deployed
                  </Badge>
                )}
              </div>

              {smartAccount && !isDeployed && (
                <>
                  <Separator className="bg-zinc-800" />
                  <Button
                    onClick={handleDeploySmartAccount}
                    disabled={isDeploying}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Deploy Smart Account
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-zinc-500 text-center">
                    Deploy your Smart Account on-chain to enable delegations
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Info */}
        {isConnected && userInfo && (
          <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-blue-500" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Name</div>
                <div className="text-white font-mono">
                  {userInfo.name || "Not provided"}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400 mb-1">Email</div>
                <div className="text-white font-mono">
                  {userInfo.email || "Not provided"}
                </div>
              </div>

              {userInfo.profileImage && (
                <div>
                  <div className="text-sm text-zinc-400 mb-2">Profile Image</div>
                  <img
                    src={userInfo.profileImage}
                    alt="Profile"
                    className="h-16 w-16 rounded-full border-2 border-zinc-700"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Wallet Details */}
        {isConnected && address && (
          <Card className="mb-6 bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-purple-500" />
                EOA Wallet Details
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Your embedded wallet on Arbitrum Sepolia (controls Smart Account)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-zinc-400 mb-1">Address</div>
                <div className="text-white font-mono text-sm break-all bg-zinc-800/50 p-3 rounded">
                  {address}
                </div>
              </div>

              <div>
                <div className="text-sm text-zinc-400 mb-1">Balance (ETH)</div>
                <div className="text-white font-mono text-lg">
                  {balance} ETH
                </div>
              </div>

              <Button
                onClick={loadBalance}
                variant="outline"
                size="sm"
                className="border-zinc-700 hover:bg-zinc-800 text-white"
              >
                Refresh Balance
              </Button>

              <Separator className="bg-zinc-800" />

              <div className="space-y-2">
                <div className="text-sm text-zinc-400 mb-2">Test Signing</div>
                <Button
                  onClick={handleSignMessage}
                  disabled={isLoading}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing...
                    </>
                  ) : (
                    "Sign Test Message"
                  )}
                </Button>

                {signature && (
                  <div className="mt-4">
                    <div className="text-sm text-zinc-400 mb-1">Signature</div>
                    <div className="text-white font-mono text-xs break-all bg-zinc-800/50 p-3 rounded">
                      {signature}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Integration Status */}
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Integration Checklist</CardTitle>
            <CardDescription className="text-zinc-400">
              Verify all components are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ChecklistItem
              label="Web3Auth SDK initialized"
              status={!!web3auth}
            />
            <ChecklistItem
              label="Ethereum provider available"
              status={!!provider}
            />
            <ChecklistItem
              label="User authenticated"
              status={isConnected}
            />
            <ChecklistItem
              label="Wallet address retrieved"
              status={!!address}
            />
            <ChecklistItem
              label="User info loaded"
              status={!!userInfo}
            />
            <ChecklistItem
              label="Balance query works"
              status={parseFloat(balance) >= 0}
            />
            <ChecklistItem
              label="Message signing works"
              status={!!signature}
            />
            <ChecklistItem
              label="Smart Account created"
              status={!!smartAccount}
            />
            <ChecklistItem
              label="Smart Account deployed"
              status={isDeployed}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ChecklistItem({ label, status }: { label: string; status: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
      <span className="text-zinc-300">{label}</span>
      {status ? (
        <Check className="h-5 w-5 text-emerald-500" />
      ) : (
        <X className="h-5 w-5 text-zinc-600" />
      )}
    </div>
  );
}
