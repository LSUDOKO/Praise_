// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {Bounty} from "../src/Bounty.sol";
import {AgentDelegation} from "../src/AgentDelegation.sol";
import {BountyFactory} from "../src/BountyFactory.sol";
import {BountyRegistry} from "../src/BountyRegistry.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract PRaiseTest is Test {
    MockUSDC public usdc;
    BountyFactory public factory;
    AgentDelegation public delegation;
    BountyRegistry public registry;

    address public owner = address(this);
    address public relayerAddr = makeAddr("relayer");
    address public creator = makeAddr("creator");
    address public solver = makeAddr("solver");
    address public attacker = makeAddr("attacker");

    string constant ISSUE_URL = "https://github.com/org/repo/issues/42";
    string constant PR_URL = "https://github.com/org/repo/pull/43";
    uint256 constant REWARD = 500e6; // 500 USDC
    uint256 constant CONTEST_PERIOD = 7 days;

    function setUp() public {
        usdc = new MockUSDC();
        delegation = new AgentDelegation(relayerAddr);
        registry = new BountyRegistry();
        factory = new BountyFactory(address(usdc), address(delegation));

        // Mint USDC to creator
        usdc.mint(creator, 100_000e6);

        // Approve factory to spend creator's USDC
        vm.prank(creator);
        usdc.approve(address(factory), type(uint256).max);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function _createBounty() internal returns (uint256 bountyId, address bountyAddress) {
        (bountyId, bountyAddress) = factory.createBounty(ISSUE_URL, REWARD, CONTEST_PERIOD);
    }

    // ─── Bounty.sol Tests ───────────────────────────────────────────────────

    function test_Bounty_Creation() public {
        (uint256 id, address bountyAddr) = _createBounty();
        
        Bounty bounty = Bounty(bountyAddr);
        assertEq(bounty.bountyId(), id);
        assertEq(bounty.agent(), address(delegation));
    }

    function test_Bounty_Deposit() public {
        (, address bountyAddr) = _createBounty();
        
        Bounty bounty = Bounty(bountyAddr);
        (,,,,uint256 amount,,, ) = bounty.getBounty();
        assertEq(amount, REWARD);
    }

    function test_Bounty_Release_ThroughDelegation() public {
        (, address bountyAddr) = _createBounty();
        
        // Fast forward past contest period
        vm.warp(block.timestamp + CONTEST_PERIOD + 1);
        
        // Grant permission to release
        delegation.grantPermission(
            bountyAddr,
            solver,
            REWARD,
            90 days,
            80
        );
        
        // Relayer executes release
        vm.prank(relayerAddr);
        delegation.executeRelease(bountyAddr, solver, REWARD, 85);
        
        // Check solver received USDC
        assertEq(usdc.balanceOf(solver), REWARD);
    }

    function test_Bounty_Pause() public {
        (, address bountyAddr) = _createBounty();
        
        Bounty bounty = Bounty(bountyAddr);
        
        // Creator pauses
        vm.prank(creator);
        bounty.pause();
        
        (,,,,,,, bool paused,,) = bounty.getBounty();
        assertTrue(paused);
    }

    function test_Bounty_Unpause() public {
        (, address bountyAddr) = _createBounty();
        
        Bounty bounty = Bounty(bountyAddr);
        
        vm.prank(creator);
        bounty.pause();
        
        vm.prank(creator);
        bounty.unpause();
        
        (,,,,,,, bool paused,,) = bounty.getBounty();
        assertFalse(paused);
    }

    // ─── AgentDelegation.sol Tests ──────────────────────────────────────────

    function test_Delegation_GrantPermission() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(
            bountyAddr,
            solver,
            REWARD,
            90 days,
            80
        );
        
        (
            address storedBounty,
            address storedBeneficiary,
            uint256 storedMaxAmount,
            ,
            uint256 storedEndTime,
            uint256 storedMinAIScore,
            bool active,
        ) = delegation.getPermission(bountyAddr);
        
        assertEq(storedBounty, bountyAddr);
        assertEq(storedBeneficiary, solver);
        assertEq(storedMaxAmount, REWARD);
        assertEq(storedMinAIScore, 80);
        assertTrue(active);
        assertGt(storedEndTime, block.timestamp);
    }

    function test_Delegation_RevokePermission() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        delegation.revokePermission(bountyAddr);
        
        (,,,,,, bool active) = delegation.getPermission(bountyAddr);
        assertFalse(active);
    }

    function test_Delegation_ExecuteRelease_OnlyRelayer() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        
        vm.prank(attacker);
        vm.expectRevert(AgentDelegation.OnlyRelayer.selector);
        delegation.executeRelease(bountyAddr, solver, REWARD, 85);
    }

    function test_Delegation_ExecuteRelease_PermissionExpired() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 1 days, 80);
        
        // Fast forward past permission expiry
        vm.warp(block.timestamp + 2 days);
        
        vm.prank(relayerAddr);
        vm.expectRevert(AgentDelegation.PermissionExpired.selector);
        delegation.executeRelease(bountyAddr, solver, REWARD, 85);
    }

    function test_Delegation_ExecuteRelease_ScoreTooLow() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        
        vm.prank(relayerAddr);
        vm.expectRevert(AgentDelegation.ScoreTooLow.selector);
        delegation.executeRelease(bountyAddr, solver, REWARD, 70);
    }

    function test_Delegation_ExecuteRelease_AmountExceeded() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        
        vm.prank(relayerAddr);
        vm.expectRevert(AgentDelegation.AmountExceeded.selector);
        delegation.executeRelease(bountyAddr, solver, REWARD + 1, 85);
    }

    function test_Delegation_ExecuteRelease_UnauthorizedRecipient() public {
        (, address bountyAddr) = _createBounty();
        
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        
        vm.prank(relayerAddr);
        vm.expectRevert(AgentDelegation.Unauthorized.selector);
        delegation.executeRelease(bountyAddr, attacker, REWARD, 85);
    }

    function test_Delegation_Reputation() public {
        address agent = makeAddr("agent");
        
        delegation.awardReputation(agent, 100);
        assertEq(delegation.reputation(agent), 100);
        
        delegation.slashReputation(agent, 30);
        assertEq(delegation.reputation(agent), 70);
    }

    // ─── BountyFactory.sol Tests ────────────────────────────────────────────

    function test_Factory_CreateBounty() public {
        (uint256 id, address bountyAddr) = _createBounty();
        
        assertEq(id, 0);
        assertTrue(bountyAddr != address(0));
        
        (
            address storedBounty,
            address storedCreator,
            string memory storedIssueURL,
            uint256 storedAmount,
            ,
            ,
        ) = factory.getBounty(id);
        
        assertEq(storedBounty, bountyAddr);
        assertEq(storedCreator, creator);
        assertEq(storedIssueURL, ISSUE_URL);
        assertEq(storedAmount, REWARD);
    }

    function test_Factory_BountyCount() public {
        assertEq(factory.bountyCount(), 0);
        _createBounty();
        assertEq(factory.bountyCount(), 1);
        _createBounty();
        assertEq(factory.bountyCount(), 2);
    }

    function test_Factory_GetBountyByIssue() public {
        _createBounty();
        
        uint256 bountyId = factory.getBountyByIssue(ISSUE_URL);
        assertEq(bountyId, 0);
    }

    function test_Factory_GetCreatorBounties() public {
        _createBounty();
        _createBounty();
        
        uint256[] memory bounties = factory.getCreatorBounties(creator);
        assertEq(bounties.length, 2);
    }

    function test_Factory_FundBounty() public {
        (uint256 id,) = _createBounty();
        
        // Fund additional amount
        vm.prank(creator);
        factory.fundBounty(id, 200e6);
        
        (,,,,uint256 amount,,) = factory.getBounty(id);
        assertEq(amount, REWARD + 200e6);
    }

    // ─── BountyRegistry.sol Tests ──────────────────────────────────────────

    function test_Registry_RegisterBounty() public {
        (uint256 id, address bountyAddr) = _createBounty();
        
        registry.registerBounty(
            id,
            bountyAddr,
            "org/repo",
            42,
            ISSUE_URL,
            creator,
            REWARD
        );
        
        (
            uint256 storedBountyId,
            address storedBounty,
            string memory storedRepo,
            uint256 storedIssueNumber,
            string memory storedIssueURL,
            ,
            ,
            address storedCreator,
            ,
            uint256 storedAmount,
            uint8 status,
            ,
        ) = registry.getBounty(id);
        
        assertEq(storedBountyId, id);
        assertEq(storedBounty, bountyAddr);
        assertEq(storedRepo, "org/repo");
        assertEq(storedIssueNumber, 42);
        assertEq(storedIssueURL, ISSUE_URL);
        assertEq(storedCreator, creator);
        assertEq(storedAmount, REWARD);
        assertEq(status, 0); // Open
    }

    function test_Registry_SubmitPR() public {
        (uint256 id,) = _createBounty();
        
        registry.registerBounty(id, address(0), "org/repo", 42, ISSUE_URL, creator, REWARD);
        registry.submitPR(id, 43, PR_URL, solver);
        
        (,,,,,,,address storedSolver, uint256 prNumber, uint8 status,) = registry.getBounty(id);
        assertEq(storedSolver, solver);
        assertEq(prNumber, 43);
        assertEq(status, 1); // Submitted
    }

    function test_Registry_ResolveBounty() public {
        (uint256 id,) = _createBounty();
        
        registry.registerBounty(id, address(0), "org/repo", 42, ISSUE_URL, creator, REWARD);
        registry.submitPR(id, 43, PR_URL, solver);
        registry.resolveBounty(id, true);
        
        (,,,,,,, , , uint8 status,) = registry.getBounty(id);
        assertEq(status, 2); // Approved
    }

    function test_Registry_GetTotalBounties() public {
        assertEq(registry.getTotalBounties(), 0);
        
        (uint256 id,) = _createBounty();
        registry.registerBounty(id, address(0), "org/repo", 42, ISSUE_URL, creator, REWARD);
        
        assertEq(registry.getTotalBounties(), 1);
    }

    // ─── Integration Tests ─────────────────────────────────────────────────

    function test_FullFlow_CreateFundSubmitRelease() public {
        // 1. Create bounty
        (uint256 id, address bountyAddr) = _createBounty();
        
        // 2. Register in registry
        registry.registerBounty(id, bountyAddr, "org/repo", 42, ISSUE_URL, creator, REWARD);
        
        // 3. Submit PR
        registry.submitPR(id, 43, PR_URL, solver);
        
        // 4. Grant permission
        delegation.grantPermission(bountyAddr, solver, REWARD, 90 days, 80);
        
        // 5. Fast forward past contest period
        vm.warp(block.timestamp + CONTEST_PERIOD + 1);
        
        // 6. Relayer executes release
        vm.prank(relayerAddr);
        delegation.executeRelease(bountyAddr, solver, REWARD, 85);
        
        // 7. Verify solver received USDC
        assertEq(usdc.balanceOf(solver), REWARD);
        
        // 8. Verify bounty is empty
        (,,,,uint256 amount,,, ) = Bounty(bountyAddr).getBounty();
        assertEq(amount, 0);
    }
}
