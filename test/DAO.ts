import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish } from "ethers";
import { ethers } from "hardhat";
import { encodeFunctionCall } from "web3-eth-abi";

import { DAO } from "../src/types/DAO";
import { DAO__factory } from "../src/types/factories/DAO__factory";

import { MyToken } from "../src/types/MyToken";
import{ MyToken__factory } from "../src/types/factories/MyToken__factory"

describe("DAO", () => {
    const tokenName = "MyToken";
    const tokenSymbol = "T3T";

    let daoContract: DAO;
    let myToken: MyToken;
    let signers: SignerWithAddress[];
    let chairperson: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    const INITIAL_MY_TOKENS_AMOUNT: BigNumber = ethers.utils.parseUnits("1000000", "18");

    const recipientAddress = "0x86A976e9bEC571F2f45fc9A5642d2353BDA40AF1";

    const calldata = encodeFunctionCall({
        name: 'myMethod',
        type: 'function',
        inputs: [{
            type: 'uint256',
            name: 'myNumber'
        },{
            type: 'string',
            name: 'myString'
        }]
    }, ['2345675643', 'Hello!%']);

    beforeEach(async () => {
        signers = await ethers.getSigners();
        [chairperson, user1, user2, user3] = [signers[0], signers[1], signers[2], signers[3]];
        const Token = await ethers.getContractFactory(tokenName);
        myToken = await Token.deploy(tokenName, tokenSymbol)

        const minQuorum: BigNumberish = 3;
        const debatePeriod: BigNumberish = 300;

        const daoFactory = (await ethers.getContractFactory("DAO", chairperson)) as DAO__factory;
        daoContract = await daoFactory.deploy(chairperson.address, myToken.address, minQuorum, debatePeriod);

        const thousandEther = ethers.utils.parseEther("1000");
        await myToken.transfer(user1.address, thousandEther);
        await myToken.transfer(user2.address, thousandEther);
        await myToken.transfer(user3.address, thousandEther);
    });

    describe("Initial params of token contract", async () => {

        it("Initializes name, symbol and decimals correctly", async () => {
            expect(await myToken.name()).to.equal("MyToken");
            expect(await myToken.symbol()).to.equal("T3T");
            expect(await myToken.decimals()).to.equal(18);
        });
      
        it("should have the correct owner", async () => {
            expect(await myToken.owner()).to.equal(chairperson.address);
            expect(await myToken.owner()).to.equal(chairperson.address);
        });
           
        it("should have the correct initial total supply", async () => {
            expect(await myToken.totalSupply()).to.equal(INITIAL_MY_TOKENS_AMOUNT);
        });
      
        it("should have the correct initial balance for the owner", async () => {
            const transferedTokens: BigNumber = ethers.utils.parseEther("1000").mul(3);
            const currentBalance: BigNumber = INITIAL_MY_TOKENS_AMOUNT.sub(transferedTokens) 
            expect(await myToken.balanceOf(chairperson.address)).to.equal(currentBalance);
        });
    });

    describe("Deploy", () => {

        it("should be deploy correctly", async () => {
            expect(daoContract.address).to.properAddress;
        });

        it('should initialize with correct parameters', async () => {
            const token = await new MyToken__factory(chairperson).deploy(tokenName, tokenSymbol);
            const minQuorum: BigNumberish = 11;
            const debatePeriod = 60 * 60; // 1 hour
        
            const dao = await new DAO__factory(chairperson).deploy(
              chairperson.address,
              token.address,
              minQuorum, 
              debatePeriod
            );

            const chairPersonRole = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('CHAIR_PERSON'));
        
            expect(
                await dao.hasRole(chairPersonRole, chairperson.address)
              ).to.be.true;
            expect(await dao.votingToken()).to.equal(token.address);
            expect(await dao.minQuorum()).to.equal(minQuorum);
            expect(await dao.debatePeriod()).to.equal(debatePeriod);
        
          });

        it("should be reverted with 'The debate period can be a minimum of 180 seconds.'", async () =>{
            const debatePeriod: BigNumber = BigNumber.from(100);
            const minQuorum: BigNumber = BigNumber.from(3);
            const daoFactory = (await ethers.getContractFactory("DAO", chairperson)) as DAO__factory;
            await expect(
                daoFactory.deploy(chairperson.address, myToken.address, minQuorum, debatePeriod)
                ).to.be.revertedWith("The debate period can be a minimum of 180 seconds.");
        });
    });

    describe("addProposal", () => {

        it("should be a 'chairperson' role",  async () => {
            const description = "Proposal 1";
            await expect(
                daoContract.connect(user1).addProposal(recipientAddress, description, calldata)
                ).to.be.revertedWith("Caller is not a chairperson");
        });

        it("should add proposal", async () => {
          const description = "Proposal 1";
          
          await expect(daoContract.addProposal(recipientAddress, description, calldata))
            .to.emit(daoContract, "ProposalCreated")
            .withArgs(0, recipientAddress, description);
        });

        it("should be equal proposal recipient", async () => {
            const description = "Proposal 1";
          
            await expect(
                daoContract.addProposal(recipientAddress, description, calldata)
                ).to.emit(daoContract, "ProposalCreated")
                .withArgs(0, recipientAddress, description);
            
            const proposal = await daoContract.proposals(0);
            expect(proposal.recipient).to.equal(recipientAddress);
        });

        it("should be equal proposal description", async () => {
            const description = "Proposal 1";
          
            await expect(
                daoContract.addProposal(recipientAddress, description, calldata)
                ).to.emit(daoContract, "ProposalCreated")
                .withArgs(0, recipientAddress, description);
            
            const proposal = await daoContract.proposals(0);
            expect(proposal.description).to.equal(description);
        });

        it("should be equal proposal calldataSignature", async () => {
            const description = "Proposal 1";            
          
            await expect(
                daoContract.addProposal(recipientAddress, description, calldata)
                ).to.emit(daoContract, "ProposalCreated")
                .withArgs(0, recipientAddress, description);
            
            const proposal = await daoContract.proposals(0);
            expect(proposal.calldataSignature).to.equal(calldata);
        });

        it("should be equal proposal status VotingStatus.ADDED", async () => {
            const description = "Proposal 1";
          
            await expect(
                daoContract.addProposal(recipientAddress, description, calldata)
                ).to.emit(daoContract, "ProposalCreated")
                .withArgs(0, recipientAddress, description);
            
            const proposal = await daoContract.proposals(0);
            expect(proposal.status).to.equal(1);
        });

      });

    describe("Deposit", () => {

        it("should be reverted with 'Proposal not added yet'", async () => {
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.approve(user1.address, amount);
            await expect(
                daoContract.connect(user1).deposit(amount)
                ).to.be.revertedWith("Proposal not added yet");
        });

        it("should be reverted with 'Deposit some tokens first'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            await expect(
                daoContract.connect(user1).deposit(0)
                ).to.be.revertedWith("Deposit some tokens first");
        });
        
        it("should be allow deposits", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.connect(user1).approve(daoContract.address, amount);

            await expect(
                daoContract.connect(user1).deposit(amount)
                ).to.emit(daoContract, "Deposit")
                .withArgs(user1.address, amount);

            const deposited = await daoContract.depositedTokens(user1.address);
            expect(deposited).to.equal(amount);
        });
    });

    describe("Vote", () => {

        it("should be reverted with 'No voting rights'", async () => {
          await expect(daoContract.connect(user1).vote(0, false))
          .to.be.revertedWith("No voting rights"); 
        });

        it("should be reverted with 'Already voted'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);

            await daoContract.connect(user1).vote(0, true);
            await expect(daoContract.connect(user1).vote(0, false))
            .to.be.revertedWith("Already voted"); 
        });
        
        it("should be reverted with 'Voting period over'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            await expect(daoContract.connect(user1).vote(0, true))
            .to.be.revertedWith("Voting period over"); 
        });

        it("should voteFor on proposal", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);

            // Vote for
            await expect(
                daoContract.connect(user1).vote(0, true)
                ).to.emit(daoContract, "Voted")
                .withArgs(user1.address, 0, true);
      
            const proposal = await daoContract.proposals(0);
            expect(proposal.votesFor).to.equal(1);

            const userVote = await daoContract.userVotes(user1.address, 0)
            expect(userVote).to.equal(true);

            const userVotingData = await daoContract.userVotingData(user1.address);
            const deposited = await daoContract.depositedTokens(user1.address);
            expect(userVotingData.amount).to.equal(deposited);
        });

        it("should voteAgainst on proposal", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");
            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);

            // Vote against
            await expect(
                daoContract.connect(user2).vote(0, false)
                ).to.emit(daoContract, "Voted")
                .withArgs(user2.address, 0, false);

            const userVote = await daoContract.userVotes(user2.address, 0);
            expect(userVote).to.equal(true);
      
            const proposal = await daoContract.proposals(0);
            expect(proposal.votesAgainst).to.equal(1);

            const userVotingData = await daoContract.userVotingData(user2.address);
            const deposited = await daoContract.depositedTokens(user2.address);
            expect(userVotingData.amount).to.equal(deposited);
        });

        it("should voteFor and voteAgainst on proposal together", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            // Vote for
            await daoContract.connect(user1).vote(0, true);
      
            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);
            // Vote against  
            await daoContract.connect(user2).vote(0, false);
      
            const proposal = await daoContract.proposals(0);
            expect(proposal.votesFor).to.equal(1); 
            expect(proposal.votesAgainst).to.equal(1);

            const user1Deposited = await daoContract.depositedTokens(user1.address);
            const user1VotingData = await daoContract.userVotingData(user1.address);
            expect(user1VotingData.amount).to.equal(user1Deposited);

            const user2Deposited = await daoContract.depositedTokens(user2.address);
            const user2VotingData = await daoContract.userVotingData(user2.address);
            expect(user2VotingData.amount).to.equal(user2Deposited);
            
        });
    });

    describe("Finish Proposal", () => {

        it("should be reverted with 'Voting period not over yet'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);
    
          await expect(daoContract.finishProposal(0))
          .to.be.revertedWith("Voting period not over yet");
        });

        it("should finish proposal Proposal already executed", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);
            await daoContract.connect(user2).vote(0, false);

            await myToken.connect(user3).approve(daoContract.address, amount);
            await daoContract.connect(user3).deposit(amount);
            await daoContract.connect(user3).vote(0, true);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            await expect(
                daoContract.connect(user2).finishProposal(0)
                ).to.emit(daoContract, "ProposalFinished")
                .withArgs(0);

            await expect(daoContract.finishProposal(0))
            .to.be.revertedWith("Proposal already executed");
        });

        it("should be equal proposal status VotingStatus.FINISHED", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);
            await daoContract.connect(user2).vote(0, false);

            await myToken.connect(user3).approve(daoContract.address, amount);
            await daoContract.connect(user3).deposit(amount);
            await daoContract.connect(user3).vote(0, true);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            await expect(
                daoContract.connect(user1).finishProposal(0)
                ).to.emit(daoContract, "ProposalFinished")
                .withArgs(0);

            const proposal = await daoContract.proposals(0);
            expect(proposal.status).to.equal(2); // VotingStatus.FINISHED
        });

        it("should be equal proposal status VotingStatus.REJECTED", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);
            await daoContract.connect(user2).vote(0, false);

            await myToken.connect(user3).approve(daoContract.address, amount);
            await daoContract.connect(user3).deposit(amount);
            await daoContract.connect(user3).vote(0, false);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            const minQuorum: BigNumberish = 3;
            const beforeProposal = await daoContract.proposals(0);

            await expect(
                daoContract.connect(user1).finishProposal(0)
            ).to.emit(daoContract, "ProposalRejected")
            .withArgs(0, beforeProposal.votesFor, beforeProposal.votesAgainst, minQuorum);

            const afterProposal = await daoContract.proposals(0);
            expect(afterProposal.status).to.be.equal(3); // VotingStatus.REJECTED
        });
    
    }); 

    describe("Withdraw", () => {

        it("should be reverted with 'No tokens to withdraw'", async () => {
            const deposited = await daoContract.depositedTokens(user1.address);
            expect(deposited).to.equal(0);
            await expect(daoContract.connect(user1).withdraw())
            .to.be.revertedWith("No tokens to withdraw");
        });

        it("should be reverted with 'Active voting'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            await expect(daoContract.connect(user1).withdraw())
            .to.be.revertedWith("Active voting");
        });

        it("should be reverted with 'Cannot withdraw while voting'", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            await expect(daoContract.connect(user1).withdraw())
            .to.be.revertedWith("Cannot withdraw while voting");
        });

        it("should withdraw tokens", async () => {
            const description = "Proposal 1";
            await daoContract.connect(chairperson).addProposal(recipientAddress, description, calldata);
            const amount: BigNumber = ethers.utils.parseEther("100");

            await myToken.connect(user1).approve(daoContract.address, amount);
            await daoContract.connect(user1).deposit(amount);
            await daoContract.connect(user1).vote(0, true);

            await myToken.connect(user2).approve(daoContract.address, amount);
            await daoContract.connect(user2).deposit(amount);
            await daoContract.connect(user2).vote(0, false);

            await myToken.connect(user3).approve(daoContract.address, amount);
            await daoContract.connect(user3).deposit(amount);
            await daoContract.connect(user3).vote(0, true);

            // startTime + 10 min
            await ethers.provider.send("evm_increaseTime", [10 * 60]);

            await daoContract.connect(user1).finishProposal(0);

            const deposited = await daoContract.depositedTokens(user1.address);

            await expect(
                daoContract.connect(user1).withdraw()
                ).to.emit(daoContract, "Withdraw")
                .withArgs(user1.address, deposited);
        });
    
    });
});