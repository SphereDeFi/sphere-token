const { upgrades } = require('hardhat');
const hre = require('hardhat')
const ethers = hre.ethers;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

async function verify(contractName, contractAddress) {
  await sleep(60);

  return hre.run("verify:verify", {
    address: contractAddress,
    contract: `contracts/${contractName}.sol:${contractName}`
  })
}

async function deploy(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await ContractFactory.deploy();
  await contractInstance.deployed();

  console.log(`${contractName} deployed to:`, contractInstance.address);

  await sleep(60);

  await verify(contractName, contractInstance.address)
}

async function proxyUpgrade(contractName, proxyAddress) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Upgrading ${contractName}...`);

  const contractInstance = await upgrades.upgradeProxy(proxyAddress, ContractFactory);
  await contractInstance.deployed();

  const implAddress = await upgrades.erc1967.getImplementationAddress(contractInstance.address);

  console.log(`${contractName} upgraded`);

  await verify(contractName, implAddress);
}

async function proxyDeploy(contractName, contractInitArgs = []) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await upgrades.deployProxy(ContractFactory, contractInitArgs, {initializer: 'init'});

  await contractInstance.deployed();
  const implAddress = await upgrades.erc1967.getImplementationAddress(contractInstance.address);

  console.log(`${contractName} deployed to:`, implAddress);

  await verify(contractName, implAddress);
}

// This is for the initial deployment
proxyDeploy("SphereToolbox").catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// This is in order to push an update 
// proxyUpgrade("SphereToolbox", "UPDATE ME").catch((err) => {
//   console.error(err);
//   process.exitCode = 1;
// })