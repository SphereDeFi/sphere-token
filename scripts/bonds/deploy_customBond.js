const hre = require('hardhat')
const ethers = hre.ethers

const sleep = (delay) =>
  new Promise((resolve) => setTimeout(resolve, delay * 1000))

async function verify(address, constructorArguments) {
  try {
    await hre.run('verify:verify', {
      address,
      constructorArguments,
    })
  } catch (err) {
    console.warn(`verify failed: ${address} ${err.message}`)
  }
}

async function deploy(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName)
  console.log(`Deploying ${contractName}...`)

  const _rewardToken = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7' //Sphere Token
  const _principle = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
  const _bondCalculator = '0x0000000000000000000000000000000000000000'
  //const _bondCalculator = '0x1AfD960766837E5Da6923897d97aC902C61d4b67'

  const contractInstance = await ContractFactory.deploy(
    _rewardToken,
    _principle,
    _treasury,
    _bondCalculator
  )
  await contractInstance.deployed()

  console.log(`${contractName} deployed to:`, contractInstance.address)

  await verify(contractInstance.address, [
    _rewardToken,
    _principle,
    _treasury,
    _bondCalculator,
  ])
}

deploy('BondDepo').catch((err) => {
  console.error(err)
  process.exitCode = 1
})
