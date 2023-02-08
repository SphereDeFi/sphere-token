import {ethers, web3} from "hardhat";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {ContractFactory, utils} from "ethers";
import {Misc} from "./Misc";
import logSettings from "../../log_settings";
import {Logger} from "tslog";
import {Libraries} from "hardhat-deploy/dist/types";
import {ControllerV2, ControllerV2__factory, ProxyControlled} from "../../typechain";
import {VerifyUtils} from "./VerifyUtils";
import {RunHelper} from "./RunHelper";

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat");
const log: Logger = new Logger(logSettings);


const libraries = new Map<string, string>([
    ["", ""]
]);

export class DeployerUtils {

    // ************ CONTRACT DEPLOY **************************

    public static async deployContract<T extends ContractFactory>(
        signer: SignerWithAddress,
        name: string,
        // tslint:disable-next-line:no-any
        ...args: any[]
    ) {
        log.info(`Deploying ${name}`);
        log.info("Account balance: " + utils.formatUnits(await signer.getBalance(), 18));

        const gasPrice = await web3.eth.getGasPrice();
        log.info("Gas price: " + gasPrice);
        const lib: string | undefined = libraries.get(name);
        let _factory;
        if (lib) {
            log.info('DEPLOY LIBRARY', lib, 'for', name);
            const libAddress = (await DeployerUtils.deployContract(signer, lib)).address;
            const librariesObj: Libraries = {};
            librariesObj[lib] = libAddress;
            _factory = (await ethers.getContractFactory(
                name,
                {
                    signer,
                    libraries: librariesObj
                }
            )) as T;
        } else {
            _factory = (await ethers.getContractFactory(
                name,
                signer
            )) as T;
        }
        let gas = 19_000_000;
        if (hre.network.name === 'hardhat') {
            gas = 999_999_999;
        } else if (hre.network.name === 'mumbai') {
            gas = 5_000_000;
        }
        // const instance = await _factory.deploy(...args, {gasLimit: gas, gasPrice: +gasPrice * 5});
        const instance = await _factory.deploy(...args, {gasPrice: +gasPrice * 5});
        log.info('Deploy tx:', instance.deployTransaction.hash);
        await instance.deployed();

        const receipt = await ethers.provider.getTransactionReceipt(instance.deployTransaction.hash);
        console.log('DEPLOYED: ', name, receipt.contractAddress);

        if (hre.network.name !== 'hardhat') {
            await Misc.wait(10);
            if (args.length === 0) {
                await VerifyUtils.verify(receipt.contractAddress);
            } else {
                await VerifyUtils.verifyWithArgs(receipt.contractAddress, args);
                if (name === 'ProxyControlled') {
                    await VerifyUtils.verifyProxy(receipt.contractAddress);
                }
            }
        }
        return _factory.attach(receipt.contractAddress);
    }

    public static async deployProxy(signer: SignerWithAddress, contract: string) {
        const logic = await DeployerUtils.deployContract(signer, contract);
        const proxy = await DeployerUtils.deployContract(signer, 'ProxyControlled') as ProxyControlled;
        await RunHelper.runAndWait(() => proxy.initProxy(logic.address));
        return proxy.address;
    }

    public static async deployController(signer: SignerWithAddress) {
        const logic = await DeployerUtils.deployContract(signer, 'ControllerV2') as ControllerV2;
        const proxy = await DeployerUtils.deployContract(signer, 'ProxyControlled') as ProxyControlled;
        await RunHelper.runAndWait(() => proxy.initProxy(logic.address));
        const controller = ControllerV2__factory.connect(proxy.address, signer);
        await RunHelper.runAndWait(() => controller.init(signer.address));
        return controller;
    }
}
