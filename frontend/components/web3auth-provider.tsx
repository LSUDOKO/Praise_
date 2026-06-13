"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Web3Auth } from "@web3auth/modal";
import type { IProvider } from "@web3auth/modal";

interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  isConnected: boolean;
  isInitializing: boolean;
  userInfo: any | null;
  address: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccounts: () => Promise<string[]>;
  getBalance: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  isConnected: false,
  isInitializing: true,
  userInfo: null,
  address: null,
  login: async () => {},
  logout: async () => {},
  getAccounts: async () => [],
  getBalance: async () => "0",
  signMessage: async () => "",
});

export const useWeb3Auth = () => useContext(Web3AuthContext);

export function Web3AuthProvider({ children }: { children: ReactNode }) {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;
        if (!clientId) {
          console.error("Web3Auth Client ID not configured");
          return;
        }

        // Wait for window to be fully loaded
        if (typeof window === 'undefined') {
          return;
        }

        // Initialize Web3Auth v11
        const web3authInstance = new Web3Auth({
          clientId,
          web3AuthNetwork: "sapphire_devnet",
          chains: [
            {
              chainNamespace: "eip155",
              chainId: "0x66eee", // Arbitrum Sepolia (421614)
              rpcTarget: process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
              displayName: "Arbitrum Sepolia",
              blockExplorerUrl: "https://sepolia.arbiscan.io",
              ticker: "ETH",
              tickerName: "Ethereum",
              logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
            },
          ],
          defaultChainId: "0x66eee",
          uiConfig: {
            appName: "PRaise",
            mode: "dark",
            theme: {
              primary: "#10b981",
            },
          },
        });

        // Initialize SDK
        await web3authInstance.init();

        setWeb3auth(web3authInstance);

        // Check if already connected — v11 uses connection.ethereumProvider
        if (web3authInstance.connected && web3authInstance.connection?.ethereumProvider) {
          const ethProvider = web3authInstance.connection.ethereumProvider;
          setProvider(ethProvider);
          setIsConnected(true);

          const user = await web3authInstance.getUserInfo();
          setUserInfo(user);

          // Get wallet address
          const accounts = await ethProvider.request({
            method: "eth_accounts",
          }) as string[];

          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
          }
        }

        console.log("✅ Web3Auth initialized successfully");
      } catch (error) {
        console.error("❌ Error initializing Web3Auth:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    // Delay initialization to avoid conflicts
    const timer = setTimeout(() => {
      init();
    }, 100);

    return () => clearTimeout(timer);
  }, []);    const login = async () => {
    if (!web3auth) {
      throw new Error("Web3Auth not initialized yet. Please wait a moment and try again.");
    }

    try {
      const connection = await web3auth.connect();
      if (!connection?.ethereumProvider) {
        throw new Error("No Ethereum provider available after connection");
      }

      const ethProvider = connection.ethereumProvider;
      setProvider(ethProvider);
      setIsConnected(true);

      const user = await web3auth.getUserInfo();
      setUserInfo(user);

      // Get wallet address
      const accounts = await ethProvider.request({
        method: "eth_accounts",
      }) as string[];

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        console.log("🔑 Wallet connected:", accounts[0]);
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (!web3auth) {
      return;
    }
    
    try {
      await web3auth.logout();
      setProvider(null);
      setIsConnected(false);
      setUserInfo(null);
      setAddress(null);
      console.log("👋 Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const getAccounts = async (): Promise<string[]> => {
    if (!provider) {
      return [];
    }
    
    try {
      const accounts = await provider.request({ method: "eth_accounts" }) as string[];
      return accounts || [];
    } catch (error) {
      console.error("Error getting accounts:", error);
      return [];
    }
  };

  const getBalance = async (): Promise<string> => {
    if (!provider || !address) {
      return "0";
    }
    
    try {
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      return balance as string;
    } catch (error) {
      console.error("Error getting balance:", error);
      return "0";
    }
  };

  const signMessage = async (message: string): Promise<string> => {
    if (!provider || !address) {
      throw new Error("Provider not initialized");
    }

    try {
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, address],
      });
      return signature as string;
    } catch (error) {
      console.error("Error signing message:", error);
      throw error;
    }
  };

  return (
    <Web3AuthContext.Provider
      value={{
        web3auth,
        provider,
        isConnected,
        isInitializing,
        userInfo,
        address,
        login,
        logout,
        getAccounts,
        getBalance,
        signMessage,
      }}
    >
      {children}
    </Web3AuthContext.Provider>
  );
}
