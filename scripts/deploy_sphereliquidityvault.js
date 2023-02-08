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

deploy("VaultManager").then(async function(managerAddress) {
  deploy("VaultManagerProxy", [managerAddress]).then(async function(managerProxyAddress) {

    const VaultManager = await ethers.getContractFactory("VaultManager");
    const contract = await VaultManager.attach(managerProxyAddress);
    await contract.initialize(
      "0xbe75dd16d029c6b32b7ad57a0fd9c1c20dd2862e", // dystopia router
      "0xc9ae7dac956f82074437c6d40f67d6a5abf3e34b", // penrose
      "0x62f594339830b90ae4c084ae7d223ffafd9658a7", // sphere
      "0x236eec6359fb44cce8f97e99387aa7f8cd5cde1f", // usd plus
      "0x9008d70a5282a936552593f410abcbce2f891a97", // PEN
      "0x39ab6574c289c3ae4d88500eec792ab5b947a5eb"  // DYST
    );

    deploy("Vault").then(async function(vaultAddress) {
      await contract.setVaultImplementationAddress(vaultAddress);
    })
  })
}).catch((err) => {
  console.error(err);
  process.exitCode = 1;
})

