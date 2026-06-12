// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title AgentDelegation
/// @notice Manages delegated authority for AI agents on Arbitrum Sepolia.
///         Holds permission context and validates release conditions.
contract AgentDelegation {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct Permission {
        address bounty;           // Bounty contract address
        address beneficiary;      // Contributor address (bound)
        uint256 maxAmount;        // Maximum release amount
        uint256 startTime;        // Permission start time
        uint256 endTime;          // Permission end time
        uint256 minAIScore;       // Minimum AI confidence score
        bool active;              // Whether permission is active
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    address public owner;
    address public relayer;
    mapping(address => Permission) public permissions; // bounty => permission
    mapping(address => uint256) public reputation;     // agent => reputation score

    // ─── Events ──────────────────────────────────────────────────────────────

    event PermissionGranted(
        address indexed bounty,
        address indexed beneficiary,
        uint256 maxAmount,
        uint256 endTime,
        uint256 minAIScore
    );
    event PermissionRevoked(address indexed bounty);
    event ReleaseExecuted(
        address indexed bounty,
        address indexed to,
        uint256 amount
    );
    event ReputationSlashed(address indexed agent, uint256 amount);
    event ReputationAwarded(address indexed agent, uint256 amount);

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OnlyOwner();
    error OnlyRelayer();
    error OnlyBounty();
    error PermissionExpired();
    error PermissionNotActive();
    error AmountExceeded();
    error ScoreTooLow();
    error Unauthorized();
    error ZeroAddress();
    error TransferFailed();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyRelayer() {
        if (msg.sender != relayer) revert OnlyRelayer();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _relayer) {
        if (_relayer == address(0)) revert ZeroAddress();
        owner = msg.sender;
        relayer = _relayer;
    }

    // ─── External functions ──────────────────────────────────────────────────

    /// @notice Grant permission for an agent to release funds from a bounty.
    /// @param _bounty Bounty contract address
    /// @param _beneficiary Contributor address (bound)
    /// @param _maxAmount Maximum release amount
    /// @param _duration Duration in seconds
    /// @param _minAIScore Minimum AI confidence score (0-100)
    function grantPermission(
        address _bounty,
        address _beneficiary,
        uint256 _maxAmount,
        uint256 _duration,
        uint256 _minAIScore
    ) external {
        if (_bounty == address(0)) revert ZeroAddress();
        if (_beneficiary == address(0)) revert ZeroAddress();

        permissions[_bounty] = Permission({
            bounty: _bounty,
            beneficiary: _beneficiary,
            maxAmount: _maxAmount,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            minAIScore: _minAIScore,
            active: true
        });

        emit PermissionGranted(_bounty, _beneficiary, _maxAmount, block.timestamp + _duration, _minAIScore);
    }

    /// @notice Revoke permission for a bounty. Only by owner.
    /// @param _bounty Bounty contract address
    function revokePermission(address _bounty) external onlyOwner {
        permissions[_bounty].active = false;
        emit PermissionRevoked(_bounty);
    }

    /// @notice Execute a release from a bounty. Only callable by relayer.
    /// @param _bounty Bounty contract address
    /// @param _to Contributor address
    /// @param _amount Amount to release
    /// @param _aiScore AI confidence score
    function executeRelease(
        address _bounty,
        address _to,
        uint256 _amount,
        uint256 _aiScore
    ) external onlyRelayer {
        Permission storage perm = permissions[_bounty];

        if (!perm.active) revert PermissionNotActive();
        if (block.timestamp > perm.endTime) revert PermissionExpired();
        if (_to != perm.beneficiary) revert Unauthorized();
        if (_amount > perm.maxAmount) revert AmountExceeded();
        if (_aiScore < perm.minAIScore) revert ScoreTooLow();

        // Execute the release via the bounty contract (maintains proper accounting)
        IBounty(_bounty).release(_to, _amount);

        emit ReleaseExecuted(_bounty, _to, _amount);
    }

    /// @notice Slit agent reputation for bad calls. Only by owner.
    /// @param _agent Agent address
    /// @param _amount Amount to slash
    function slashReputation(address _agent, uint256 _amount) external onlyOwner {
        if (reputation[_agent] < _amount) {
            reputation[_agent] = 0;
        } else {
            reputation[_agent] -= _amount;
        }
        emit ReputationSlashed(_agent, _amount);
    }

    /// @notice Award agent reputation for good calls. Only by owner.
    /// @param _agent Agent address
    /// @param _amount Amount to award
    function awardReputation(address _agent, uint256 _amount) external onlyOwner {
        reputation[_agent] += _amount;
        emit ReputationAwarded(_agent, _amount);
    }

    /// @notice Check if a release is allowed.
    /// @param _bounty Bounty contract address
    /// @param _to Contributor address
    /// @param _amount Amount to release
    /// @param _aiScore AI confidence score
    /// @return allowed Whether the release is allowed
    /// @return reason Reason if not allowed
    function isReleaseAllowed(
        address _bounty,
        address _to,
        uint256 _amount,
        uint256 _aiScore
    ) external view returns (bool allowed, string memory reason) {
        Permission storage perm = permissions[_bounty];

        if (!perm.active) return (false, "permission not active");
        if (block.timestamp > perm.endTime) return (false, "permission expired");
        if (_to != perm.beneficiary) return (false, "unauthorized recipient");
        if (_amount > perm.maxAmount) return (false, "amount exceeded");
        if (_aiScore < perm.minAIScore) return (false, "score too low");

        return (true, "ok");
    }

    /// @notice Get permission details.
    /// @param _bounty Bounty contract address
    /// @return perm Permission details
    function getPermission(address _bounty) external view returns (Permission memory perm) {
        return permissions[_bounty];
    }
}

/// @dev Minimal interface for Bounty contract
interface IBounty {
    function usdc() external view returns (address);
    function release(address to, uint256 amount) external;
}
