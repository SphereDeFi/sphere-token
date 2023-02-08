const hre = require('hardhat')
const ethers = hre.ethers

const bondDepoAddress = '0xb3639869BC724dec8e6AFbAe480d0cD564CaD0C8'

async function main() {
  const BondDepo = await ethers.getContractFactory('BondDepo')
  const bondDepo = await BondDepo.attach(bondDepoAddress)
  console.log('bondPriceInUsd', await bondDepo.bondPriceInUSD())
  console.log('bondPrice', await bondDepo.bondPrice())
  console.log('currentDebt', await bondDepo.currentDebt())
  console.log('payoutFor', await bondDepo.payoutFor('1000000000000000000000'))
  console.log(
    'bondInfo',
    await bondDepo.bondInfo('0x9c48c80064975c01d5e4b7ed528ac1d124355caf')
  )
  console.log('terms', await bondDepo.terms())
  console.log('standardizedDebtRatio', await bondDepo.standardizedDebtRatio())
  console.log(
    'valueOfToken',
    await bondDepo.valueOfToken('1000000000000000000000')
  )
  console.log(
    'valueOfToken',
    await bondDepo.valueOfToken('1000000000000000000000')
  )
}

main()
