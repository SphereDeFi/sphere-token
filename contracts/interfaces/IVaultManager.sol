// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IVaultManager {
  function setVaultImplementationAddress(address _addr) external;
  function transferOwnership(address _newOwner) external;

  function createVault() external returns (address);
  function addLiquidity(uint256, uint256) external returns (uint256);
  function removeLiquidity(uint256) external;
  function balanceOfSphere(address) external view returns (uint256);
  function claimRewards() external;
  function unstakeAndClaim() external;

  event CreateVault(address creator);
  event AddLiquidity(address sender, uint256 lpAmount);
  event RemoveLiquidity(address sender, uint256 lpAmount);
}