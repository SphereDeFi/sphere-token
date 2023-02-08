const hre = require('hardhat')
const ethers = hre.ethers;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

async function verify(contractName, contractAddress, args) {
  await sleep(60);

  return hre.run("verify:verify", {
    address: contractAddress,
    contract: `contracts/${contractName}.sol:${contractName}`,
    constructorArguments: args
  })
}

async function deploy(contractName, args) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await ContractFactory.deploy(...args);
  await contractInstance.deployed();

  console.log(`${contractName} deployed to:`, contractInstance.address);

  await sleep(60);

  await verify(contractName, contractInstance.address, args)
}

deploy("SphereTimelockController", [172800, ["0x20D61737f972EEcB0aF5f0a85ab358Cd083Dd56a"], ["0x20D61737f972EEcB0aF5f0a85ab358Cd083Dd56a"]]).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
