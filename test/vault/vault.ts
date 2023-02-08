import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import chai from 'chai'
import { TimeUtils } from '../time_utils'
import { Deploy } from '../../scripts/deploy'

import {
  VaultManager,
  VaultManagerProxy,
  Vault,
  VaultProxy,
  DystFactory,
  DystRouter01,
  UsdPlusToken,
  SphereToken,
  SphereSettings,
  PenroseProxy,
  Dyst,
  Pen,
} from '../../typechain'

import { parseUnits } from 'ethers/lib/utils'

const { expect } = chai

const FEE_DENOMINATOR = 1000

describe('Sphere vaults tests', function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let user: SignerWithAddress
  let dystTreasury: SignerWithAddress

  let vaultManager: VaultManager
  let vaultManagerProxy: VaultManagerProxy
  let vault: Vault
  let sphere: SphereToken
  let sphereSettings: SphereSettings
  let usdPlus: UsdPlusToken

  let pen: Pen
  let dyst: Dyst

  let dystFactory: DystFactory
  let dystRouter: DystRouter01
  let penroseProxy: PenroseProxy

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, user, dystTreasury] = await ethers.getSigners()

    pen = (await Deploy.deployContract(owner, 'Pen')) as Pen
    dyst = (await Deploy.deployContract(owner, 'Dyst')) as Dyst

    const vaultManagerImpl = (await Deploy.deployContract(
      owner,
      'VaultManager'
    )) as VaultManager
    vaultManagerProxy = (await Deploy.deployContract(
      owner,
      'VaultManagerProxy',
      vaultManagerImpl.address
    )) as VaultManagerProxy
    vault = (await Deploy.deployContract(owner, 'Vault')) as Vault

    vaultManager = await (
      await ethers.getContractFactory('VaultManager')
    ).attach(vaultManagerProxy.address)

    sphere = (await Deploy.deployContract(owner, 'SphereToken')) as SphereToken
    sphereSettings = (await Deploy.deployContract(
      owner,
      'SphereSettings'
    )) as SphereSettings

    await sphere.init()
    await sphere.setSphereSettings(sphereSettings.address)
    await sphere.setFeeTypeExempt(vaultManager.address, true, 1)

    // await sphereSettings.init(sphere.address);

    await sphere.setAutoRebase(false)
    await sphere.setInitialDistributionFinished(true)

    usdPlus = (await Deploy.deployContract(
      owner,
      'UsdPlusToken'
    )) as UsdPlusToken
    await usdPlus.initialize()
    await usdPlus.setExchanger(owner.address)
    await usdPlus.mint(owner.address, parseUnits('1000'))

    dystFactory = (await Deploy.deployContract(
      owner,
      'DystFactory',
      dystTreasury.address
    )) as DystFactory
    await dystFactory.createPair(sphere.address, usdPlus.address, false)

    dystRouter = (await Deploy.deployContract(
      owner,
      'DystRouter01',
      dystFactory.address,
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
    )) as DystRouter01

    penroseProxy = (await Deploy.deployContract(
      owner,
      'PenroseProxy'
    )) as PenroseProxy

    await vaultManager.initialize(
      dystRouter.address,
      penroseProxy.address,
      sphere.address,
      usdPlus.address,
      pen.address,
      dyst.address
    )
    await vaultManager.setVaultImplementationAddress(vault.address)
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

  it('should not allow initiailize to be called twice', async function () {
    try {
      await vaultManager.initialize(
        dystRouter.address,
        penroseProxy.address,
        sphere.address,
        usdPlus.address,
        pen.address,
        dyst.address
      )
    } catch (err) {
      return expect(err)
    }

    expect(false)
  })

  it('should deploy a new Vault', async function () {
    const addr = await vaultManager.connect(user).callStatic.createVault()
    expect(addr).not.equal('0x0000000000000000000000000000000000000000')
  })

  describe('liquidity', async function () {
    before(async function () {
      await vaultManager.createVault()
      await sphere.approve(vaultManager.address, parseUnits('1000000'))
      await usdPlus.approve(vaultManager.address, parseUnits('1000000'))
    })

    describe('add liquidity', async function () {
      it('should add liquidity', async function () {
        await vaultManager.addLiquidity('10000', '10000')

        expect(await usdPlus.balanceOf(owner.address)).eq(
          '999999999999999990000'
        )
        expect(await sphere.balanceOf(owner.address)).eq(
          '4999999999999999999999990000'
        )
      })
    })

    describe('remove liquidity', async function () {
      before(async function () {
        await vaultManager.addLiquidity('10000', '10000')
      })

      it('should remove liquidity', async function () {
        const lpAmount = await vaultManager.liquidityBalanceOf(owner.address)
        const previousSphereBalance = await sphere.balanceOf(owner.address)

        await vaultManager.removeLiquidity(lpAmount)
        expect(await vaultManager.liquidityBalanceOf(owner.address)).eq(0)
        expect(
          (await sphere.balanceOf(owner.address)).gt(previousSphereBalance)
        )
      })
    })

    it('should return the amount of sphere for a user', async function () {
      await vaultManager.addLiquidity('10000', '10000')
      const sphereAmount = await vaultManager.balanceOfSphere(owner.address)
      expect(sphereAmount).eq('10000')
    })

    it('should return 0 if fetching liquidity for a user without a vault', async function () {
      const sphereAmount = await vaultManager.balanceOfSphere(user.address)
      expect(sphereAmount).eq('0')
    })
  })
})
