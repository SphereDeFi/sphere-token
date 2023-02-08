const hre = require("hardhat")
const ethers = hre.ethers

async function setTokensToZero() {
  const SphereSettings = await ethers.getContractFactory("SphereToken")
  const sphereSettings = await SphereSettings.attach("0x16a001e6e22d3aa26c07a76f0f7e1cb14298caea")
  await sphereSettings.setMultiSigTokensToZero()
}

setTokensToZero().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
