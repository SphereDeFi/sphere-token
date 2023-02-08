import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { ethers } from "hardhat"
import chai from "chai"
import { TimeUtils } from "./time_utils"
import { Deploy } from "../scripts/deploy"

import {SphereToken, SphereSettings, ProxyAdmin} from "../typechain"
const helpers = require("@nomicfoundation/hardhat-network-helpers")

import { parseUnits } from "ethers/lib/utils"
import { execPath, hasUncaughtExceptionCaptureCallback } from "process"

const { expect } = chai

const proxyAdminAdress = "0xF27522d4A48B9A5fE53F69E343B15926b540f0aB"
const sphereWhaleAddress = "0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe"
const sphereTokenAdress = "0x62F594339830b90AE4C084aE7D223fFAFd9658A7"
const timelock = "0xA0dccb94bC35576Ab9820c2DDa9d6fc0042d6d72"
const DEAD = "0x000000000000000000000000000000000000dEaD";
const ZERO = "0x0000000000000000000000000000000000000000";
const ONE = "0x0000000000000000000000000000000000000001";
const TWO = "0x0000000000000000000000000000000000000002";

describe("Sphere Test Mainnet", function () {
  let snapshotBefore: string
  let snapshot: string

  let owner: SignerWithAddress
  let owner2: SignerWithAddress
  let owner3: SignerWithAddress
  let timelockSigner: SignerWithAddress
  let sphereWhaleSigner: SignerWithAddress
  let sphere: SphereToken
  let sphereNew: SphereToken
  let proxyAdmin: ProxyAdmin

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot()
    ;[owner, owner2, owner3] = await ethers.getSigners()


    await helpers.impersonateAccount(timelock)
    timelockSigner = await ethers.getSigner(timelock)

    await helpers.impersonateAccount(sphereWhaleAddress)
    sphereWhaleSigner = await ethers.getSigner(sphereWhaleAddress)

    sphereNew = (await Deploy.deployContract(owner, "SphereToken")) as SphereToken

    const contractFactory = await ethers.getContractFactory("SphereToken")
    sphere = (await contractFactory.attach(sphereTokenAdress)) as SphereToken

    const contractFactory2 = await ethers.getContractFactory("ProxyAdmin")
    proxyAdmin = (await contractFactory2.attach(proxyAdminAdress)) as ProxyAdmin

    await owner.sendTransaction({
      to: timelock,
      value: ethers.utils.parseEther("500.0"),
    });
    await proxyAdmin.connect(timelockSigner).upgrade(sphere.address, sphereNew.address)

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

  describe("transfers", function () {
    it("transfer test", async function () {
      const balance = await sphere.balanceOf(sphereWhaleSigner.address)
      await sphere.connect(sphereWhaleSigner).transfer(owner2.address, parseUnits("10", 18))
      const balanceAfter = await sphere.balanceOf(sphereWhaleSigner.address)

      expect(balance).eq(balanceAfter.add(parseUnits("10", 18)))
      expect(await sphere.balanceOf(owner2.address)).eq(parseUnits("10", 18))
    })
  })

  it("should return total supply", async function () {
    let bal = await sphere.balanceOf(DEAD)
    bal = bal.add(await sphere.balanceOf(ZERO))
    bal = bal.add(await sphere.balanceOf(ONE))
    bal = bal.add(await sphere.balanceOf(await sphere.treasuryReceiver()))
    bal = bal.add(await sphere.balanceOf(TWO))
    bal = bal.add(await sphere.getCirculatingSupply())
    expect(await sphere.totalSupply()).eq(bal)
  })

  it("should return circulating supply", async function () {
    let bal = await sphere.totalSupply()
    bal = bal.sub(await sphere.balanceOf(DEAD))
    bal = bal.sub(await sphere.balanceOf(ZERO))
    bal = bal.sub(await sphere.balanceOf(ONE))
    bal = bal.sub(await sphere.balanceOf(await sphere.treasuryReceiver()))
    bal = bal.sub(await sphere.balanceOf(TWO))
    expect(await sphere.getCirculatingSupply()).eq(bal)
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
      await sphere.connect(sphereWhaleSigner).approve(owner2.address, parseUnits("1"))
      await sphere.connect(owner2).transferFrom(sphereWhaleSigner.address, owner3.address, parseUnits("1"))
      expect(await sphere.balanceOf(owner3.address)).eq(parseUnits("1"))
      expect(await sphere.allowance(owner.address, owner2.address)).eq(parseUnits("0"))
    })
  })
  it("should rescue token", async function () {
    // reset tokens in the contract
    await sphere.connect(sphereWhaleSigner).rescueToken(sphere.address)

    const sphereBal = await sphere.balanceOf(sphereWhaleSigner.address)
    await sphere.connect(sphereWhaleSigner).transfer(sphere.address, sphereBal.div(2))
    expect(await sphere.balanceOf(sphereWhaleSigner.address)).eq(sphereBal.div(2))
    await sphere.connect(sphereWhaleSigner).rescueToken(sphere.address)
    expect(await sphere.balanceOf(sphereWhaleSigner.address)).eq(sphereBal)
  })

  it("should clear stuck balance", async function () {
    owner2.sendTransaction({
      to: sphere.address,
      value: parseUnits("1"),
    })

    const initialBalance = await owner.getBalance()
    await sphere.connect(sphereWhaleSigner).clearStuckBalance(owner.address)
    expect((await owner.getBalance()).gt(initialBalance))
  })
})
