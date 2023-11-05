import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";

const DAO_CONTRACT_NAME = "DAO";

task("finishProposal", "Finish voting and execute a DAO proposal")
  .addParam("dao", "The DAO contract address")
  .addParam("proposalId", "The proposal ID to finish")
  .setAction(async ({ dao, proposalId }, { ethers }) => {
    const DAO = await ethers.getContractFactory(DAO_CONTRACT_NAME);
    const daoContract = DAO.attach(dao);

    const finishTx: ContractTransaction = await daoContract.finishProposal(proposalId);
    const finishReceipt: ContractReceipt = await finishTx.wait();

    const event = finishReceipt.events?.find(event => event.event == "ProposalFinished");
    if (!event) {
        throw new Error("Proposal finish failed");
      }

    const finishedId: BigNumber = event?.args!["proposalId"];

    console.log(`Finished proposal ${finishedId}`);
});