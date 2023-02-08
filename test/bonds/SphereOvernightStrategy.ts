import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import chai from 'chai'
import { TimeUtils } from '../time_utils'
import { Deploy } from '../../scripts/deploy'
import {
  SphereBondTreasurySwapper,
  SphereOvernightStrategy,
  UsdPlusToken,
} from '../../typechain'

const hre = require('hardhat')

const { expect } = chai

// Sphere data
const sphereDeployer = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const sphereContract = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7'
const usdPlusContract = '0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f'
const SPHERE_SOURCE = 'contracts/SphereToken.sol:SphereToken'

// Bond Constructor Parameters
const _principle = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const _liquidityReceiver = '0x1a2Ce410A034424B784D4b228f167A061B94CFf4'
const _dystopiaRouter = '0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e'
const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const _strategyAddress = '0x6B3712943A913EB9A22B71D4210DE6158c519970'
const _miscellaneousReceiver = '0x6B3712943A913EB9A22B71D4210DE6158c519970'
const _feeSplit = '20'
const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

describe('Sphere Overnight Strategy Prepare', function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let owner2: SignerWithAddress
  let owner3: SignerWithAddress
  let lp: SignerWithAddress
  let sphereOvernightStrategy: SphereOvernightStrategy
  let sphereBondTreasurySwapper: SphereBondTreasurySwapper
  let sphereContractData
  let usdcContractData: UsdPlusToken
  let usdPlusContractData: UsdPlusToken

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, owner2, owner3, lp] = await ethers.getSigners()

    const signer = await ethers.provider.getSigner(sphereDeployer)

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [sphereDeployer],
    })

    sphereOvernightStrategy = (await Deploy.deployContract(
      owner,
      'SphereOvernightStrategy'
    )) as SphereOvernightStrategy

    sphereBondTreasurySwapper = (await Deploy.deployContract(
      owner,
      'SphereBondTreasurySwapper'
    )) as SphereBondTreasurySwapper

    sphereContractData = await ethers.getContractAt(
      SPHERE_SOURCE,
      sphereContract,
      signer
    )

    usdcContractData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      _principle,
      signer
    )) as UsdPlusToken

    usdPlusContractData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      usdPlusContract,
      signer
    )) as UsdPlusToken

    await sphereOvernightStrategy.init()

    await sphereOvernightStrategy.setConfig(
      _treasury,
      _principle,
      _strategyAddress,
      sphereBondTreasurySwapper.address,
      _feeSplit
    )
    await sphereBondTreasurySwapper.init()
    await sphereBondTreasurySwapper.addSwapBacker(owner.address)
    await sphereBondTreasurySwapper.setAssetAddress(usdPlusContract)
    await sphereBondTreasurySwapper.setFeeReceivers(_liquidityReceiver)
    await sphereBondTreasurySwapper.setFees('20', '80')
    await sphereBondTreasurySwapper.setRouter(_dystopiaRouter)
    await sphereBondTreasurySwapper.addSwapBacker(
      sphereOvernightStrategy.address
    )
    await sphereOvernightStrategy.addSwapBacker(owner.address)

    console.log(
      'sphereBondTreasurySwapper ',
      await sphereBondTreasurySwapper.owner()
    )

    console.log('sphereOvernightStrategy', sphereOvernightStrategy.address)
  })

  after(async function () {
    await TimeUtils.rollback(snapshotBefore)
  })

  beforeEach(async function () {
    snapshot = await TimeUtils.snapshot()
  })

  afterEach(async function () {
    await TimeUtils.rollback(snapshot)
  })

  describe('Sphere Overnight Strategy Test', async function () {
    it('swapBack test', async function () {
      const signer = await ethers.provider.getSigner(sphereDeployer)

      await usdcContractData
        .connect(signer)
        .approve(sphereOvernightStrategy.address, MAX_UINT)

      await usdcContractData
        .connect(signer)
        .transfer(sphereOvernightStrategy.address, '1000000')

      console.log(
        'Strategy USDC holding',
        await usdcContractData.balanceOf(sphereOvernightStrategy.address)
      )

      console.log(
        'Wallet USD+ holding',
        await usdPlusContractData.balanceOf(_treasury)
      )

      await sphereOvernightStrategy.swapBack()

      console.log(
        'Strategy USDC holding after swapBack',
        await usdcContractData.balanceOf(sphereOvernightStrategy.address)
      )

      console.log(
        'Wallet USD+ holding after swapBack',
        await usdPlusContractData.balanceOf(_treasury)
      )
    })
  })
})
