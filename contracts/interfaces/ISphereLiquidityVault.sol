// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

interface ISphereLiquidityVault {
  function createVault() external returns (uint256);
  function destroyVault(uint256 vaultId) external;
  function addLiquidity(uint256 vaultId, uint256 sphereAmount, uint256 collateralAmount) external;
  function removeLiquidity(uint256 vaultId, uint256 lpAmount) external;
  function liquidityBalanceOf(uint256 vaultId) external view returns (uint256);

  event CreateVault(uint256 vaultId, address creator);
  event DestroyVault(uint256 vaultId);
  event AddLiquidity(uint256 vaultId, uint256 lpAmount);
  event RemoveLiquidity(uint256 vaultId, uint256 lpAmount);
}