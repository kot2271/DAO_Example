import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const DAO_CONTRACT_NAME = "DAO";
const TOKEN_NAME = "MyToken";

task("withdraw", "Withdraw tokens from the DAO after voting") 
  .addParam("dao", "The DAO contract address")
  .setAction(async ({ dao }, { ethers }) => {
    const DAO = await ethers.getContractFactory(DAO_CONTRACT_NAME);
    const daoContract = DAO.attach(dao);

    const withdrawTx: ContractTransaction = await daoContract.withdraw();
    const withdrawReceipt: ContractReceipt = await withdrawTx.wait();

    const event = withdrawReceipt.events?.find(event => event.event == "Withdraw");
    if (!event) {
        throw new Error("Withdraw failed");
    }

    const withdrawer: Address = event?.args!["user"];
    const withdrawAmount: BigNumber = event?.args!["amount"];

    const withdrawEtherAmount = ethers.utils.formatEther(withdrawAmount);

    console.log(`${withdrawer} withdrew ${withdrawEtherAmount} ${TOKEN_NAME}'s`);
});