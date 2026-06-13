"use client";

import { useWeb3Auth } from "./web3auth-provider";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";
import { formatEther } from "viem";

export function Web3AuthLogin() {
  const { isConnected, userInfo, address, login, logout, getBalance } = useWeb3Auth();
  const [balance, setBalance] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      loadBalance();
    }
  }, [isConnected, address]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      const ethBalance = formatEther(BigInt(bal || "0"));
      setBalance(parseFloat(ethBalance).toFixed(4));
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected && userInfo && address) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={userInfo.profileImage} alt={userInfo.name} />
              <AvatarFallback>{userInfo.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{userInfo.name || "Anonymous"}</CardTitle>
              <CardDescription className="text-xs">
                {address.slice(0, 6)}...{address.slice(-4)}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {userInfo.email && (
            <div className="text-sm">
              <span className="text-muted-foreground">Email:</span>{" "}
              <span className="font-medium">{userInfo.email}</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-muted-foreground">Balance:</span>{" "}
            <span className="font-medium">{balance} ETH</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Login Type:</span>{" "}
            <Badge variant="outline">{userInfo.typeOfLogin || "Social"}</Badge>
          </div>
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Sign in with your social account to create a wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleLogin} 
          className="w-full" 
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect with Web3Auth"}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          No wallet needed • No seed phrases • Instant setup
        </p>
      </CardContent>
    </Card>
  );
}
