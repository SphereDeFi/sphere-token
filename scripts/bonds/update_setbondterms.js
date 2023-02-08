const hre = require('hardhat')
const ethers = hre.ethers

const SphereSettingsAddress = '0x3aC41aa67BD4bafBAA5Fb6c7546069Af19cE0886'

async function updateBondTerms() {
  const SphereSettings = await ethers.getContractFactory('BondDepo')
  const sphereSettings = await SphereSettings.attach(SphereSettingsAddress)
  await sphereSettings.updateBondTerms(
    '1',
    '604800',
    '1',
    '5000000000000000000000',
    '20000000000000000000000',
    '0'
  )
}

updateBondTerms()
