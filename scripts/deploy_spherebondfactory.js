const {ethers} = require('hardhat')

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with the account: ' + deployer.address)

    const {provider} = deployer
    // TODO: set this to launch date
    const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
    console.log('First epoch timestamp: ' + firstEpochTime)

    const sphereTreasury = '0x7754d8b057cc1d2d857d897461dac6c3235b4aae' //Sphere Token
    const sphereProFactoryStorage = '0x818aaf4eB220a575B6D79148f9881B423Bd2a40d'
    const sphereSubsidyRouter = '0xC1AAc69e6758645F1908bAa37d25c4Ee611a0C80'
    const multiSig = '0x7754d8b057cc1d2d857d897461dac6c3235b4aae'

    const sphereBondFactory = await ethers.getContractFactory('SphereBondFactory')
    const SphereBondFactory = await sphereBondFactory.deploy(
        sphereTreasury, sphereProFactoryStorage, sphereSubsidyRouter, multiSig
    )
    console.log('sphereBondFactory deployed: ' + SphereBondFactory.address)
    console.log('sphereBondFactory txn: ' + SphereBondFactory.hash)

    await new Promise(r => setTimeout(r, 30000));

    //verify
    await verify(SphereBondFactory.address, [sphereTreasury, sphereProFactoryStorage, sphereSubsidyRouter, multiSig])


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
