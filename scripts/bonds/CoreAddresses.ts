import {
  BondDepo,
  SphereBondTreasurySwapper,
  SphereOvernightStrategy,
} from '../../typechain'

export class CoreAddresses {
  readonly sphereBondTreasurySwapper: SphereBondTreasurySwapper
  readonly sphereOvernightStrategy: SphereOvernightStrategy
  readonly sphereBondDepo: BondDepo

  constructor(
    sphereBondTreasurySwapper: SphereBondTreasurySwapper,
    sphereOvernightStrategy: SphereOvernightStrategy,
    sphereBondDepo: BondDepo
  ) {
    this.sphereBondTreasurySwapper = sphereBondTreasurySwapper
    this.sphereOvernightStrategy = sphereOvernightStrategy
    this.sphereBondDepo = sphereBondDepo
  }
}
