import { ethers, web3 } from "hardhat"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { Logger } from "tslog"
import { ContractFactory, utils } from "ethers"
import { Libraries } from "hardhat-deploy/dist/types"

import logSettings from "../log_settings"

// tslint:disable-next-line:no-var-requires
const hre = require("hardhat")
const log: Logger = new Logger(logSettings)

const libraries = new Map<string, string>([["", ""]])

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
    let _factory
    if (lib) {
      log.info("DEPLOY LIBRARY", lib, "for", name)
      const libAddress = (await Deploy.deployContract(signer, lib)).address
      const librariesObj: Libraries = {}
      librariesObj[lib] = libAddress
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

  public static async getContractFactory<T extends ContractFactory>(
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
    let _factory
    if (lib) {
      log.info("DEPLOY LIBRARY", lib, "for", name)
      const libAddress = (await Deploy.deployContract(signer, lib)).address
      const librariesObj: Libraries = {}
      librariesObj[lib] = libAddress

      _factory = (await ethers.getContractFactory(name, {
        signer,
        libraries: librariesObj,
      })) as T
    } else {
      _factory = (await ethers.getContractFactory(name, signer)) as T
    }
    let gas = 19_000_000
    if (hre.network.name === "hardhat") {
      gas = 999_999_999
    } else if (hre.network.name === "mumbai") {
      gas = 5_000_000
    }
    return _factory
  }
}
