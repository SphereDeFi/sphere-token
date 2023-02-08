const {ethers} = require('hardhat')

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log('Deploying contracts with the account: ' + deployer.address)

    const {provider} = deployer
    // TODO: set this to launch date
    const firstEpochTime = (await provider.getBlock()).timestamp + 30 * 60
    console.log('First epoch timestamp: ' + firstEpochTime)

    const rewardToken = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7' //Sphere Token
    const principleToken = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
    const multiSig = '0x20D61737f972EEcB0aF5f0a85ab358Cd083Dd56a'
    let bondCalculator = '0x0000000000000000000000000000000000000000';
    const isLPToken = false;

    if (isLPToken) {
        bondCalculator = '0x28860b6B34FE6c7a4d38B43fff7C91f6A5785189';
    }
    const dystopiaRouter = '0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e'

    const sphereNewBond = await ethers.getContractFactory('SphereNewBond')
    const SphereNewBond = await sphereNewBond.deploy(
        rewardToken, principleToken, multiSig, bondCalculator, dystopiaRouter
    )
    console.log('sphereNewBond deployed: ' + SphereNewBond.address)
    console.log('sphereNewBond txn: ' + SphereNewBond.hash)

    await new Promise(r => setTimeout(r, 30000));

    //verify
    await verify(SphereNewBond.address, [rewardToken, principleToken, multiSig, bondCalculator, dystopiaRouter])


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
