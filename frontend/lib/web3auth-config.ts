import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";

export const web3AuthConfig = {
  clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID!,
  web3AuthNetwork: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK as WEB3AUTH_NETWORK || WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  chainConfig: {
    chainNamespace: CHAIN_NAMESPACES.EIP155,
    chainId: "0x66eee", // Arbitrum Sepolia
    rpcTarget: process.env.ARBITRUM_SEPOLIA_RPC || "https://sepolia-rollup.arbitrum.io/rpc",
    displayName: "Arbitrum Sepolia",
    blockExplorerUrl: "https://sepolia.arbiscan.io",
    ticker: "ETH",
    tickerName: "Ethereum",
  },
};
