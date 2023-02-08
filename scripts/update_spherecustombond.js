const hre = require('hardhat')
const ethers = hre.ethers;


async function setBondData() {
    const SphereCustomBond = await ethers.getContractFactory("SphereCustomBond");
    const sphereCustomBond = await SphereCustomBond.attach("0x3FbE25618D269bb64757950ab1d97FA9C5ed968c");
    await sphereCustomBond.initializeBond(145, 60480, 1, 1000, 1000000000000000, 0);
    let newTerms = await sphereCustomBond.terms();
    let payoutFor = await sphereCustomBond.payoutFor(1000000000000000000);
    console.log('newTerms', newTerms)
    console.log('payoutFor', payoutFor)
}

setBondData().catch((err) => {
    console.error(err);
    process.exitCode = 1;
})