const hre = require('hardhat')
const ethers = hre.ethers;

const SphereSettingsAddress = '0x7afe1b2320705210a4f5255cabc869899a2e44cc';

async function getCurrentSphereSettingsFees() {
  const SphereSettings = await ethers.getContractFactory("SphereSettings");
  const sphereSettings = await SphereSettings.attach(SphereSettingsAddress);
  let fees = await sphereSettings.currentFees()
  console.log(fees)
}

async function setNewFees(fees) {
  const SphereSettings = await ethers.getContractFactory("SphereSettings");
  const sphereSettings = await SphereSettings.attach(SphereSettingsAddress);
  await sphereSettings.setFees(fees);
  let newFees = await sphereSettings.currentFees()
  console.log(newFees)
}

async function updateSellFees(fees) {
  const SphereSettings = await ethers.getContractFactory("SphereSettings");
  const sphereSettings = await SphereSettings.attach(SphereSettingsAddress);
  await sphereSettings.setSellFees(fees);
}

updateSellFees(
{
  liquidityFee: 50,
  treasuryFee: 50,
  riskFreeValueFee: 149,
  totalFees: 0
})

/*setNewFees({
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
})*/