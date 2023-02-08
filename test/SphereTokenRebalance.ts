import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"
import chai from "chai"
import { TimeUtils } from "./time_utils"
import { Deploy } from "../scripts/deploy"

import { SphereToken, SphereSettings } from "../typechain"
const helpers = require("@nomicfoundation/hardhat-network-helpers")

import { parseUnits } from "ethers/lib/utils"
import { execPath, hasUncaughtExceptionCaptureCallback } from "process"
import { ContractFactory } from "ethers"

const { expect } = chai

const FEE_DENOMINATOR = 1000
const sphereToken = "0x62F594339830b90AE4C084aE7D223fFAFd9658A7"

describe("factory tests", function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let owner2: SignerWithAddress
  let owner3: SignerWithAddress
  let hacker: SignerWithAddress
  let multisig: SignerWithAddress
  let sphereGameAddy: SignerWithAddress
  let sphereGamePool: SignerWithAddress
  let lp: SignerWithAddress
  let sphere: SphereToken
  let sphereTokenFactory: ContractFactory

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, owner2, owner3, hacker, multisig, sphereGameAddy, sphereGamePool, lp] = await ethers.getSigners()

    // attach mainnet Sphere
    console.log(`\n=============== attach Sphere ===============\n`)
    sphereTokenFactory = (await Deploy.getContractFactory(owner, "SphereToken")) as ContractFactory
    sphere = (await sphereTokenFactory.attach(sphereToken)) as SphereToken

    await sphere.init()
    await sphere.setSphereSettings(sphereSettings.address)
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

  describe("Sphere Settings", async function () {
    it("should retreive fees", async function () {
      const fees = await sphereSettings.currentFees()
      expect(fees.realFeePartyArray).eq(490)
    })
  })

  it("should return the balance of an user", async function () {
    expect(await sphere.balanceOf(owner.address)).eq(parseUnits("5000000000"))
  })

  describe("transfers", function () {
    it("transfer test", async function () {
      const fees = await sphereSettings.currentBuyFees()

      await sphere.transfer(owner2.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("1"))

      const totalFee = FEE_DENOMINATOR - (await fees.totalFees).toNumber()

      await sphere.connect(owner2).transfer(owner3.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1").mul(totalFee).div(FEE_DENOMINATOR))
    })

    it("should not take any fees with fees to 0", async function () {
      await sphereSettings.setTransferFees({ liquidityFee: 0, treasuryFee: 0, riskFreeValueFee: 0, totalFees: 0 })
      await sphere.transfer(owner2.address, parseUnits("1"))
      await sphere.connect(owner2).transfer(owner3.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1"))
    })

    it("should transfer from", async function () {
      await sphere.approve(owner2.address, parseUnits("1"))
      await sphere.connect(owner2).transferFrom(owner.address, owner3.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1"))
    })

    it("should not transfer from without approve first", async function () {
      try {
        await sphere.transferFrom(owner.address, owner3.address, parseUnits("1"))
      } catch (err) {
        return expect(err)
      }
      return false
    })
  })

  it("should return total supply", async function () {
    expect(await sphere.totalSupply()).eq(parseUnits("5000000000"))
  })

  it("should be exempt from buy fees", async function () {
    await sphere.setFeeTypeExempt(owner2.address, true, 1)
    expect(await sphere.isTotalFeeExempt(owner2.address)).eq(true)
  })

  it("should return circulating supply", async function () {
    expect(await sphere.getCirculatingSupply()).eq(parseUnits("5000000000"))
  })

  it("should return user total sphere", async function () {
    await sphere.transfer(owner2.address, parseUnits("1000"))
    expect(await sphere.getUserTotalOnDifferentContractsSphere(owner2.address)).eq(parseUnits("1000"))
  })

  it("should get token in LP circulation", async function () {
    expect(await sphere.getTokensInLPCirculation()).eq(parseUnits("0"))
    await sphere.addLPAddressesForDynamicTax(lp.address, true)
    await sphere.transfer(lp.address, parseUnits("1000000000"))
    expect(await sphere.getTokensInLPCirculation()).eq(parseUnits("1000000000"))
  })

  it("should return the right tax bracket", async function () {
    await sphere.addLPAddressesForDynamicTax(lp.address, true)
    await sphere.transfer(lp.address, parseUnits("1000000000"))
    await sphere.transfer(owner2.address, parseUnits("10000001"))
    expect(await sphere.getCurrentTaxBracket(owner2.address)).eq(50)
  })

  it("should return the total amount withdrawn in the last hour", async function () {
    expect(await sphere.getLastPeriodWithdrawals(owner2.address)).eq(0)
  })

  describe("allowance", function () {
    it("should return allowance", async function () {
      expect(await sphere.allowance(owner2.address, owner3.address)).eq(0)
    })

    it("should approve spender", async function () {
      await sphere.approve(owner2.address, parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("1"))
    })

    it("should increase allowance", async function () {
      await sphere.approve(owner2.address, parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("1"))
      await sphere.increaseAllowance(owner2.address, parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("2"))
    })

    it("should decrease allowance", async function () {
      await sphere.approve(owner2.address, parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("1"))
      await sphere.decreaseAllowance(owner2.address, parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("0"))
    })

    it("should decrease allowance after transfer", async function () {
      await sphere.approve(owner2.address, parseUnits("1"))
      await sphere.connect(owner2).transferFrom(owner.address, owner3.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("0"))
    })
  })

  describe("move balance", function () {
    it("should not allow to move balance", async function () {
      await sphere.transfer(owner2.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("1"))
      try {
        await sphere.connect(owner2).moveBalance(owner3.address)
      } catch (err) {
        return expect(err)
      }

      expect(false)
    })

    it("should move balance", async function () {
      await sphere.setMoveBalance(true)
      await sphere.transfer(owner2.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("1"))
      await sphere.connect(owner2).moveBalance(owner3.address)
      expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("0"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1"))
    })
  })

  it("should set sphere settings", async function () {
    await sphere.setSphereSettings("0x0000000000000000000000000000000000000001")
    expect(await sphere.settings()).eq("0x0000000000000000000000000000000000000001")
  })

  it("should fail if sphere setting address is wrong", async function () {
    await sphere.setSphereSettings("0x0000000000000000000000000000000000000001")
    expect(await sphere.settings()).eq("0x0000000000000000000000000000000000000001")

    await sphere.transfer(owner2.address, parseUnits("1"))
    expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("1"))

    try {
      await sphere.connect(owner2).transfer(owner3.address, parseUnits("1"))
    } catch (err) {
      return expect(err)
    }
    expect(false)
  })

  describe("fee exempt setter", function () {
    it("should total exempt of fee", async function () {
      await sphere.setFeeTypeExempt(owner2.address, true, 1)
      expect(await sphere.isTotalFeeExempt(owner2.address))
    })

    it("should exempt buy fee only", async function () {
      await sphere.setFeeTypeExempt(owner2.address, true, 2)
      expect(await sphere.isBuyFeeExempt(owner2.address))
    })

    it("should exempt sell fee only", async function () {
      await sphere.setFeeTypeExempt(owner2.address, true, 3)
      expect(await sphere.isSellFeeExempt(owner2.address))
    })

    it("should exempt transfer fee only", async function () {
      await sphere.setFeeTypeExempt(owner.address, true, 4)
      expect(await sphere.isTransferFeeExempt(owner.address))

      const balBefore = await sphere.balanceOf(owner.address)
      await sphere.transfer(owner.address, parseUnits("1000"))
      const balAfter = await sphere.balanceOf(owner.address)
      expect(balBefore).eq(balAfter)
    })
  })

  it("should set tax bracket fee multiplier", async function () {
    await sphere.setTaxBracketFeeMultiplier(50, true)
    expect(await sphere.isTaxBracket())
    expect(await sphere.taxBracketMultiplier()).eq(50)
  })

  it("should rescue token", async function () {
    await sphere.transfer(sphere.address, parseUnits("1000000000"))
    expect(await sphere.balanceOf(owner.address)).eq(parseUnits("4000000000"))
    await sphere.rescueToken(sphere.address)
    expect(await sphere.balanceOf(owner.address)).eq(parseUnits("5000000000"))
  })

  it("should set max buy / sell", async function () {
    await sphere.setMaxTransactionAmount(parseUnits("500001"), parseUnits("500002"))
    expect(await sphere.maxSellTransactionAmount()).eq(parseUnits("500001"))
    expect(await sphere.maxBuyTransactionAmount()).eq(parseUnits("500002"))
  })

  it("should add sub contract", async function () {
    await sphere.addSubContracts("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.subContractCheck("0x0000000000000000000000000000000000000001"))
  })

  it("should remove sub contract", async function () {
    await sphere.addSubContracts("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.subContractCheck("0x0000000000000000000000000000000000000001"))
    await sphere.addSubContracts("0x0000000000000000000000000000000000000001", false)
    expect(await sphere.subContractCheck("0x0000000000000000000000000000000000000001")).eq(false)
  })

  it("should add lp address for dynamic tax", async function () {
    await sphere.addLPAddressesForDynamicTax("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.lpContractCheck("0x0000000000000000000000000000000000000001"))
  })

  it("should remove lp address for dynamic tax", async function () {
    await sphere.addLPAddressesForDynamicTax("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.lpContractCheck("0x0000000000000000000000000000000000000001"))
    await sphere.addLPAddressesForDynamicTax("0x0000000000000000000000000000000000000001", false)
    expect(await sphere.lpContractCheck("0x0000000000000000000000000000000000000001")).eq(false)
  })

  it("should add sphere game contract", async function () {
    await sphere.addSphereGamesAddies("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.sphereGamesCheck("0x0000000000000000000000000000000000000001"))
  })

  it("should remove sphere game contract", async function () {
    await sphere.addSphereGamesAddies("0x0000000000000000000000000000000000000001", true)
    expect(await sphere.sphereGamesCheck("0x0000000000000000000000000000000000000001"))
    await sphere.addSphereGamesAddies("0x0000000000000000000000000000000000000001", false)
    expect(await sphere.sphereGamesCheck("0x0000000000000000000000000000000000000001")).eq(false)
  })

  it("should add party addy", async function () {
    await sphere.addPartyAddies(owner2.address, true, "10")
    expect(await sphere.partyArrayFee(owner2.address)).eq("10")
  })

  it("should remove party addy", async function () {
    await sphere.addPartyAddies(owner2.address, true, "10")
    expect(await sphere.partyArrayFee(owner2.address)).eq("10")
    await sphere.addPartyAddies(owner2.address, false, "10")
    expect(await sphere.partyArrayCheck(owner2.address)).eq(false)
  })

  it("should set automated market pair", async function () {
    await sphere.setAutomatedMarketMakerPair(owner2.address, true)
    expect(await sphere.automatedMarketMakerPairs(owner2.address))
  })

  it("should remove automated market pair", async function () {
    await sphere.setAutomatedMarketMakerPair(owner2.address, true)
    expect(await sphere.automatedMarketMakerPairs(owner2.address))
    await sphere.setAutomatedMarketMakerPair(owner2.address, false)
    expect(await sphere.automatedMarketMakerPairs(owner2.address)).eq(false)
  })

  describe("Hacker dead lock", async function () {
    it("should set multisig from owner only once for the first time", async function () {
      await sphere.setMultiSig(multisig.address)
      expect(await sphere.multisig()).eq(multisig.address)

      try {
        await sphere.setMultiSig(owner2.address)
      } catch (err) {
        return expect(err)
      }

      expect(false)
    })

    it("should add a hacker to the dead lock list", async function () {
      await sphere.setMultiSig(multisig.address)
      await sphere.connect(multisig).setHackerToDeadLock(hacker.address, true)
      expect(await sphere.hackerDeadLock(hacker.address))
    })

    it("should remove a hacker from the dead lock list", async function () {
      await sphere.setMultiSig(multisig.address)
      await sphere.connect(multisig).setHackerToDeadLock(hacker.address, true)
      expect(await sphere.hackerDeadLock(hacker.address))

      await sphere.connect(multisig).setHackerToDeadLock(hacker.address, false)
      expect(!(await sphere.hackerDeadLock(hacker.address)))
    })

    it("should send the amount transfer from the hacker to the dead wallet", async function () {
      await sphere.transfer(hacker.address, parseUnits("1000"))
      expect(await sphere.balanceOf(hacker.address)).eq(parseUnits("1000"))

      await sphere.setMultiSig(multisig.address)
      await sphere.connect(multisig).setHackerToDeadLock(hacker.address, true)
      const preDeadBalance = await sphere.balanceOf("0x000000000000000000000000000000000000dEaD")
      await sphere.connect(hacker).transfer(owner3.address, parseUnits("1000"))

      expect(await sphere.balanceOf(owner3.address)).eq(0)
      expect(await sphere.balanceOf("0x000000000000000000000000000000000000dEaD")).eq(
        parseUnits("870").add(preDeadBalance)
      ) // 870 and not 1000 as there are fees
    })

    it("should send the amount moved from the hacker to the dead wallet", async function () {
      await sphere.setMoveBalance(true)
      await sphere.transfer(hacker.address, parseUnits("1000"))
      expect(await sphere.balanceOf(hacker.address)).eq(parseUnits("1000"))

      await sphere.setMultiSig(multisig.address)
      await sphere.connect(multisig).setHackerToDeadLock(hacker.address, true)
      await sphere.connect(hacker).moveBalance(owner3.address)

      expect(await sphere.balanceOf(owner3.address)).eq(0)
      expect(await sphere.balanceOf("0x000000000000000000000000000000000000dEaD")).eq(parseUnits("1000"))
    })
  })

  it("should clear stuck balance", async function () {
    owner2.sendTransaction({
      to: sphere.address,
      value: parseUnits("1"),
    })

    const initialBalance = await owner.getBalance()
    await sphere.clearStuckBalance(owner.address)
    expect((await owner.getBalance()).gt(initialBalance))
  })

  it("should set fee on normal transfer", async function () {
    await sphere.setFeesOnNormalTransfers(true)
    expect(await sphere.feesOnNormalTransfers())
    await sphere.setFeesOnNormalTransfers(false)
    expect(await sphere.feesOnNormalTransfers()).eq(false)
  })

  describe("remove tokens from multisig", async function () {
    before(async function () {
      await sphere.transfer(await sphere.treasuryReceiver(), parseUnits("1000000"))
      expect(await sphere.balanceOf(await sphere.treasuryReceiver())).eq(parseUnits("1000000"))
    })

    it("removed balance of tokens from treasury", async function () {
      expect(await sphere.totalSupply()).eq(parseUnits("5000000000"))
      await sphere.setMultiSigTokensToZero()
      expect(await sphere.balanceOf(await sphere.treasuryReceiver())).eq(parseUnits("0"))
      expect(await sphere.totalSupply()).eq(parseUnits("4999000000"))
      expect(await sphere.balanceOf(owner.address)).eq(parseUnits("4999000000"))
      expect(await sphere.getCirculatingSupply()).eq(await sphere.totalSupply())
      await sphere.transfer(await sphere.treasuryReceiver(), parseUnits("1000000"))
      expect(await sphere.getCirculatingSupply()).eq((await sphere.totalSupply()).sub(parseUnits("1000000")))
      await sphere.setMultiSigTokensToZero()
      expect(await sphere.getCirculatingSupply()).eq(await sphere.totalSupply())
      await owner.sendTransaction({
        to: await sphere.treasuryReceiver(),
        value: ethers.utils.parseEther("10.0"), // Sends exactly 10.0 ether
      })

      await helpers.impersonateAccount(await sphere.treasuryReceiver())
      const treasurySigner = await ethers.getSigner(await sphere.treasuryReceiver())
      await sphere.connect(treasurySigner).transfer(owner.address, parseUnits("1"))
    })
  })
})
