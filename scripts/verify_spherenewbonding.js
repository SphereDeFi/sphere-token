const address = {
    SPHERE_FINANCE_ADDRESS: '0x143dB3d70977bd8D09CB8bbe274914FBC33007e2',
    REWARD_TOKEN_ADDRESS: '0x62F594339830b90AE4C084aE7D223fFAFd9658A7',
    PRINCIPLE_TOKEN_ADDRESS: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    MULTISIG_ADDRESS: '0x20D61737f972EEcB0aF5f0a85ab358Cd083Dd56a',
    BOND_CALCULATOR_ADDRESS: '0x28860b6B34FE6c7a4d38B43fff7C91f6A5785189',
    DYSTOPIA_ROUTER_ADDRESS: '0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e'
}


async function main() {
    await verify(address.SPHERE_FINANCE_ADDRESS,
        [address.REWARD_TOKEN_ADDRESS, address.PRINCIPLE_TOKEN_ADDRESS,
            address.MULTISIG_ADDRESS, address.BOND_CALCULATOR_ADDRESS, address.DYSTOPIA_ROUTER_ADDRESS])
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
