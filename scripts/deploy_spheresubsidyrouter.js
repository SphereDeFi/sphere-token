const {ethers} = require('hardhat')

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with the account: ' + deployer.address)

    const {provider} = deployer
    // TODO: set this to launch date
    const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
    console.log('First epoch timestamp: ' + firstEpochTime)

    const sphereSubsidyRouterFactory = await ethers.getContractFactory('SphereSubsidyRouter')
    const SphereSubsidyRouter = await sphereSubsidyRouterFactory.deploy()
    console.log('sphereSubsidyRouterFactory deployed: ' + SphereSubsidyRouter.address)
    console.log('SphereSubsidyRouter txn: ' + SphereSubsidyRouter.hash)

    await new Promise(r => setTimeout(r, 30000));

    //verify
    await verify(SphereSubsidyRouter.address)


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
