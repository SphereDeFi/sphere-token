import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {TimeUtils} from "./time_utils";
import {Deploy} from "../scripts/deploy";

import {SphereToken, SphereSettings, SphereTreasurySwapper} from "../typechain";

import {parseUnits} from "ethers/lib/utils";

const {expect} = chai;

const FEE_DENOMINATOR = 1000;

describe("Sphere treasury swapper tests", function () {
  let snapshotBefore: string;
  let snapshot: string;

  let owner: SignerWithAddress;
  let owner2: SignerWithAddress;
  let owner3: SignerWithAddress;
  let lp: SignerWithAddress;
  let sphere: SphereToken;
  let sphereSettings: SphereSettings;
  let sphereTreasurySwapper: SphereTreasurySwapper;

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2, owner3, lp] = await ethers.getSigners();
    sphere = await Deploy.deployContract(owner, 'SphereToken') as SphereToken;
    sphereSettings = await Deploy.deployContract(owner, 'SphereSettings') as SphereSettings;
    sphereTreasurySwapper = await Deploy.deployContract(owner, 'SphereTreasurySwapper') as SphereTreasurySwapper;

    await sphere.init();
    await sphere.setSphereSettings(sphereSettings.address);

    // await sphereSettings.init(sphere.address);

    await sphereTreasurySwapper.init();

    await sphere.setInitialDistributionFinished(true);
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

  it('should set sphere address', async function() {
    expect(await sphereTreasurySwapper.sphereAddress()).eq('0x0000000000000000000000000000000000000000');
    await sphereTreasurySwapper.setSphereAddress(sphere.address);
    expect(await sphereTreasurySwapper.sphereAddress()).eq(sphere.address);
  })

  it('should set swapback token address', async function() {
    expect(await sphereTreasurySwapper.swapbackTokenAddress()).eq('0x0000000000000000000000000000000000000000');
    await sphereTreasurySwapper.setSwapbackTokenAddress(sphere.address);
    expect(await sphereTreasurySwapper.swapbackTokenAddress()).eq(sphere.address);
  })

  it('should set max swapback amount', async function() {
    await sphereTreasurySwapper.setMaxSwapbackAmount(parseUnits('100'));
    expect(await sphereTreasurySwapper.maxSwapbackAmount()).eq(parseUnits('100'));
  })

  it('should set max max swapback amount', async function() {
    await sphereTreasurySwapper.setMaxSwapbackAmount(0);
    expect(await sphereTreasurySwapper.maxSwapbackAmount()).gt(1000);
  })

  describe('fees', function() {
    it('should set fee receivers', async function() {
      await sphereTreasurySwapper.setFeeReceivers('0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003', '0x0000000000000000000000000000000000000004');
      expect(await sphereTreasurySwapper.liquidityReceiver()).eq('0x0000000000000000000000000000000000000001');
      expect(await sphereTreasurySwapper.treasuryReceiver()).eq('0x0000000000000000000000000000000000000002');
      expect(await sphereTreasurySwapper.riskFreeValueReceiver()).eq('0x0000000000000000000000000000000000000003');
      expect(await sphereTreasurySwapper.galaxyBondReceiver()).eq('0x0000000000000000000000000000000000000004');
    })

    it('should set fees', async function() {
      await sphereTreasurySwapper.setFees(200, 200, 200, 200, 200);
      expect(await sphereTreasurySwapper.burnFees()).eq(200);
      expect(await sphereTreasurySwapper.liquidityFees()).eq(200);
      expect(await sphereTreasurySwapper.treasuryFees()).eq(200);
      expect(await sphereTreasurySwapper.rfvFees()).eq(200);
      expect(await sphereTreasurySwapper.galaxyBondFees()).eq(200);
    })

    it('should not accept total fees less than 1000', async function() {
      try {
        await sphereTreasurySwapper.setFees(200, 200, 200, 200, 100);
      } catch(err) {
        return expect(err)
      }

      expect(false)
    })

    it('should not accept total fees more than 1000', async function() {
      try {
        await sphereTreasurySwapper.setFees(200, 200, 200, 200, 300);
      } catch(err) {
        return expect(err)
      }

      expect(false)
    })
  })

  it('should add given address to swapbacker list', async function() {
    await sphereTreasurySwapper.addSwapBacker(sphere.address);
    expect(await sphereTreasurySwapper.swapBacker(sphere.address))
  })

  it('should remove a given address from swapback list', async function () {
    await sphereTreasurySwapper.addSwapBacker(sphere.address);
    expect(await sphereTreasurySwapper.swapBacker(sphere.address))
    await sphereTreasurySwapper.removeSwapBacker(sphere.address);
    expect(await sphereTreasurySwapper.swapBacker(sphere.address)).eq(false);
  })

  it('should withdraw a token', async function() {
    let initialBalance = await sphere.balanceOf(owner.address);

    await sphere.transfer(sphereTreasurySwapper.address, parseUnits('100'));
    expect(await sphere.balanceOf(sphereTreasurySwapper.address)).eq(parseUnits('100'));

    await sphereTreasurySwapper.withdrawToken(sphere.address);
    expect(await sphere.balanceOf(sphere.address)).eq(0);

    expect(await sphere.balanceOf(owner.address)).eq(initialBalance);
  })

  it('should set router and approve', async function () {
    await sphereTreasurySwapper.setSphereAddress(sphere.address);
    await sphereTreasurySwapper.setSwapbackTokenAddress(sphere.address);
    await sphereTreasurySwapper.setRouter('0x0000000000000000000000000000000000000001')
    expect(await sphere.allowance(sphereTreasurySwapper.address, await sphereTreasurySwapper.routerAddress())).gt(0)
  })

  it('should withdraw native token', async function() {

    await owner2.sendTransaction({
      to: sphereTreasurySwapper.address,
      value: parseUnits('1')
    })

    let initialBalance = await owner.getBalance();
    await sphereTreasurySwapper.withdrawNativeToken();
    expect((await owner.getBalance()).gt(initialBalance));
  })

  describe('swapback', async function() {
    it('should not allow a non swapbacker to execute the function', async function() {
      try {
        await sphereTreasurySwapper.connect(owner2).swapBack()
      } catch(err) {
        expect(err)
      }
    })

    it('should fail if liquidityReceiver is not set', async function() {
      await sphereTreasurySwapper.addSwapBacker(owner.address);
      try {
        await sphereTreasurySwapper.swapBack();
      } catch(err) {
        expect(err)
      }
    })

    it('should fail if treasuryReceiver is not set', async function() {
      await sphereTreasurySwapper.addSwapBacker(owner.address);
      await sphereTreasurySwapper.setFeeReceivers('0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
      try {
        await sphereTreasurySwapper.swapBack();
      } catch(err) {
        expect(err)
      }
    })

    it('should fail if riskFreeValueReceiver is not set', async function() {
      await sphereTreasurySwapper.addSwapBacker(owner.address);
      await sphereTreasurySwapper.setFeeReceivers('0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000');
      try {
        await sphereTreasurySwapper.swapBack();
      } catch(err) {
        expect(err)
      }
    })

    it('should fail if galaxyBondReceiver is not set', async function() {
      await sphereTreasurySwapper.addSwapBacker(owner.address);
      await sphereTreasurySwapper.setFeeReceivers('0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003', '0x0000000000000000000000000000000000000000');
      try {
        await sphereTreasurySwapper.swapBack();
      } catch(err) {
        expect(err)
      }
    })
  })
})
