const { upgrades } = require('hardhat')
const hre = require('hardhat')
const ethers = hre.ethers

const sleep = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay * 1000))

async function verify(contractName, contractAddress) {
  await sleep(60)

  return hre.run('verify:verify', {
    address: contractAddress,
    contract: `contracts/${contractName}.sol:${contractName}`,
  })
}

async function deploy(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName)
  console.log(`Deploying ${contractName}...`)

  const contractInstance = await ContractFactory.deploy()
  await contractInstance.deployed()

  console.log(`${contractName} deployed to:`, contractInstance.address)

  await sleep(60)

  await verify(contractName, contractInstance.address)
}

deploy('SphereBlackListToken').catch((err) => {
  console.error(err)
  process.exitCode = 1
})
