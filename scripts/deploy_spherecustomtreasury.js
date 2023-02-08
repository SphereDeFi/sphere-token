// @dev. This script will deploy the FairLaunch of Sphere

const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account: ' + deployer.address)

  const { provider } = deployer
  // TODO: set this to launch date
  const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
  console.log('First epoch timestamp: ' + firstEpochTime)


  const sphereAddress = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7' //Sphere Token
  const multiSigAddress = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'

  const customTreasury = await ethers.getContractFactory('CustomTreasury')
  const CustomTreasury = await customTreasury.deploy(
      sphereAddress, multiSigAddress
  )
  console.log('customTreasury deployed: ' + CustomTreasury.address)

  await new Promise(r => setTimeout(r, 30000));

  //verify
  await verify(CustomTreasury.address,[sphereAddress, multiSigAddress])


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
