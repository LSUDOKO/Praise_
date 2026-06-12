// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title BountyRegistry
/// @notice Registry for looking up bounties by repo, issue, or PR on Arbitrum Sepolia.
///         Provides indexed access to all bounties created through the factory.
contract BountyRegistry {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct BountyRecord {
        uint256 bountyId;         // Bounty ID
        address bounty;           // Bounty contract address
        string repo;              // GitHub repository (owner/repo)
        uint256 issueNumber;      // GitHub issue number
        string issueURL;          // Full issue URL
        uint256 prNumber;         // GitHub PR number (0 if not submitted)
        string prURL;             // Full PR URL
        address creator;          // Creator address
        address solver;           // Contributor address (address(0) if not assigned)
        uint256 amount;           // Bounty amount
        uint8 status;             // 0=Open, 1=Submitted, 2=Approved, 3=Rejected
        uint256 createdAt;        // Creation timestamp
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    address public owner;
    mapping(uint256 => BountyRecord) public bounties; // bountyId => record
    mapping(string => uint256[]) public repoBounties; // repo => bounty IDs
    mapping(string => uint256) public issueBounties;  // issue URL => bounty ID
    mapping(string => uint256) public prBounties;     // PR URL => bounty ID
    mapping(address => uint256[]) public userBounties; // user => bounty IDs they created
    uint256 public registryCount;

    // ─── Events ──────────────────────────────────────────────────────────────

    event BountyRegistered(
        uint256 indexed bountyId,
        address indexed bounty,
        string repo,
        uint256 issueNumber,
        address creator
    );
    event BountyUpdated(
        uint256 indexed bountyId,
        uint8 status,
        address solver
    );

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OnlyOwner();
    error ZeroAddress();
    error BountyAlreadyRegistered();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── External functions ──────────────────────────────────────────────────

    /// @notice Register a new bounty in the registry.
    /// @param _bountyId Bounty ID
    /// @param _bounty Bounty contract address
    /// @param _repo GitHub repository (owner/repo)
    /// @param _issueNumber GitHub issue number
    /// @param _issueURL Full issue URL
    /// @param _creator Creator address
    /// @param _amount Bounty amount
    function registerBounty(
        uint256 _bountyId,
        address _bounty,
        string calldata _repo,
        uint256 _issueNumber,
        string calldata _issueURL,
        address _creator,
        uint256 _amount
    ) external onlyOwner {
        if (_bounty == address(0)) revert ZeroAddress();
        if (_creator == address(0)) revert ZeroAddress();

        string memory issueKey = _issueURL;
        if (bytes(issueKey).length > 0 && issueBounties[issueKey] != 0) {
            revert BountyAlreadyRegistered();
        }

        bounties[_bountyId] = BountyRecord({
            bountyId: _bountyId,
            bounty: _bounty,
            repo: _repo,
            issueNumber: _issueNumber,
            issueURL: _issueURL,
            prNumber: 0,
            prURL: "",
            creator: _creator,
            solver: address(0),
            amount: _amount,
            status: 0, // Open
            createdAt: block.timestamp
        });

        repoBounties[_repo].push(_bountyId);
        if (bytes(issueKey).length > 0) {
            issueBounties[issueKey] = _bountyId;
        }
        userBounties[_creator].push(_bountyId);
        registryCount++;

        emit BountyRegistered(_bountyId, _bounty, _repo, _issueNumber, _creator);
    }

    /// @notice Update bounty status when PR is submitted.
    /// @param _bountyId Bounty ID
    /// @param _prNumber GitHub PR number
    /// @param _prURL Full PR URL
    /// @param _solver Contributor address
    function submitPR(
        uint256 _bountyId,
        uint256 _prNumber,
        string calldata _prURL,
        address _solver
    ) external onlyOwner {
        BountyRecord storage record = bounties[_bountyId];
        record.prNumber = _prNumber;
        record.prURL = _prURL;
        record.solver = _solver;
        record.status = 1; // Submitted

        prBounties[_prURL] = _bountyId;

        emit BountyUpdated(_bountyId, 1, _solver);
    }

    /// @notice Update bounty status when resolved.
    /// @param _bountyId Bounty ID
    /// @param _approved Whether the PR was approved
    function resolveBounty(uint256 _bountyId, bool _approved) external onlyOwner {
        BountyRecord storage record = bounties[_bountyId];
        record.status = _approved ? 2 : 3; // Approved or Rejected

        emit BountyUpdated(_bountyId, record.status, record.solver);
    }

    /// @notice Get bounty details.
    /// @param _bountyId Bounty ID
    /// @return record Bounty record
    function getBounty(uint256 _bountyId) external view returns (BountyRecord memory record) {
        return bounties[_bountyId];
    }

    /// @notice Get all bounties for a repository.
    /// @param _repo GitHub repository (owner/repo)
    /// @return ids Array of bounty IDs
    function getRepoBounties(string calldata _repo) external view returns (uint256[] memory ids) {
        return repoBounties[_repo];
    }

    /// @notice Get bounty ID for an issue URL.
    /// @param _issueURL Full issue URL
    /// @return bountyId Bounty ID (0 if not found)
    function getBountyByIssue(string calldata _issueURL) external view returns (uint256 bountyId) {
        return issueBounties[_issueURL];
    }

    /// @notice Get bounty ID for a PR URL.
    /// @param _prURL Full PR URL
    /// @return bountyId Bounty ID (0 if not found)
    function getBountyByPR(string calldata _prURL) external view returns (uint256 bountyId) {
        return prBounties[_prURL];
    }

    /// @notice Get all bounties created by a user.
    /// @param _user User address
    /// @return ids Array of bounty IDs
    function getUserBounties(address _user) external view returns (uint256[] memory ids) {
        return userBounties[_user];
    }

    /// @notice Get total number of registered bounties.
    /// @return count Total bounty count
    function getTotalBounties() external view returns (uint256 count) {
        return registryCount;
    }

    /// @notice Transfer ownership.
    /// @param _newOwner New owner address
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        owner = _newOwner;
    }
}
