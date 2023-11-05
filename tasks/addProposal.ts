import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';
import { encodeFunctionCall } from "web3-eth-abi";

const DAO_CONTRACT_NAME = "DAO"; 

task("addProposal", "Adds a new proposal to the DAO")
  .addParam("dao", "The DAO contract address")
  .addParam("recipient", "The recipient of the proposal")
  .addParam("description", "The proposal description")
  .setAction(async ({ dao, recipient, description }, { ethers }) => {
    const DAO = await ethers.getContractFactory(DAO_CONTRACT_NAME);
    const daoContract = DAO.attach(dao);

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

    const addTx: ContractTransaction = await daoContract.addProposal(recipient, description, calldata);
    const addReceipt: ContractReceipt = await addTx.wait();

    const event = addReceipt.events?.find(event => event.event == "ProposalCreated");
    if (!event) {
        throw new Error("Proposal creation failed");
    }

    const proposalId: BigNumber = event?.args!["proposalId"];
    const proposalRecipient: Address = event?.args!["recipient"];
    const descr: String = event?.args!["description"]

    console.log(`Created proposal ${proposalId} for ${proposalRecipient} with description: ${descr}`);
});