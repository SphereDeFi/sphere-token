const hre = require('hardhat')
const ethers = hre.ethers

const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const _principle = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const _dystopiaRouter = '0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e'
const _strategyAddress = '0x6B3712943A913EB9A22B71D4210DE6158c519970'
const _liquidityReceiver = '0x1a2Ce410A034424B784D4b228f167A061B94CFf4'
const _feeSplit = '20'
const usdPlusContract = '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f'
let sphereOvernightStrategy, sphereBondTreasurySwapper, sphereBond

// Bond Constructor Parameters

const _rewardToken = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'
const _bondCalculator = '0x0000000000000000000000000000000000000000'

// Bond Terms
const _controlVariable = '7'
const _vestingTerm = '1'
const _minimumPrice = '6'
const _maxPayout = '5000000000000000000000'
const _maxDebt = '20000000000000000000000'
const _initialDebt = '5000'

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

async function deploySphereOvernightStrategy(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName)
  console.log(`Deploying ${contractName}...`)

  const contractInstance = await ContractFactory.deploy()
  await contractInstance.deployed()

  console.log(`${contractName} deployed to:`, contractInstance.address)
  await sleep(60)

  await setConfig(contractInstance)
  await verify(contractInstance.address)

  sphereOvernightStrategy = contractInstance

  async function setConfig(contractInstance) {
    await sleep(10)
    await contractInstance.init()
    await sleep(10)
    await contractInstance.setConfig(
      _treasury,
      _principle,
      _strategyAddress,
      sphereBondTreasurySwapper.address,
      _feeSplit
    )
    await sphereBondTreasurySwapper.addSwapBacker(contractInstance.address)
  }
}

async function deploySphereBondTreasurySwapper(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName)
  console.log(`Deploying ${contractName}...`)

  const contractInstance = await ContractFactory.deploy()
  await contractInstance.deployed()

  console.log(`${contractName} deployed to:`, contractInstance.address)
  await sleep(60)

  await setConfig(contractInstance)
  await verify(contractInstance.address)

  sphereBondTreasurySwapper = contractInstance

  async function setConfig(contractInstance) {
    await sleep(10)
    await contractInstance.init()
    await sleep(10)
    await contractInstance.setAssetAddress(usdPlusContract)
    await sleep(10)
    await contractInstance.setFeeReceivers(_liquidityReceiver)
    await sleep(10)
    await contractInstance.setFees('20', '80')
    await sleep(10)
    await contractInstance.setRouter(_dystopiaRouter)
  }
}

async function deploySphereBond(contractName) {
  const ContractFactory = await ethers.getContractFactory(contractName)
  console.log(`Deploying ${contractName}...`)

  const contractInstance = await ContractFactory.deploy(
    _rewardToken,
    _principle,
    _treasury,
    _bondCalculator,
    sphereOvernightStrategy.address
  )
  await contractInstance.deployed()

  console.log(`${contractName} deployed to:`, contractInstance.address)

  await sleep(60)
  await setConfig(contractInstance)
  await verify(contractInstance.address, [
    _rewardToken,
    _principle,
    _treasury,
    _bondCalculator,
    sphereOvernightStrategy.address,
  ])

  sphereBond = contractInstance

  async function setConfig(contractInstance) {
    await contractInstance.updateBondTerms(
      _controlVariable,
      _vestingTerm,
      _minimumPrice,
      _maxPayout,
      _maxDebt,
      _initialDebt
    )
  }
}

deploySphereBondTreasurySwapper('SphereBondTreasurySwapper').then((r) =>
  deploySphereOvernightStrategy('SphereOvernightStrategy').then((r) =>
    deploySphereBond('BondDepo')
  )
)
