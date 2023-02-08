import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {TimeUtils} from "./time_utils";
import {Deploy} from "../scripts/deploy";

import {SphereToken, SphereSettings, SphereTreasurySwapper, SphereToolbox} from "../typechain";

import {parseUnits} from "ethers/lib/utils";

const {expect} = chai;

const FEE_DENOMINATOR = 1000;

describe("Spheretoolbox tests", function () {
  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let lp: SignerWithAddress;
  let sphere: SphereToken;
  let sphereSettings: SphereSettings;
  let sphereTreasurySwapper: SphereTreasurySwapper;
  let sphereToolbox: SphereToolbox;

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2, owner3, lp] = await ethers.getSigners();
    sphere = await Deploy.deployContract(owner, 'SphereToken') as SphereToken;
    sphereSettings = await Deploy.deployContract(owner, 'SphereSettings') as SphereSettings;
    sphereTreasurySwapper = await Deploy.deployContract(owner, 'SphereTreasurySwapper') as SphereTreasurySwapper;

    sphereToolbox = await Deploy.deployContract(owner, 'SphereToolbox') as SphereToolbox;

    await sphere.init();
    await sphere.setSphereSettings(sphereSettings.address);

    // await sphereSettings.init(sphere.address);

    await sphereTreasurySwapper.init();

    await sphere.setInitialDistributionFinished(true);

    await sphereToolbox.init();
  });

  after(async function () {
    await TimeUtils.rollback(snapshotBefore);
  });


  beforeEach(async function () {
    snapshot = await TimeUtils.snapshot();
  });

  afterEach(async function () {
    await TimeUtils.rollback(snapshot);
  });

  it('should set router', async function() {
    await sphereToolbox.setRouter(owner2.address);
    expect(await sphereToolbox.routerAddress()).eq(owner2.address);
  })

  it('should set sphere address', async function() {
    await sphereToolbox.setSphere(sphere.address);
    expect(await sphereToolbox.sphereAddress()).eq(sphere.address);
  })

  it('should set buyback token', async function() {
    await sphereToolbox.setBuybackToken(owner2.address);
    expect(await sphereToolbox.buybackTokenAddress()).eq(owner2.address);
  })

  it('should set treasury address', async function() {
    await sphereToolbox.setTreasury(owner2.address);
    expect(await sphereToolbox.treasuryAddress()).eq(owner2.address);
  })

  it('should set reward token', async function() {
    await sphereToolbox.setRewardToken(owner2.address);
    expect(await sphereToolbox.rewardTokenAddress()).eq(owner2.address);
  })

  it('should set pair address', async function() {
    await sphereToolbox.setPairAddress(owner2.address);
    expect(await sphereToolbox.pairAddress()).eq(owner2.address);
  })

  it('should burn token', async function() {
    await sphereToolbox.setSphere(sphere.address);
    await sphere.transfer(sphereToolbox.address, parseUnits('10000'));
    await sphere.setFeeTypeExempt(sphereToolbox.address, true, 1);
    expect(await sphere.balanceOf(sphereToolbox.address)).eq(parseUnits('10000'));
    await sphereToolbox.burnToken();
    expect(await sphere.balanceOf('0x000000000000000000000000000000000000dEaD')).eq(parseUnits('10000'))
  })

  it('should withdraw token', async function() {
    let initialBalance = await sphere.balanceOf(owner.address);
    await sphere.transfer(sphereToolbox.address, parseUnits('10000'));
    await sphere.setFeeTypeExempt(sphereToolbox.address, true, 1);
    expect(await sphere.balanceOf(owner.address)).eq(initialBalance.sub(parseUnits('10000')));
    expect(await sphere.balanceOf(sphereToolbox.address)).eq(parseUnits('10000'))

    await sphereToolbox.withdraw(sphere.address);
    expect(await sphere.balanceOf(owner.address)).eq(initialBalance);
  })

  // it('should withdraw native token', async function() {
  //   owner.sendTransaction({
  //     to: sphereToolbox.address,
  //     value: parseUnits('1')
  //   })
  //   let balance = await owner.getBalance()
  //   await sphereToolbox.with
  // })
})