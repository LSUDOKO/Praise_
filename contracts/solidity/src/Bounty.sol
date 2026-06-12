// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Bounty
/// @notice USDC escrow for GitHub issue bounties on Arbitrum Sepolia.
///         Holds funds and releases them when conditions are met by the agent.
contract Bounty is Ownable {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct BountyData {
        uint256 id;
        address creator;
        string issueURL;
        string prURL;
        uint256 amount;
        address solver;
        bool paused;
        uint256 contestPeriodEnd;
        uint256 createdAt;
        uint256 aiScore;
        bool prMerged;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public agent;
    BountyData public bounty;
    uint256 public immutable bountyId;

    // ─── Events ──────────────────────────────────────────────────────────────

    event Deposited(address indexed from, uint256 amount);
    event Released(address indexed to, uint256 amount);
    event Reclaimed(address indexed to, uint256 amount);
    event Paused(address indexed by);
    event Unpaused(address indexed by);
    event PRMerged(string prURL, address solver);
    event AIScoreSubmitted(uint256 score);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OnlyAgent();
    error OnlyRelayer();
    error ZeroAmount();
    error BountyNotFound();
    error BountyNotOpen();
    error BountyNotSubmitted();
    error TransferFailed();
    error ZeroAddress();
    error BountyPaused();
    error ContestPeriodNotElapsed();
    error InsufficientFunds();
    error Unauthorized();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyAgent() {
        if (msg.sender != agent) revert OnlyAgent();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        uint256 _bountyId,
        address _creator,
        string memory _issueURL,
        address _agent,
        uint256 _contestPeriod,
        address _usdc
    ) Ownable(msg.sender) {
        if (_creator == address(0)) revert ZeroAddress();
        if (_agent == address(0)) revert ZeroAddress();
        if (_usdc == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        agent = _agent;
        bountyId = _bountyId;

        bounty = BountyData({
            id: _bountyId,
            creator: _creator,
            issueURL: _issueURL,
            prURL: "",
            amount: 0,
            solver: address(0),
            paused: false,
            contestPeriodEnd: block.timestamp + _contestPeriod,
            createdAt: block.timestamp,
            aiScore: 0,
            prMerged: false
        });
    }

    // ─── External functions ──────────────────────────────────────────────────

    /// @notice Fund the bounty with USDC.
    /// @param _amount USDC amount to lock as bounty reward (6 decimals)
    function deposit(uint256 _amount) external onlyOwner {
        if (_amount == 0) revert ZeroAmount();

        bool success = usdc.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TransferFailed();

        bounty.amount += _amount;
        emit Deposited(msg.sender, _amount);
    }

    /// @notice Release funds to the contributor. Only callable by the agent.
    /// @param to Address of the contributor
    /// @param releaseAmount Amount to release
    function release(address to, uint256 releaseAmount) external onlyAgent {
        if (bounty.paused) revert BountyPaused();
        if (block.timestamp < bounty.contestPeriodEnd) revert ContestPeriodNotElapsed();
        if (releaseAmount > bounty.amount) revert InsufficientFunds();
        if (to == address(0)) revert ZeroAddress();

        bounty.amount -= releaseAmount;
        bounty.solver = to;

        bool success = usdc.transfer(to, releaseAmount);
        if (!success) revert TransferFailed();

        emit Released(to, releaseAmount);
    }

    /// @notice Reclaim funds if bounty expires unclaimed. Only by creator after 365 days.
    function reclaim() external {
        if (msg.sender != bounty.creator) revert Unauthorized();
        if (block.timestamp <= bounty.contestPeriodEnd + 365 days) revert ContestPeriodNotElapsed();

        uint256 bal = bounty.amount;
        bounty.amount = 0;

        bool success = usdc.transfer(bounty.creator, bal);
        if (!success) revert TransferFailed();

        emit Reclaimed(bounty.creator, bal);
    }

    /// @notice Pause the bounty. Only by creator.
    function pause() external {
        if (msg.sender != bounty.creator) revert Unauthorized();
        bounty.paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpause the bounty. Only by creator.
    function unpause() external {
        if (msg.sender != bounty.creator) revert Unauthorized();
        bounty.paused = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Submit a PR as a solution. Only callable by relayer.
    /// @param prURL Full URL of the GitHub PR
    /// @param solver Address of the developer who submitted the PR
    function submitSolution(string calldata prURL, address solver) external {
        if (solver == address(0)) revert ZeroAddress();

        bounty.solver = solver;
        bounty.prURL = prURL;

        emit PRMerged(prURL, solver);
    }

    /// @notice Submit AI score for the PR. Only callable by oracle/agent.
    /// @param score AI confidence score (0-100)
    function submitAIScore(uint256 score) external onlyAgent {
        bounty.aiScore = score;
        emit AIScoreSubmitted(score);
    }

    /// @notice Check if bounty is releasable.
    /// @return isReleasable Whether the bounty can be released
    /// @return reason Reason if not releasable
    function isReleasable() external view returns (bool isReleasable, string memory reason) {
        if (bounty.paused) return (false, "paused");
        if (block.timestamp < bounty.contestPeriodEnd) return (false, "contest period");
        if (bounty.amount == 0) return (false, "no funds");
        return (true, "ok");
    }

    /// @notice Get bounty details.
    /// @return id Bounty ID
    /// @return creator Bounty creator address
    /// @return issueURL GitHub issue URL
    /// @return prURL GitHub PR URL
    /// @return amount Bounty amount in USDC
    /// @return solver Contributor address
    /// @return paused Whether bounty is paused
    /// @return contestPeriodEnd Contest period end timestamp
    /// @return createdAt Creation timestamp
    /// @return aiScore AI confidence score
    /// @return prMerged Whether PR is merged
    function getBounty() external view returns (
        uint256 id,
        address creator,
        string memory issueURL,
        string memory prURL,
        uint256 amount,
        address solver,
        bool paused,
        uint256 contestPeriodEnd,
        uint256 createdAt,
        uint256 aiScore,
        bool prMerged
    ) {
        return (
            bounty.id,
            bounty.creator,
            bounty.issueURL,
            bounty.prURL,
            bounty.amount,
            bounty.solver,
            bounty.paused,
            bounty.contestPeriodEnd,
            bounty.createdAt,
            bounty.aiScore,
            bounty.prMerged
        );
    }
}
