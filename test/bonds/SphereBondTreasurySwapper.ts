import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import chai from 'chai'
import { TimeUtils } from '../time_utils'
import {
  SphereBondTreasurySwapper,
  SphereToken,
  UsdPlusToken,
} from '../../typechain'
import { Deploy } from '../../scripts/deploy'

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
const _dystopiaLPToken = '0xb8E91631F348dD1F47Cb46f162df458a556c6f1e'
const DEAD = '0x000000000000000000000000000000000000dEaD'
const MAX_UINT =
  '115792089237316195423570985008687907853269984665640564039457584007913129639935'

describe('Sphere Bond Treasury Swapper Prepare', function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let owner2: SignerWithAddress
  let owner3: SignerWithAddress
  let lp: SignerWithAddress
  let sphereBondTreasurySwapper: SphereBondTreasurySwapper
  let sphereContractData: SphereToken
  let usdcContractData: UsdPlusToken
  let dystopiaLpTokenData: UsdPlusToken
  let usdPlusContractData: UsdPlusToken

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, owner2, owner3, lp] = await ethers.getSigners()

    const signer = await ethers.provider.getSigner(sphereDeployer)

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [sphereDeployer],
    })

    sphereBondTreasurySwapper = (await Deploy.deployContract(
      owner,
      'SphereBondTreasurySwapper'
    )) as SphereBondTreasurySwapper

    await sphereBondTreasurySwapper.init()
    await sphereBondTreasurySwapper.addSwapBacker(owner.address)
    await sphereBondTreasurySwapper.setAssetAddress(usdPlusContract)
    await sphereBondTreasurySwapper.setFeeReceivers(_liquidityReceiver)
    await sphereBondTreasurySwapper.setFees('20', '80')
    await sphereBondTreasurySwapper.setRouter(_dystopiaRouter)

    sphereContractData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      sphereContract,
      signer
    )) as SphereToken

    usdcContractData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      _principle,
      signer
    )) as UsdPlusToken

    dystopiaLpTokenData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      _dystopiaLPToken,
      signer
    )) as UsdPlusToken

    usdPlusContractData = (await ethers.getContractAt(
      SPHERE_SOURCE,
      usdPlusContract,
      signer
    )) as UsdPlusToken
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

  describe('Sphere Bond Treasury Swapper Test', async function () {
    it('swapBack test', async function () {
      const signer = await ethers.provider.getSigner(sphereDeployer)

      await usdPlusContractData
        .connect(signer)
        .approve(sphereBondTreasurySwapper.address, '10000000')

      await usdPlusContractData
        .connect(signer)
        .transfer(sphereBondTreasurySwapper.address, '10000000')

      console.log('dead before', await sphereContractData.balanceOf(DEAD))
      console.log(
        'liquidity before',
        await dystopiaLpTokenData.balanceOf(_liquidityReceiver)
      )
      await sphereBondTreasurySwapper.swapBack()

      console.log('dead after', await sphereContractData.balanceOf(DEAD))
      console.log(
        'liquidity after',
        await dystopiaLpTokenData.balanceOf(_liquidityReceiver)
      )

      console.log(
        'sphereBondTreasurySwapper after',
        await sphereContractData.balanceOf(sphereBondTreasurySwapper.address)
      )
    })
  })
})
