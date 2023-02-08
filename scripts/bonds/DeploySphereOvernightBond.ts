import { ethers, web3 } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Logger } from 'tslog'
import logSettings from '../../log_settings'
import { BigNumber, ContractFactory, utils } from 'ethers'
import { Libraries } from 'hardhat-deploy/dist/types'
import { CoreAddresses } from './CoreAddresses'
import {
  SphereBondTreasurySwapper,
  SphereOvernightStrategy,
  BondDepo,
} from '../../typechain'
import { Verify } from '../Verify'
import { parseUnits } from 'ethers/lib/utils'
import { Misc } from '../misc'
import { RunHelper } from '../utils/RunHelper'
import { Deploy } from '../deploy'

const log: Logger = new Logger(logSettings)

const libraries = new Map<string, string>([['', '']])

const _rewardToken = '0x62F594339830b90AE4C084aE7D223fFAFd9658A7' //Sphere Token
const _principle = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
const _treasury = '0x7754d8b057CC1d2D857d897461DAC6C3235B4aAe'
const _bondCalculator = '0x0000000000000000000000000000000000000000'

// Bond Terms
const _controlVariable = '7'
const _vestingTerm = '1'
const _minimumPrice = '6000'
const _maxPayout = '5000000000000000000000'
const _maxDebt = '20000000000000000000000'
const _initialDebt = '5000'

export class DeploySphereOvernightBond {
  public static async deploySphereBondTreasurySwapper(
    signer: SignerWithAddress
  ) {
    const deployment = (await Deploy.deployContract(
      signer,
      'SphereBondTreasurySwapper'
    )) as SphereBondTreasurySwapper

    Misc.wait(5)

    await Verify.verify(deployment.address)

    return deployment
  }

  public static async deploySphereOvernightStrategy(signer: SignerWithAddress) {
    const deployment = (await Deploy.deployContract(
      signer,
      'SphereOvernightStrategy'
    )) as SphereOvernightStrategy

    Misc.wait(5)

    await Verify.verify(deployment.address)

    return deployment
  }

  public static async deploySphereBondDepo(
    signer: SignerWithAddress,

    _rewardToken: string,
    _principle: string,
    _treasury: string,
    _bondCalculator: string,
    sphereOvernightStrategyAddress: string
  ) {
    const deployment = (await Deploy.deployContract(
      signer,
      'BondDepo',
      _rewardToken,
      _principle,
      _treasury,
      _bondCalculator,
      sphereOvernightStrategyAddress
    )) as BondDepo

    Misc.wait(5)

    await Verify.verifyWithArgs(deployment.address, [
      _rewardToken,
      _principle,
      _treasury,
      _bondCalculator,
      sphereOvernightStrategyAddress,
    ])

    return deployment
  }

  public static async deploySphereOvernightBond(signer: SignerWithAddress) {
    const sphereBondTreasurySwapper =
      await DeploySphereOvernightBond.deploySphereBondTreasurySwapper(signer)
    const sphereOvernightStrategy =
      await DeploySphereOvernightBond.deploySphereOvernightStrategy(signer)
    const sphereBondDepo = await DeploySphereOvernightBond.deploySphereBondDepo(
      signer,
      _rewardToken,
      _principle,
      _treasury,
      _bondCalculator,
      sphereOvernightStrategy.address
    )

    return [sphereBondTreasurySwapper, sphereOvernightStrategy, sphereBondDepo]
  }

  public static async deployCore(signer: SignerWithAddress) {
    const [sphereBondTreasurySwapper, sphereOvernightStrategy, sphereBondDepo] =
      await DeploySphereOvernightBond.deploySphereOvernightBond(signer)

    return new CoreAddresses(
      sphereBondTreasurySwapper as SphereBondTreasurySwapper,
      sphereOvernightStrategy as SphereOvernightStrategy,
      sphereBondDepo as BondDepo
    )
  }
}
