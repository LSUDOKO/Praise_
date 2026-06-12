// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Bounty.sol";
import "./AgentDelegation.sol";

/// @title BountyFactory
/// @notice Factory contract for creating Bounty instances on Arbitrum Sepolia.
///         Each bounty is a separate contract that holds USDC.
contract BountyFactory {
    // ─── Types ───────────────────────────────────────────────────────────────

    struct BountyInfo {
        address bounty;           // Bounty contract address
        address creator;          // Creator address
        string issueURL;          // GitHub issue URL
        uint256 amount;           // Bounty amount
        uint256 contestPeriod;    // Contest period in seconds
        uint256 createdAt;        // Creation timestamp
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    IERC20 public immutable usdc;
    address public immutable agentDelegation;
    address public owner;
    uint256 public bountyCount;
    mapping(uint256 => BountyInfo) public bounties;
    mapping(address => uint256[]) public creatorBounties; // creator => bounty IDs
    mapping(string => uint256) public issueToBounty;      // issue URL => bounty ID

    // ─── Events ──────────────────────────────────────────────────────────────

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed creator,
        string issueURL,
        uint256 amount,
        address bountyAddress
    );
    event BountyFunded(
        uint256 indexed bountyId,
        address indexed funder,
        uint256 amount
    );

    // ─── Errors ──────────────────────────────────────────────────────────────

    error OnlyOwner();
    error ZeroAmount();
    error ZeroAddress();
    error BountyAlreadyExists();
    error TransferFailed();

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(address _usdc, address _agentDelegation) {
        if (_usdc == address(0)) revert ZeroAddress();
        if (_agentDelegation == address(0)) revert ZeroAddress();

        usdc = IERC20(_usdc);
        agentDelegation = _agentDelegation;
        owner = msg.sender;
    }

    // ─── External functions ──────────────────────────────────────────────────

    /// @notice Create a new bounty for a GitHub issue.
    /// @param _issueURL Full URL of the GitHub issue
    /// @param _amount USDC amount to lock as bounty reward (6 decimals)
    /// @param _contestPeriod Contest period in seconds
    /// @return bountyId The ID of the created bounty
    /// @return bountyAddress The address of the created bounty contract
    function createBounty(
        string calldata _issueURL,
        uint256 _amount,
        uint256 _contestPeriod
    ) external returns (uint256 bountyId, address bountyAddress) {
        if (_amount == 0) revert ZeroAmount();
        if (bytes(_issueURL).length == 0) revert ZeroAddress();

        // Check if bounty already exists for this issue
        if (issueToBounty[_issueURL] != 0) revert BountyAlreadyExists();

        uint256 id = bountyCount++;

        // Create the bounty contract
        Bounty newBounty = new Bounty(
            id,
            msg.sender,
            _issueURL,
            agentDelegation, // AgentDelegation is the agent that can release funds
            _contestPeriod,
            address(usdc)
        );

        bountyAddress = address(newBounty);

        // Store bounty info
        bounties[id] = BountyInfo({
            bounty: bountyAddress,
            creator: msg.sender,
            issueURL: _issueURL,
            amount: 0,
            contestPeriod: _contestPeriod,
            createdAt: block.timestamp
        });

        creatorBounties[msg.sender].push(id);
        issueToBounty[_issueURL] = id;

        // Fund the bounty
        bool success = usdc.transferFrom(msg.sender, bountyAddress, _amount);
        if (!success) revert TransferFailed();

        bounties[id].amount = _amount;

        // Grant permission to the delegation contract
        AgentDelegation(agentDelegation).grantPermission(
            bountyAddress,
            address(0), // Will be set when PR is submitted
            _amount,
            _contestPeriod + 90 days, // 90 days from contest end
            80 // Minimum AI score of 80
        );

        emit BountyCreated(id, msg.sender, _issueURL, _amount, bountyAddress);

        return (id, bountyAddress);
    }

    /// @notice Fund an existing bounty with more USDC.
    /// @param _bountyId ID of the bounty to fund
    /// @param _amount USDC amount to add
    function fundBounty(uint256 _bountyId, uint256 _amount) external {
        if (_bountyId >= bountyCount) revert ZeroAmount();
        if (_amount == 0) revert ZeroAmount();

        BountyInfo storage bountyInfo = bounties[_bountyId];
        Bounty bountyContract = Bounty(bountyInfo.bounty);

        bool success = usdc.transferFrom(msg.sender, bountyInfo.bounty, _amount);
        if (!success) revert TransferFailed();

        bountyInfo.amount += _amount;
        bountyContract.deposit(_amount);

        emit BountyFunded(_bountyId, msg.sender, _amount);
    }

    /// @notice Get bounty details.
    /// @param _bountyId ID of the bounty
    /// @return info Bounty information
    function getBounty(uint256 _bountyId) external view returns (BountyInfo memory info) {
        return bounties[_bountyId];
    }

    /// @notice Get all bounty IDs for a creator.
    /// @param _creator Creator address
    /// @return ids Array of bounty IDs
    function getCreatorBounties(address _creator) external view returns (uint256[] memory ids) {
        return creatorBounties[_creator];
    }

    /// @notice Get bounty ID for an issue URL.
    /// @param _issueURL GitHub issue URL
    /// @return bountyId Bounty ID (0 if not found)
    function getBountyByIssue(string calldata _issueURL) external view returns (uint256 bountyId) {
        return issueToBounty[_issueURL];
    }

    /// @notice Transfer ownership.
    /// @param _newOwner New owner address
    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        owner = _newOwner;
    }
}
