import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"
import chai from "chai"
import { TimeUtils } from "../time_utils"
import { Deploy } from "../../scripts/deploy"
import { BondDepo, SphereBondTreasurySwapper, SphereOvernightStrategy, UsdPlusToken } from "../../typechain"
import { parseUnits } from "ethers/lib/utils"

const hre = require("hardhat")
require("solidity-coverage")

const { expect } = chai

// Sphere data
const sphereDeployer = "0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe"
const sphereContract = "0x62F594339830b90AE4C084aE7D223fFAFd9658A7"
const usdPlusContract = "0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f"
const SPHERE_SOURCE = "contracts/SphereToken.sol:SphereToken"

// Bond Constructor Parameters
const _rewardToken = "0x62F594339830b90AE4C084aE7D223fFAFd9658A7"
const _principle = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
const _treasury = "0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe"
const _bondCalculator = "0x0000000000000000000000000000000000000000"
const _strategyAddress = "0x6B3712943A913EB9A22B71D4210DE6158c519970"
const _feeSplit = "20"
const _liquidityReceiver = "0x1a2Ce410A034424B784D4b228f167A061B94CFf4"
const _dystopiaRouter = "0xbE75Dd16D029c6B32B7aD57A0FD9C1c20Dd2862e"

// Bond Terms
const _controlVariable = "7"
const _vestingTerm = "1"
const _minimumPrice = "20"
const _maxPayout = "5000000000000000000000"
const _maxDebt = "20000000000000000000000"
const _initialDebt = "5000"

const MAX_UINT = "115792089237316195423570985008687907853269984665640564039457584007913129639935"

