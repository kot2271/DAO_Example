import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const TOKEN_NAME = "MyToken";

task("approve", "Approved to spend from a DAO contract")
.addParam("token", "MyToken address")
.addParam("daoContract", "DAO contract address")
.addParam("amount", "Amount to spend")
.setAction(async ({ token, daoContract, amount }, { ethers }) => {
    const Token = await ethers.getContractFactory(TOKEN_NAME);
    const tokenContract = Token.attach(token);

    const amountToSpend: BigNumber = ethers.utils.parseEther(amount.toString());

    const tokenTx: ContractTransaction = await tokenContract.approve(daoContract, amountToSpend);
    const tokenReceipt: ContractReceipt = await tokenTx.wait();
    const tokenEvent = tokenReceipt.events?.find(event => event.event === 'Approval');
    const owner: Address = tokenEvent?.args!['owner'];
    const spender: Address = tokenEvent?.args!['spender'];
    const value: BigNumber = tokenEvent?.args!['value'];
    const etherValue = ethers.utils.formatEther(value);

    console.log(`MyToken owner: ${owner}`);
    console.log(`DAO Contract: ${spender}`);
    console.log(`Token amount: ${value}`);
    console.log(`Approved ${spender} to spend ${etherValue} ${TOKEN_NAME}'s`);
});