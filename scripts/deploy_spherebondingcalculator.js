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
  const sphereAddress = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7' //Sphere Token

  const sphereBondingCalculator = await ethers.getContractFactory('SphereBondingCalculator')
  const SphereBondingCalculator = await sphereBondingCalculator.deploy(
      sphereAddress
  )
  console.log('sphereBondingCalculator deployed: ' + SphereBondingCalculator.address)

  await new Promise(r => setTimeout(r, 30000));

  //verify
  await verify(SphereBondingCalculator.address,[sphereAddress])


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