describe("SphereBond tests", function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let owner2: SignerWithAddress
  let owner3: SignerWithAddress
  let lp: SignerWithAddress
  let bondDepo: BondDepo
  let sphereOvernightStrategy: SphereOvernightStrategy
  let sphereBondTreasurySwapper: SphereBondTreasurySwapper
  let sphereContractData: UsdPlusToken
  let usdcContractData: UsdPlusToken
  let usdPlusContractData: UsdPlusToken

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, owner2, owner3, lp] = await ethers.getSigners()

    const signer = await ethers.provider.getSigner(sphereDeployer)

    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [sphereDeployer],
    })

    sphereOvernightStrategy = (await Deploy.deployContract(owner, "SphereOvernightStrategy")) as SphereOvernightStrategy

    sphereBondTreasurySwapper = (await Deploy.deployContract(
      owner,
      "SphereBondTreasurySwapper"
    )) as SphereBondTreasurySwapper

    bondDepo = (await Deploy.deployContract(
      owner,
      "BondDepo",
      _rewardToken,
      _principle,
      _treasury,
      _bondCalculator,
      sphereOvernightStrategy.address
    )) as BondDepo

    await bondDepo.updateBondTerms(_controlVariable, _vestingTerm, _minimumPrice, _maxPayout, _maxDebt, _initialDebt)

    sphereContractData = (await ethers.getContractAt(SPHERE_SOURCE, sphereContract, signer)) as UsdPlusToken

    usdcContractData = (await ethers.getContractAt(SPHERE_SOURCE, _principle, signer)) as UsdPlusToken

    usdPlusContractData = (await ethers.getContractAt(SPHERE_SOURCE, usdPlusContract, signer)) as UsdPlusToken

    console.log("Signer Sphere balance", await sphereContractData.balanceOf(signer._address))

    console.log("Treasury USD+ balance before", await usdPlusContractData.balanceOf(_treasury))

    await sphereContractData.approve(bondDepo.address, MAX_UINT)

    await bondDepo.pushManagement(signer._address)
    await bondDepo.connect(signer).pullManagement()
    console.log("bondDepo Owner", await bondDepo.owner())

    console.log("signer Sphere balance", await sphereContractData.balanceOf(signer._address))

    console.log("bondDepo Sphere balance", await sphereContractData.balanceOf(bondDepo.address))

    console.log("availableDebt", await bondDepo.availableDebt())

    await bondDepo.connect(signer).fund("60000000000000000000000")

    console.log("bondDepo balance", await sphereContractData.balanceOf(bondDepo.address))

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
    await sphereBondTreasurySwapper.setFees("20", "80")
    await sphereBondTreasurySwapper.setRouter(_dystopiaRouter)
    await sphereBondTreasurySwapper.addSwapBacker(sphereOvernightStrategy.address)
    await sphereOvernightStrategy.addSwapBacker(owner.address)

    await sphereOvernightStrategy.addSwapBacker(bondDepo.address)

    console.log("sphereOvernightStrategy", sphereOvernightStrategy.address)
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

  describe("Sphere Strategy Test", async function () {
    it("fundsReceiver", async function () {
      expect(await sphereOvernightStrategy.fundsReceiver()).eq(_treasury)
    })

    it("principleAsset", async function () {
      expect(await sphereOvernightStrategy.principleAsset()).eq(_principle)
    })
  })

  describe("Sphere Bonds Config Tests", async function () {
    it("term comparison", async function () {
      const terms = await bondDepo.terms()
      expect(terms.controlVariable).eq(_controlVariable)
      expect(terms.vestingTerm).eq(_vestingTerm)
      expect(terms.minimumPrice).eq(_minimumPrice)
      expect(terms.maxPayout).eq(_maxPayout)
      expect(terms.maxDebt).eq(_maxDebt)
    })

    it("rewardToken", async function () {
      expect(await bondDepo.rewardToken()).eq(_rewardToken)
    })

    it("availableDebt", async function () {
      expect(await bondDepo.availableDebt()).eq(parseUnits("60000"))
    })

    it("get treasury", async function () {
      expect(await bondDepo.treasury()).eq(_treasury)
    })

    it("bond Price In USD", async function () {
      expect(await bondDepo.bondPriceInUSD()).eq(6000)
    })

    it("bond Price", async function () {
      expect(await bondDepo.bondPrice()).eq("6000")
    })

    it("debtDecay", async function () {
      expect(await bondDepo.debtDecay()).eq(5000)
    })

    it("debtRatio", async function () {
      expect(await bondDepo.debtRatio()).eq("0")
    })

    it("standardizedDebtRatio", async function () {
      expect(await bondDepo.standardizedDebtRatio()).eq("0")
    })

    it("currentDebt", async function () {
      expect(await bondDepo.currentDebt()).eq(0)
    })

    it("isLiquidityBond", async function () {
      expect(await bondDepo.isLiquidityBond()).eq(false)
    })

    it("payoutFor", async function () {
      expect(await bondDepo.payoutFor(parseUnits("6"))).eq("1000000000000000121050")
    })

    it("valueOfToken", async function () {
      expect(await bondDepo.valueOfToken(parseUnits("1"))).eq("1000000000000000000000000000000")
    })

    it("should return allowance", async function () {
      expect(await usdcContractData.allowance(sphereDeployer, owner3.address)).eq(0)
    })
  })

  describe("allowance check", async function () {
    it("should approve spender", async function () {
      await usdcContractData.approve(owner2.address, parseUnits("1"))
      expect(await usdcContractData.allowance(sphereDeployer, owner2.address)).eq(parseUnits("1"))
    })

    it("should increase allowance", async function () {
      await usdcContractData.approve(owner2.address, parseUnits("1"))
      expect(await usdcContractData.allowance(sphereDeployer, owner2.address)).eq(parseUnits("1"))
      await usdcContractData.increaseAllowance(owner2.address, parseUnits("1"))
      expect(await usdcContractData.allowance(sphereDeployer, owner2.address)).eq(parseUnits("2"))
    })

    it("should decrease allowance", async function () {
      await usdcContractData.approve(owner2.address, parseUnits("1"))
      expect(await usdcContractData.allowance(sphereDeployer, owner2.address)).eq(parseUnits("1"))
      await usdcContractData.decreaseAllowance(owner2.address, parseUnits("1"))
      expect(await usdcContractData.allowance(sphereDeployer, owner2.address)).eq(parseUnits("0"))
    })
  })

  describe("deposit funds into bonds", async function () {
    it("approve and deposit", async function () {
      console.log("1. payoutFor", await bondDepo.payoutFor("1000000"))
      const signer = await ethers.provider.getSigner(sphereDeployer)
      await usdcContractData.connect(signer).approve(bondDepo.address, MAX_UINT)
      await bondDepo.connect(signer).deposit("1000000", "6000", sphereDeployer)

      await hre.network.provider.send("hardhat_mine", ["0x100"])
      console.log("2. payoutFor", await bondDepo.payoutFor("1000000"))
      console.log("pendingPayoutFor", await bondDepo.pendingPayoutFor(sphereDeployer))
      console.log("Treasury USD+ balance after", await usdPlusContractData.balanceOf(_treasury))
      console.log("SwapBack USD+ balance", await usdPlusContractData.balanceOf(sphereOvernightStrategy.address))
      console.log("Signer Sphere balance before redeem", await sphereContractData.balanceOf(sphereDeployer))

      await bondDepo.connect(signer).redeem(sphereDeployer)
      console.log("Signer Sphere balance after redeem", await sphereContractData.balanceOf(sphereDeployer))
    })
  })
})
