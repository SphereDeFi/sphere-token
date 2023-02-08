
const address = {
    SPHERE_FINANCE_ADDRESS: '0x28860b6b34fe6c7a4d38b43fff7c91f6a5785189',
    SPHERE_ADDRESS: '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'
}


async function main() {
    await verify(address.SPHERE_FINANCE_ADDRESS, [address.SPHERE_ADDRESS])
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
