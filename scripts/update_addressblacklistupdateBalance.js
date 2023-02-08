const hre = require('hardhat')
const ethers = hre.ethers

const sphereBlackListToken = '0x07Ae0E91A08682049cEf551e0c20c0fF60247034'

async function updateSetOverrideBalance(overrideBalance) {
  const SphereBlackListToken = await ethers.getContractFactory(
    'SphereBlackListToken'
  )
  const sphereSettings = await SphereBlackListToken.attach(sphereBlackListToken)
  await sphereSettings.setOverrideBalance(overrideBalance)
}

updateSetOverrideBalance('2239161944526138822793679611')
