// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BountyRegistry.sol";
import "../src/AgentDelegation.sol";
import "../src/BountyFactory.sol";

contract DeployPRaise is Script {
    function run() external {
        // Arbitrum Sepolia USDC address
        address usdcAddress = 0x75cc4FDf07Da32Fd5a00F8B922e7d51ddA4e50B9;
        
        // Deploy with your private key
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(privateKey);
        
        // 1. Deploy BountyRegistry
        BountyRegistry registry = new BountyRegistry();
        console.log("BountyRegistry deployed at:", address(registry));
        
        // 2. Deploy AgentDelegation (relayer address from .env)
        address relayer = vm.envAddress("TRUSTED_SIGNER");
        AgentDelegation delegation = new AgentDelegation(relayer);
        console.log("AgentDelegation deployed at:", address(delegation));
        
        // 3. Deploy BountyFactory
        BountyFactory factory = new BountyFactory(usdcAddress, address(delegation));
        console.log("BountyFactory deployed at:", address(factory));
        
        // Transfer ownership of registry to factory
        registry.transferOwnership(address(factory));
        console.log("Registry ownership transferred to factory");
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("Chain: Arbitrum Sepolia (421614)");
        console.log("USDC:", usdcAddress);
        console.log("BountyRegistry:", address(registry));
        console.log("AgentDelegation:", address(delegation));
        console.log("BountyFactory:", address(factory));
        console.log("Relayer:", relayer);
        console.log("==========================\n");
    }
}
