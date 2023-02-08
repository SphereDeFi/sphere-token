// @dev. This script will deploy the FairLaunch of Sphere

const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)

  const { provider } = deployer
  // TODO: set this to launch date
  const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
  console.log('First epoch timestamp: ' + firstEpochTime)



  // Deploy Fairlaunch contract
  const customTreasury = '0xF804774386f31C5a2Cc62bAb10ea38D1b9a09658'
  const sphereAddress = '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89' //Sphere Token
  const sphereTreasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
  const sphereSubsidyRouter = '0xC1AAc69e6758645F1908bAa37d25c4Ee611a0C80'
  const initialOwner = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'

  const sphereCustomBond = await ethers.getContractFactory('SphereCustomBond')
  const SphereCustomBond = await sphereCustomBond.deploy(
      customTreasury, sphereAddress, sphereTreasury,
      sphereSubsidyRouter, initialOwner,
      sphereTreasury, [0], [20000], 0)

  console.log('sphereCustomBond deployed: ' + SphereCustomBond.address)

  await new Promise(r => setTimeout(r, 30000));

  //verify
  await verify(SphereCustomBond.address,[
      customTreasury, sphereAddress, sphereTreasury, sphereSubsidyRouter, initialOwner,
          sphereTreasury, [0], [250000], 0])


}



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


main()
  .then(() => process.exit())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
