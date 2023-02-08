import {
    BaseRewardPool,
    Locker,
    MainStaking,
    MasterChefNTR,
    NTR,
    NtrMNT,
    ProxyAdmin,
    ProxyControlled,
    SimplePoolHelper
} from "../../typechain"

export class CoreAddresses {
    readonly mainStaking: MainStaking
    readonly mainStakingProxy: ProxyControlled
    readonly ntr: NTR
    readonly ntrMNT: NtrMNT
    readonly masterChefNtrProxy: ProxyControlled
    readonly masterChefNtr: MasterChefNTR
    readonly proxyAdmin: ProxyAdmin
    readonly ntrLocker: Locker
    readonly vtxBaseRewardPoolLockedNTR: BaseRewardPool
    readonly simplePoolHelperNeutron: SimplePoolHelper
    readonly vtxBaseRewardPoolNtrMNT: BaseRewardPool
    readonly simplePoolHelperNtrMNT: SimplePoolHelper

    constructor(
        mainStaking: MainStaking,
        mainStakingProxy: ProxyControlled,
        ntr: NTR,
        ntrMNT: NtrMNT,
        masterChefNtrProxy: ProxyControlled,
        masterChefNtr: MasterChefNTR,
        proxyAdmin: ProxyAdmin,
        ntrLocker: Locker,
        vtxBaseRewardPoolLockedNTR: BaseRewardPool,
        simplePoolHelperNeutron: SimplePoolHelper,
        vtxBaseRewardPoolNtrMNT: BaseRewardPool,
        simplePoolHelperNtrMNT: SimplePoolHelper
    ) {
        this.mainStaking = mainStaking
        this.mainStakingProxy = mainStakingProxy
        this.ntr = ntr
        this.ntrMNT = ntrMNT
        this.masterChefNtrProxy = masterChefNtrProxy
        this.masterChefNtr = masterChefNtr
        this.proxyAdmin = proxyAdmin
        this.ntrLocker = ntrLocker
        this.vtxBaseRewardPoolLockedNTR = vtxBaseRewardPoolLockedNTR
        this.simplePoolHelperNeutron = simplePoolHelperNeutron
        this.vtxBaseRewardPoolNtrMNT = vtxBaseRewardPoolNtrMNT
        this.simplePoolHelperNtrMNT = simplePoolHelperNtrMNT
    }
}