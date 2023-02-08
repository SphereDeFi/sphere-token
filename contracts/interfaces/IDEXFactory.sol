// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;


interface IDEXFactory {
  function getPair(address tokenA, address tokenB)
  external
  view
  returns (address pair);

  function allPairs(uint256) external view returns (address pair);

  function allPairsLength() external view returns (uint256);

  function createPair(address tokenA, address tokenB)
  external
  returns (address pair);

  function validPairs(address _pair) external view returns (bool);
}
