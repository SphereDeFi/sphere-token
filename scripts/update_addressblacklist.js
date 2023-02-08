const hre = require('hardhat')
const ethers = hre.ethers

const sphereBlackListToken = '0x07Ae0E91A08682049cEf551e0c20c0fF60247034'

async function updateUserBlacklist(address) {
  const SphereBlackListToken = await ethers.getContractFactory(
    'SphereBlackListToken'
  )
  const sphereSettings = await SphereBlackListToken.attach(sphereBlackListToken)
  await sphereSettings.addUserToBlackList(address, false)
}

updateUserBlacklist('0xd6F073F2Cd09f4951449101989E2c34bD8053366')
