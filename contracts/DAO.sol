// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DAO {

    /**
     * @notice Structure for storing voting data
     */
    struct Proposal {
        //call recipient address
        address recipient;

        //voting description
        string description;

        // voting start time
        uint256 startTime;

        // voting duration
        uint256 duration;

        // positive votes
        uint256 votesFor;

        // negative votes
        uint256 votesAgainst;

        // vote execution flag
        bool executed;
    }

    // DAO chairperson's address
    address public chairperson;

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
    mapping(address => mapping(uint256 => bool)) public votes;

    // Mapping of active votes of users
    mapping(address => uint256) public activeProposals;

    // Number of created votes
    uint256 public proposalsCount;

    // Events
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event ProposalCreated(uint256 indexed proposalId, address recipient, string description);
    event Voted(address indexed voter, uint256 proposalId, bool support);
    event ProposalFinished(uint256 indexed proposalId);

    // Modifier to verify that the call is from the chairman
    modifier onlyChairperson() {
        require(msg.sender == chairperson, "Only chairperson can add proposal");
        _;
    }

    // The constructor sets the basic parameters
    constructor(address _chairperson, address _votingToken, uint256 _minQuorum, uint256 _debatePeriod) {
        chairperson = _chairperson;
        votingToken = IERC20(_votingToken);
        minQuorum = _minQuorum;
        debatePeriod = _debatePeriod;
    }

    /**
     * @notice Voting token deposit function
     */
    function deposit() external {
        require(msg.sender != address(0), "Invalid address");
        uint256 amount = votingToken.balanceOf(msg.sender);
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

        require(activeProposals[msg.sender] == 0, "Cannot withdraw while voting");

        uint256 amount = depositedTokens[msg.sender];
        depositedTokens[msg.sender] = 0;

        // результат должен быть таким => votingToken.transfer(msg.sender, amount);
        callTransferToken(address(votingToken), msg.sender, amount);
        emit Withdraw(msg.sender, amount);
    }

    /**
     * @notice _The function to add a new vote.
     */
    function addProposal(address _recipient, string calldata _description) external onlyChairperson {
        Proposal storage proposal = proposals[proposalsCount];
        proposal.recipient = _recipient;
        proposal.description = _description;
        proposal.startTime = block.timestamp;

        emit ProposalCreated(proposalsCount, _recipient, _description);

        proposalsCount++;
    }

    /**
     * @notice The function allows the user to vote.
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];

        require(depositedTokens[msg.sender] > 0, "No voting rights");
        require(block.timestamp < proposal.startTime + debatePeriod, "Voting period over");
        require(!votes[msg.sender][proposalId], "Already voted");

        votes[msg.sender][proposalId] = true;
        activeProposals[msg.sender]++;

        if(support) {
        proposal.votesFor += depositedTokens[msg.sender];
        emit Voted(msg.sender, proposalId, true);
        } else {
        proposal.votesAgainst += depositedTokens[msg.sender];
        emit Voted(msg.sender, proposalId, false);
        }
    }

    /**
     * @notice A function to finalize the vote and execute the results of the vote. 
     */
    function finishProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];

        require(block.timestamp > proposal.startTime + debatePeriod, "Voting period not over yet");
        require(!proposal.executed, "Proposal already executed");

        if(proposal.votesFor > proposal.votesAgainst && (proposal.votesFor + proposal.votesAgainst) == minQuorum) {
            proposal.executed = true;

            votes[msg.sender][proposalId] = false;
            activeProposals[msg.sender]--;

            emit ProposalFinished(proposalId);
        }
    }

    /**
     * 
     * @notice Remote 'transfer' function call from votingToken.
     */
    function callTransferToken(address _token, address _to, uint256 _amount ) internal {
        (bool success, ) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", _to,_amount));
            require(success, "Token transfer failed");
    }
}