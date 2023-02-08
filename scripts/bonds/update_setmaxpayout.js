const hre = require('hardhat')
const ethers = hre.ethers

const SphereSettingsAddress = '0x0558f50784c7D9899368B9b8220A4FdE837c1eFC'

async function updateMaxPayout() {
  const SphereSettings = await ethers.getContractFactory('BondDepo')
  const sphereSettings = await SphereSettings.attach(SphereSettingsAddress)
  await sphereSettings.setMaxPayout('5000000000000000000000')
}

updateMaxPayout()
