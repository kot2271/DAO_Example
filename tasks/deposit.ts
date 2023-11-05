import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const DAO_CONTRACT_NAME = "DAO";
const TOKEN_NAME = "MyToken"; 

task("deposit", "Deposit tokens into the DAO")
  .addParam("dao", "The DAO contract address")
  .addParam("amount", "The amount to deposit")
  .setAction(async ({ dao, amount }, { ethers }) => {
    const DAO = await ethers.getContractFactory(DAO_CONTRACT_NAME);
    const daoContract = DAO.attach(dao);

    const depositAmount: BigNumber = ethers.utils.parseEther(amount.toString());

    const depositTx: ContractTransaction = await daoContract.deposit(depositAmount);
    const depositReceipt: ContractReceipt = await depositTx.wait();

    const event = depositReceipt.events?.find(event => event.event == "Deposit");
    if (!event) {
        throw new Error("Deposit failed");
    }

    const depositor: Address = event?.args!["user"];
    const deposit: BigNumber = event?.args!["amount"];
    const depositEtherAmount = ethers.utils.formatEther(deposit);

    console.log(`Deposited ${depositEtherAmount} ${TOKEN_NAME}'s for ${depositor}`);
});