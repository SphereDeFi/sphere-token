require("dotenv").config()
import "@hardhat-docgen/core"
import "@hardhat-docgen/markdown"
import "hardhat-docgen"
import "hardhat-contract-sizer"

import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-web3"

import "@openzeppelin/hardhat-upgrades"
import "@nomiclabs/hardhat-etherscan"
import "@nomiclabs/hardhat-waffle"
import "hardhat-gas-reporter"
import "solidity-coverage"

module.exports = {
  networks: {
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      gasPrice: 1000000000000,
    },
    hardhat: {
      chainId: 31337,
      forking: {
        // Using Alchemy
        url: process.env.MAINNET_RPC_URL, // url to RPC node, ${ALCHEMY_KEY} - must be your API key
        // Using Infura
        // url: `https://mainnet.infura.io/v3/${INFURA_KEY}`, // ${INFURA_KEY} - must be your API key
        // blockNumber: 23031989, // a specific block number with which you want to work
      },
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.7.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.5.5",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "typechain",
  },
  abiExporter: {
    path: "./artifacts/abi",
    runOnCompile: false,
    spacing: 2,
    pretty: false,
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    gasPrice: 21,
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  docgen: {
    path: "./docs",
    clear: true,
    runOnCompile: false,
    except: ["contracts/third_party", "contracts/test"],
  },
}
