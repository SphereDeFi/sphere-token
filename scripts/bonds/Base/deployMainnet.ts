import { DeploySphereOvernightBond } from '../DeploySphereOvernightBond'
import { ethers } from 'hardhat'
import { Misc } from '../../Misc'
import { writeFileSync } from 'fs'
import {
  BondDepo,
  SphereBondTreasurySwapper,
  SphereOvernightStrategy,
} from '../../../typechain'

const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const _principle = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const _dystopiaRouter = '0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e'
const _strategyAddress = '0x6B3712943A913EB9A22B71D4210DE6158c519970'
const _liquidityReceiver = '0x1a2Ce410A034424B784D4b228f167A061B94CFf4'
const _feeSplit = '20'
const usdPlusContract = '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f'
const _controlVariable = '7'
const _vestingTerm = '1'
const _minimumPrice = '6000'
const _maxPayout = '5000000000000000000000'
const _maxDebt = '20000000000000000000000'
const _initialDebt = '5000'

async function main() {
  const signer = (await ethers.getSigners())[0]

  const core = await DeploySphereOvernightBond.deployCore(signer)

  const data =
    '' +
    'sphereBondTreasurySwapper: ' +
    core.sphereBondTreasurySwapper.address +
    '\n' +
    'sphereOvernightStrategy: ' +
    core.sphereOvernightStrategy.address +
    '\n' +
    'sphereBondDepo: ' +
    core.sphereBondDepo.address
  ;('\n')

  console.log(data)
  writeFileSync('./core.txt', data)

  await updateSphereBondTreasurySwapper(
    core.sphereBondTreasurySwapper,
    core.sphereOvernightStrategy.address
  )

  await Misc.wait(5)

  await updateSphereOvernightStrategy(
    core.sphereOvernightStrategy,
    core.sphereBondTreasurySwapper
  )

  await Misc.wait(5)

  await updateSphereBondDepo(core.sphereBondDepo)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

async function updateSphereBondTreasurySwapper(
  sphereBondTreasurySwapper: SphereBondTreasurySwapper,
  addSwapBackerAddress: string
) {
  await Misc.wait(5)
  await sphereBondTreasurySwapper.init()
  await Misc.wait(5)
  await sphereBondTreasurySwapper.setAssetAddress(usdPlusContract)
  await Misc.wait(5)
  await sphereBondTreasurySwapper.setFeeReceivers(_liquidityReceiver)
  await Misc.wait(5)
  await sphereBondTreasurySwapper.setFees('20', '80')
  await Misc.wait(5)
  await sphereBondTreasurySwapper.setRouter(_dystopiaRouter)
  await Misc.wait(5)
  await sphereBondTreasurySwapper.addSwapBacker(addSwapBackerAddress)
}

async function updateSphereOvernightStrategy(
  sphereOvernightStrategy: SphereOvernightStrategy,
  sphereBondTreasurySwapper: SphereBondTreasurySwapper
) {
  await Misc.wait(5)
  await sphereOvernightStrategy.init()
  await Misc.wait(5)
  await sphereOvernightStrategy.setConfig(
    _treasury,
    _principle,
    _strategyAddress,
    sphereBondTreasurySwapper.address,
    _feeSplit
  )
}
async function updateSphereBondDepo(sphereBondDepo: BondDepo) {
  await Misc.wait(5)
  await sphereBondDepo.updateBondTerms(
    _controlVariable,
    _vestingTerm,
    _minimumPrice,
    _maxPayout,
    _maxDebt,
    _initialDebt
  )
}
