const {ethers} = require("hardhat");

async function main() {

    const [deployer] = await ethers.getSigners();

    const bondAddress = '0x677dddd5547e1a8fdeff3adf92a9f88e94a22b28';
    const Bonding = await ethers.getContractFactory("CustomBond");
    const bonding = Bonding.attach(bondAddress)
    const provider = deployer.provider;
    const block = await provider.getBlock();
    console.log("Chain id: " + (await provider.getNetwork()).chainId);
    console.log("Current block time: " + block.timestamp);

    let data = await bonding.deposit(1000, 1, deployer.address);

    console.log('txn hash:', data.hash);
}

try {
    main();
} catch (e) {
    console.log(e);
    main();
}
