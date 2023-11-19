// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract DAO is AccessControl {
    // Create a new role identifier for the chairperson role
    bytes32 public constant CHAIR_PERSON = keccak256("CHAIR_PERSON");

    // Create an enum named VotingStatus containing possible voting status options
    enum VotingStatus {
        UNDEFINED,
        ADDED,
        FINISHED,
        REJECTED
    }

    /**
     * @notice Structure for storing voting data
     */
    struct Proposal {
        // calldata signatures of the called method
        bytes calldataSignature;
        //call recipient address
        address recipient;
        //voting description
        string description;
        // voting start time
        uint256 startTime;
        // positive votes
        uint256 votesFor;
        // negative votes
        uint256 votesAgainst;
        // vote execution status
        VotingStatus status;
    }

    /**
     * @notice Structure for user voting data
     */
    struct UserVotingData {
        uint256 amount;
        uint256 proposalEndTime;
    }

    // Voting token
    IERC20 public votingToken;

    // Minimum quorum of votes to accept a voting result
    uint256 public minQuorum;

    // Voting time in seconds
    uint256 public debatePeriod;

    // Mapping of users' deposits
    mapping(address => uint256) public depositedTokens;

    // Voting mapping
    mapping(uint256 => Proposal) public proposals;

    // Mapping user votes by voting
    mapping(address => mapping(uint256 => bool)) public userVotes;

    // Mapping of active votes of users
    mapping(address => uint256) public activeProposals;

    // Number of created votes
    uint256 public proposalsCount;

    // Mapping for storing user voting data
    mapping(address => UserVotingData) public userVotingData;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address recipient,
        string description
    );
    event Voted(address indexed voter, uint256 proposalId, bool support);
    event ProposalFinished(uint256 indexed proposalId);
    event ProposalRejected(
        uint256 indexed proposalId,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 minQuorum
    );

    // The constructor sets the basic parameters
    constructor(
        address chairperson,
        address _votingToken,
        uint256 _minQuorum,
        uint256 _debatePeriod
    ) {
        _grantRole(CHAIR_PERSON, chairperson);
        votingToken = IERC20(_votingToken);
        minQuorum = _minQuorum;
        require(
            _debatePeriod >= 180 seconds,
            "The debate period can be a minimum of 180 seconds."
        );
        debatePeriod = _debatePeriod;
    }

    /**
     * @notice Voting token deposit function
     */
    function deposit(uint256 amount) external {
        require(msg.sender != address(0), "Invalid address");
        require(amount > 0, "Deposit some tokens first");
        require(proposalsCount > 0, "Proposal not added yet");

        depositedTokens[msg.sender] += amount;
        votingToken.transferFrom(msg.sender, address(this), amount);

        emit Deposit(msg.sender, amount);
    }

    /**
     * @notice A function to withdraw tokens after the voting is completed.
     */
    function withdraw() external {
        require(msg.sender != address(0), "Invalid address");
        require(depositedTokens[msg.sender] > 0, "No tokens to withdraw");
        require(
            block.timestamp > userVotingData[msg.sender].proposalEndTime,
            "Active voting"
        );
        require(
            activeProposals[msg.sender] == 0,
            "Cannot withdraw while voting"
        );

        uint256 amount = depositedTokens[msg.sender];
        depositedTokens[msg.sender] = 0;

        require(
            votingToken.transfer(msg.sender, amount),
            "T3T token transfer failed"
        );
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice The function to add a new vote.
     */
    function addProposal(
        address _recipient,
        string calldata _description,
        bytes calldata _calldataSignature
    ) external {
        require(
            hasRole(CHAIR_PERSON, msg.sender),
            "Caller is not a chairperson"
        );
        Proposal storage proposal = proposals[proposalsCount];
        proposal.recipient = _recipient;
        proposal.description = _description;
        proposal.startTime = block.timestamp;
        proposal.calldataSignature = _calldataSignature;
        proposal.status = VotingStatus.ADDED;

        emit ProposalCreated(proposalsCount, _recipient, _description);

        proposalsCount++;
    }

    /**
     * @notice The function allows the user to vote.
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        uint256 proposalEndTime = proposal.startTime + debatePeriod;

        require(depositedTokens[msg.sender] > 0, "No voting rights");
        require(block.timestamp < proposalEndTime, "Voting period over");
        require(!userVotes[msg.sender][proposalId], "Already voted");

        userVotingData[msg.sender].amount = depositedTokens[msg.sender];

        if (userVotingData[msg.sender].proposalEndTime < proposalEndTime) {
            userVotingData[msg.sender].proposalEndTime = proposalEndTime;
        }

        userVotes[msg.sender][proposalId] = true;
        activeProposals[msg.sender]++;

        if (support) {
            proposal.votesFor++;
            emit Voted(msg.sender, proposalId, true);
        } else {
            proposal.votesAgainst++;
            emit Voted(msg.sender, proposalId, false);
        }
    }

    /**
     * @notice A function to finalize the vote and execute the results of the vote.
     */
    function finishProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(
            block.timestamp > proposal.startTime + debatePeriod,
            "Voting period not over yet"
        );
        require(
            proposal.status != VotingStatus.FINISHED,
            "Proposal already executed"
        );

        if (
            proposal.votesFor > proposal.votesAgainst &&
            (proposal.votesFor + proposal.votesAgainst) >= minQuorum
        ) {
            proposal.status = VotingStatus.FINISHED;

            userVotes[msg.sender][proposalId] = false;
            activeProposals[msg.sender]--;

            // Call the recipient with the calldata of the proposal
            (bool success, ) = proposal.recipient.call(
                proposal.calldataSignature
            );
            require(success, "Call failed");

            emit ProposalFinished(proposalId);
        } else {
            proposal.status = VotingStatus.REJECTED;
            emit ProposalRejected(
                proposalId,
                proposal.votesFor,
                proposal.votesAgainst,
                minQuorum
            );
        }
    }
}
