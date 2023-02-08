// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IVaultProxy {
  function updateImplementationAddress(address _implementationAddress) external;
}