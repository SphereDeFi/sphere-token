import {ethers, web3} from "hardhat"
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers"
import {Logger} from "tslog"
import logSettings from "../../log_settings"
import {BigNumber, ContractFactory, utils} from "ethers"
import {Libraries} from "hardhat-deploy/dist/types"
import {CoreAddresses} from "./CoreAddresses"
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
import {Verify} from "../Verify";
import {parseUnits} from "ethers/lib/utils";
import {Misc} from "../misc";
import {RunHelper} from "../utils/RunHelper";

const log: Logger = new Logger(logSettings)

const libraries = new Map<string, string>([["MainStaking", "ERC20FactoryLib"]])
const libraries2 = new Map<string, string>([["MainStaking", "PoolHelperFactoryLib"]])

export class Deploy {

    // ************ CONTRACT CONNECTION **************************

    public static async deployContract<T extends ContractFactory>(
        signer: SignerWithAddress,
        name: string,
        // tslint:disable-next-line:no-any
        ...args: any[]
    ) {
        log.info(`Deploying ${name}`)
        log.info("Account balance: " + utils.formatUnits(await signer.getBalance(), 18))

        const gasPrice = await web3.eth.getGasPrice()
        log.info("Gas price: " + gasPrice)
        const lib: string | undefined = libraries.get(name)
        const lib2: string | undefined = libraries2.get(name)
        let _factory
        if (lib) {
            log.info("DEPLOY LIBRARY", lib, "for", name)
            const libAddress = (await Deploy.deployContract(signer, lib)).address
            const librariesObj: Libraries = {}
            librariesObj[lib] = libAddress

            if (lib2) {
                await Misc.wait(5);
                log.info("DEPLOY 2nd LIBRARY", lib2, "for", name)
                librariesObj[lib2] = (await Deploy.deployContract(signer, lib2)).address
            }

            _factory = (await ethers.getContractFactory(name, {
                signer,
                libraries: librariesObj,
            })) as T
        } else {
            _factory = (await ethers.getContractFactory(name, signer)) as T
        }
        const instance = await _factory.deploy(...args)
        log.info("Deploy tx:", instance.deployTransaction.hash)
        await instance.deployed()

        const receipt = await ethers.provider.getTransactionReceipt(instance.deployTransaction.hash)
        log.info("Receipt", receipt.contractAddress)
        return _factory.attach(receipt.contractAddress)
    }

    public static async deployProxy(signer: SignerWithAddress, logicAddress: string, ...args: any[]) {
        const proxy = await Deploy.deployContract(signer, 'ProxyControlled') as ProxyControlled;
        await RunHelper.runAndWait(() => proxy.initProxy(logicAddress));
        return proxy;
    }


    public static async deployMainStaking(signer: SignerWithAddress) {
        return (await Deploy.deployContract(signer, "MainStaking")) as MainStaking
    }

    public static async deployProxyAdmin(signer: SignerWithAddress) {
        const deployment = (await Deploy.deployContract(signer, "ProxyAdmin")) as ProxyAdmin

        await Verify.verify(deployment.address);

        return deployment;
    }

    public static async deployNTR(signer: SignerWithAddress, name: string, symbol: string, initialMint: BigNumber) {
        const deployment = (await Deploy.deployContract(signer,
            "NTR",
            name,
            symbol,
            initialMint,
            signer.address)) as NTR

        await Verify.verifyWithArgs(deployment.address, [name, symbol, initialMint]);

        return deployment;
    }

    public static async deployNtrMNT(signer: SignerWithAddress, mainContract: string, ntr: string) {
        const deployment = (await Deploy.deployContract(signer, "ntrMNT", mainContract, ntr)) as NtrMNT

        await Verify.verifyWithArgs(deployment.address, [mainContract, ntr]);

        return deployment;
    }

    public static async deployBaseRewardPool(signer: SignerWithAddress, stakingToken: string, rewardToken: string,
                                             operator: string, rewardManager: string) {

        const deployment = (await Deploy.deployContract(signer,
            "BaseRewardPool",
            stakingToken,
            rewardToken,
            operator,
            rewardManager)) as BaseRewardPool

        await Verify.verifyWithArgs(deployment.address, [stakingToken, rewardToken, operator, rewardManager]);

        return deployment;
    }

    public static async deployMasterChefNeutron(signer: SignerWithAddress) {
        const deployment = (await Deploy.deployContract(signer, "MasterChefNTR")) as MasterChefNTR

        await Verify.verify(deployment.address);

        return deployment;
    }

    public static async deployNeutronLocker(signer: SignerWithAddress, ntr: string, masterChef: string,
                                            lockTime: string, maxDeposits: number) {
        const deployment = (await Deploy.deployContract(signer,
            "Locker",
            ntr,
            masterChef,
            lockTime,
            maxDeposits)) as Locker
        await Verify.verifyWithArgs(deployment.address, [ntr, masterChef, lockTime, maxDeposits]);
        return deployment;
    }

