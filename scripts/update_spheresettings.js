const hre = require('hardhat')
const ethers = hre.ethers;

async function getCurrentSphereSettingsFees() {
  const SphereSettings = await ethers.getContractFactory("SphereSettings");
  const sphereSettings = await SphereSettings.attach("0xc49be67aaa0a2476e5132ad77216521971643857");
  let fees = await sphereSettings.currentFees()
  console.log(fees)
}

async function setNewFees(fees) {
  const SphereSettings = await ethers.getContractFactory("SphereSettings");
  const sphereSettings = await SphereSettings.attach("0xc49be67aaa0a2476e5132ad77216521971643857");
  await sphereSettings.setFees(fees);
  let newFees = await sphereSettings.currentFees()
  console.log(newFees)
}

setNewFees({
  burnFee: 0,
  buyGalaxyBondFee: 0,
  liquidityFee: 50,
  realFeePartyArray: 490,
  riskFreeValueFee: 50,
  sellBurnFee: 0,
  sellFeeRFVAdded: 50,
  sellFeeTreasuryAdded: 20,
  sellGalaxyBond: 0,
  treasuryFee: 30,
  isTaxBracketEnabledInMoveFee: false,
  gameFees: 10 | 200 << 16
}).catch((err) => {
  console.error(err);
  process.exitCode = 1;
})