import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ethers} from "hardhat";
import chai from "chai";
import {TimeUtils} from "./time_utils";
import {Deploy} from "../scripts/deploy";

import {SphereToken, SphereSettings, SphereTreasurySwapper, SphereToolbox, SphereReader} from "../typechain";

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
  let sphereReader: SphereReader;

  before(async function () {
    snapshotBefore = await TimeUtils.snapshot();
    [owner, owner2, owner3, lp] = await ethers.getSigners();
    sphere = await Deploy.deployContract(owner, 'SphereToken') as SphereToken;
    sphereSettings = await Deploy.deployContract(owner, 'SphereSettings') as SphereSettings;
    sphereTreasurySwapper = await Deploy.deployContract(owner, 'SphereTreasurySwapper') as SphereTreasurySwapper;

    sphereToolbox = await Deploy.deployContract(owner, 'SphereToolbox') as SphereToolbox;

    sphereReader = await Deploy.deployContract(owner, 'SphereReader', [sphere.address, sphereSettings.address]) as SphereReader;

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
})