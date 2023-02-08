const {ethers} = require("hardhat");

const addresses = {
    PAYOUTTOKEN_ADDRESS: '0x62F594339830b90AE4C084aE7D223fFAFd9658A7',
    PRINCIPALTOKEN_ADDRESS: '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f',
    INITIALOWNER_ADDRESS: '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe',

}

async function main() {

    const [deployer] = await ethers.getSigners();

    const sphereBondFactoryAddress = '0x95bd07c8A30584e72fB51917DabEc2768576E67E';
    const sphereBondFactory = await ethers.getContractFactory("SphereBondFactory");
    const SphereBondFactory = sphereBondFactory.attach(sphereBondFactoryAddress)
    const provider = deployer.provider;
    const block = await provider.getBlock();
    console.log("Chain id: " + (await provider.getNetwork()).chainId);
    console.log("Current block time: " + block.timestamp);

    let data = await SphereBondFactory.createBondAndTreasury(addresses.PAYOUTTOKEN_ADDRESS, addresses.PRINCIPALTOKEN_ADDRESS,
        addresses.INITIALOWNER_ADDRESS, [0], [50000], false);

    console.log('txn hash:', data.hash);
}

try {
    main();
} catch (e) {
    console.log(e);
    main();
}
