// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

interface IDystRouter {
  function quoteAddLiquidity(
    address tokenA, address tokenB, bool stable,
    uint amountADesired, uint amountBDesired
  ) external view returns (uint amountA, uint amountB, uint liquidity);

  function quoteRemoveLiquidity(
    address tokenA, address tokenB, bool stable, uint liquidity
  ) external view returns (uint amountA, uint amountB);

  function addLiquidity(
    address tokenA, address tokenB, bool stable,
    uint amountADesired, uint amountBDesired,
    uint amountAMin, uint amountBMin,
    address to, uint deadline
  ) external returns (uint amountA, uint amountB, uint liquidity);
  
  function removeLiquidity(
    address tokenA, address tokenB, bool stable,
    uint liquidity,
    uint amountAMin, uint amountBMin,
    address to, uint deadline
  ) external returns (uint amountA, uint amountB);

  function pairFor(address tokenA, address tokenB, bool stable) external view returns (address pair);
}