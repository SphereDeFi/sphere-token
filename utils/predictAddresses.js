const { web3 } = require("hardhat")
const rlp = require("rlp")
const keccak = require("keccak")

const predictAddresses = async (creator) => {
  creator = creator || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

  let currentNonce = await web3.eth.getTransactionCount(creator)
  let currentNonceHex = `0x${currentNonce.toString(16)}`
  let currentInputArr = [creator, currentNonceHex]
  let currentRlpEncoded = rlp.encode(currentInputArr)
  let str = Buffer.from(currentRlpEncoded.buffer).toString() // line added
  let currentContractAddressLong = keccak("keccak256").update(str).digest("hex")
  let currentContractAddress = `0x${currentContractAddressLong.substring(24)}`
  let currentContractAddressChecksum = web3.utils.toChecksumAddress(currentContractAddress)

  let nextNonce = currentNonce + 1
  let nextNonceHex = `0x${nextNonce.toString(16)}`
  let nextInputArr = [creator, nextNonceHex]
  let nextRlpEncoded = rlp.encode(nextInputArr)
  let str2 = Buffer.from(nextRlpEncoded.buffer).toString() // line added
  let nextContractAddressLong = keccak("keccak256").update(str2).digest("hex")
  let nextContractAddress = `0x${nextContractAddressLong.substring(24)}`
  let nextContractAddressChecksum = web3.utils.toChecksumAddress(nextContractAddress)

  return {
    vault: currentContractAddressChecksum,
    strategy: nextContractAddressChecksum,
  }
}

module.exports = predictAddresses
