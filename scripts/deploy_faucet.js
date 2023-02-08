const { upgrades } = require('hardhat');
const hre = require('hardhat')
const ethers = hre.ethers;

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay * 1000));

async function verify(contractName, contractAddress, args) {
  // await sleep(60);

  return hre.run("verify:verify", {
    address: contractAddress,
    contract: `contracts/${contractName}.sol:${contractName}`,
    constructorArguments: args
  })
}

async function deploy(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await ContractFactory.deploy();
  await contractInstance.deployed();

  console.log(`${contractName} deployed to:`, contractInstance.address);

  await verify(contractName, contractInstance.address)
}

async function proxyUpgrade(contractName, proxyAddress) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Upgrading ${contractName}...`);

  // await upgrades.forceImport(proxyAddress, ContractFactory, {kind: 'transparent'});

  const implAddress = await upgrades.prepareUpgrade(proxyAddress, ContractFactory);
  // await contractInstance.deployed();
  // const implAddress = await upgrades.erc1967.getImplementationAddress(contractInstance.address);

  console.log(`${contractName} deployed to:`, implAddress);

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

async function proxyPrepareUpgrade(contractName, proxyAddress) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Deploying ${contractName}...`);

  const contractInstance = await upgrades.prepareUpgrade(proxyAddress, ContractFactory);
  console.log(`${contractName} at:`, contractInstance);

  await verify(contractName, contractInstance);
}

async function forceProxy(contractName, proxyAddress) {
  const ContractFactory = await ethers.getContractFactory(contractName);
  console.log(`Upgrading ${contractName}...`);

  await upgrades.forceImport(proxyAddress, ContractFactory, {kind: 'transparent'});
}

// deploy('TokenFaucetProxyFactory').catch((err) => {
//   console.error(err);
//   process.exitCode = 1;
// })

verify('TokenFaucetProxyFactory',
        '0xe63c9b4c00ce8abf8a958ea91a3899fe83a20260',
        ['0x62F594339830b90AE4C084aE7D223fFAFd9658A7', '0xC022CA2f81A00D2DC50D35A4D9e307D5EFe8535e', '2180000000000000000']
      ).catch((err) => {
  console.log(err)
}).then(() => {
  console.log('Finished')
})