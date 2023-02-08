const { upgrades } = require('hardhat');
const hre = require('hardhat')
const ethers = hre.ethers;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

async function verify(contractName, contractAddress, args) {
  await sleep(60);

  return hre.run("verify:verify", {
    address: contractAddress,
    contract: `contracts/vault/${contractName}.sol:${contractName}`,
    constructorArguments: args
  })
}

async function deploy(contractName, args = []) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await ContractFactory.deploy(...args);
  await contractInstance.deployed();

  console.log(`${contractName} deployed to:`, contractInstance.address);

  await verify(contractName, contractInstance.address, args)

  return contractInstance.address
}

// Update Vault Manager
deploy("VaultManager").then(async function(managerAddress) {
  const VaultManagerProxy = await ethers.getContractFactory("VaultManagerProxy");
  const vaultManagerProxy = VaultManagerProxy.attach("0x5a375A7b7f30dfA2C53d7b2C29E4D20bF7529cfb")
  await vaultManagerProxy.updateImplementationAddress(managerAddress)
})

// Update Vault implementation
// deploy("Vault").then(async function(vaultImplAddress) {
//   const VaultManager = await ethers.getContractFactory("VaultManager");
//   const vaultManager = VaultManager.attach("0x5a375A7b7f30dfA2C53d7b2C29E4D20bF7529cfb")
//   await vaultManager.setVaultImplementationAddress(vaultImplAddress);
// })
