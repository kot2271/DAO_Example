import { ethers, run, network } from "hardhat";
import { Contract } from "ethers";

const delay = async (time: number) => {
  return new Promise((resolve: any) => {
    setInterval(() => {
      resolve()
    }, time)
  })
}

async function verify(address: string, cArguments: any[], contract: string, networkName: string) {
  try {
    await run('verify:verify', {
      address,
      constructorArguments: cArguments, 
      contract,
      network: networkName
    });
    console.log('Verify success');
  } catch(e: any) {
    console.log(e.message); 
  }
}

async function main() {

  const tokenName = "MyToken";
  const tokenSymbol = "T3T";
  const daoName = "DAO";

  if (network.name === 'polygon-mumbai') {

  const Token = await ethers.getContractFactory(tokenName);
  const token = await Token.deploy(tokenName, tokenSymbol);

  await token.deployed();

  console.log(`${tokenName} in polygon-mumbai deployed to: ${token.address}`);
  console.log('Wait for delay...');
  await delay(20000); // 20 seconds
  console.log(`Starting verify ${tokenName}...`);

  await verify(
    token.address, 
    [tokenName, tokenSymbol],
    'contracts/MyToken.sol:MyToken', 
    'polygon-mumbai'
  );
  
  let contractDAO: Contract | undefined;
  const [chairperson] = await ethers.getSigners();
  const minQuorum: number = 3;
  const debatePeriod: number = 600;

  try {
  const DAO = await ethers.getContractFactory(daoName);
  contractDAO = await DAO.deploy(chairperson.address, token.address, minQuorum, debatePeriod);
  await contractDAO.deployed();

  console.log(`DAO contract in polygon-mumbai deployed to: ${contractDAO.address}`);
  console.log(`Chairperson in polygon-mumbai: ${chairperson.address}`);
  } catch (e: any) {
    console.log(e.message)
  }
  console.log('Wait for delay...');
  await delay(60000);
  console.log('Starting verify DAO contract in polygon-mumbai ...');

  if (contractDAO !== undefined) {
    await verify(
      contractDAO.address,
      [chairperson.address, token.address, minQuorum, debatePeriod], 
      'contracts/DAO.sol:DAO',
      'polygon-mumbai'
    );
  }
 }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });