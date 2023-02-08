const SPHERE_FINANCE_ADDRESS = '0x3FbE25618D269bb64757950ab1d97FA9C5ed968c'
const customTreasury = '0xF804774386f31C5a2Cc62bAb10ea38D1b9a09658'
const sphereAddress = '0x45c32fA6DF82ead1e2EF74d17b76547EDdFaFF89' //Sphere Token
const sphereTreasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const sphereSubsidyRouter = '0xC1AAc69e6758645F1908bAa37d25c4Ee611a0C80'
const initialOwner = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'

async function main() {
    await verify(SPHERE_FINANCE_ADDRESS,
        [
            customTreasury, sphereAddress, sphereTreasury, sphereSubsidyRouter, initialOwner,
            sphereTreasury, [0], [20000], 0])
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
