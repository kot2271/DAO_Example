import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const DAO_CONTRACT_NAME = "DAO";

task("vote", "Vote on a DAO proposal")
  .addParam("dao", "The DAO contract address")
  .addParam("proposalId", "The proposal ID")
  .addParam("support", "true = vote for, false = vote against")  
  .setAction(async ({ dao, proposalId, support }, { ethers }) => {
    const DAO = await ethers.getContractFactory(DAO_CONTRACT_NAME);
    const daoContract = DAO.attach(dao);

    const voteTx: ContractTransaction = await daoContract.vote(proposalId, support);
    const voteReceipt: ContractReceipt = await voteTx.wait();

    const event = voteReceipt.events?.find(event => event.event == "Voted");
    if (!event) {
        throw new Error("Vote failed");
    }

    const voter: Address = event?.args!["voter"];
    const propId: BigNumber = event?.args!["proposalId"];
    const voteSupport: Boolean = event?.args!["support"];

    console.log(`Voted '${voteSupport}' for proposal ${propId} from ${voter}`);

});