    public static async deploySimplePoolHelper(signer: SignerWithAddress, masterNtr: string, depositToken: string) {
        const deployment = (await Deploy.deployContract(signer,
            "SimplePoolHelper",
            masterNtr,
            depositToken)) as SimplePoolHelper

        await Verify.verifyWithArgs(deployment.address, [masterNtr, depositToken]);

        return deployment;
    }

    public static async deployMasterChefNeutronSystem(signer: SignerWithAddress, proxyAdminAddress: string) {
        const masterChefNTR = await Deploy.deployMasterChefNeutron(signer)

        const proxy = await Deploy.deployProxy(signer, masterChefNTR.address) as ProxyControlled

        return [proxy, masterChefNTR]
    }


    public static async deployRewardPools(signer: SignerWithAddress, ntrLocker: string,
                                          ntrMNT: string, masterChefNtrProxy: string,
                                          mainStakingProxy: string,
                                          ntr: string) {

        const vtxBaseRewardPoolLockedNTR = await Deploy.deployBaseRewardPool(signer,
            ntrLocker,
            ntrMNT,
            masterChefNtrProxy,
            mainStakingProxy) as BaseRewardPool

        const simplePoolHelperNeutron = await Deploy.deploySimplePoolHelper(signer,
            masterChefNtrProxy,
            ntr) as SimplePoolHelper

        const vtxBaseRewardPoolNtrMNT = await Deploy.deployBaseRewardPool(signer,
            ntrMNT,
            ntrMNT,
            masterChefNtrProxy,
            mainStakingProxy) as BaseRewardPool

        const simplePoolHelperNtrMNT = await Deploy.deploySimplePoolHelper(signer,
            masterChefNtrProxy,
            ntrMNT) as SimplePoolHelper

        return [vtxBaseRewardPoolLockedNTR, simplePoolHelperNeutron, vtxBaseRewardPoolNtrMNT, simplePoolHelperNtrMNT]
    }

    public static async deployMainStakingSystem(signer: SignerWithAddress, proxyAdminAddress: string) {
        const mainStaking = await Deploy.deployMainStaking(signer)

        console.log('proxyAdminAddress', proxyAdminAddress);

        const proxy = await Deploy.deployProxy(signer, mainStaking.address) as ProxyControlled

        return [proxy, mainStaking]
    }

    public static async deployCore(
        signer: SignerWithAddress,
        mnt: string
    ) {
        const proxyAdmin = await Deploy.deployProxyAdmin(signer);

        const [mainStakingProxy, mainStaking] = await Deploy.deployMainStakingSystem(signer, proxyAdmin.address)

        const ntr = await Deploy.deployNTR(signer, "Neutron", "NTR", parseUnits("30000000"))

        const ntrMNT = await Deploy.deployNtrMNT(signer, mainStakingProxy.address, mnt)

        const [masterChefNtrProxy, masterChefNtr] = await Deploy.deployMasterChefNeutronSystem(signer,
            proxyAdmin.address)

        const ntrLocker = await Deploy.deployNeutronLocker(signer,
            ntr.address,
            masterChefNtrProxy.address,
            '9676800',
            6)

        const [vtxBaseRewardPoolLockedNTR, simplePoolHelperNeutron, vtxBaseRewardPoolNtrMNT, simplePoolHelperNtrMNT]
            = await Deploy.deployRewardPools(signer,
            ntrLocker.address,
            ntrMNT.address,
            masterChefNtrProxy.address,
            mainStakingProxy.address,
            ntr.address)


        return new CoreAddresses(
            mainStaking as MainStaking,
            mainStakingProxy as ProxyControlled,
            ntr as NTR,
            ntrMNT as NtrMNT,
            masterChefNtrProxy as ProxyControlled,
            masterChefNtr as MasterChefNTR,
            proxyAdmin as ProxyAdmin,
            ntrLocker as Locker,
            vtxBaseRewardPoolLockedNTR as BaseRewardPool,
            simplePoolHelperNeutron as SimplePoolHelper,
            vtxBaseRewardPoolNtrMNT as BaseRewardPool,
            simplePoolHelperNtrMNT as SimplePoolHelper,
        )
    }


    private static async deployERC20FactoryLib(signer: SignerWithAddress) {
        const deployment = (await Deploy.deployContract(signer,
            "ERC20FactoryLib")) as any
        await Verify.verify(deployment.address);
        return deployment;
    }


    private static async deployPoolHelperFactoryLib(signer: SignerWithAddress) {
        const deployment = (await Deploy.deployContract(signer,
            "PoolHelperFactoryLib")) as any
        await Verify.verify(deployment.address);
        return deployment;

    }
}
