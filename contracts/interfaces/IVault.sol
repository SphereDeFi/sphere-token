// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IVault {
  function initialize(address _lp, address _user, address _penroseProxy, address _pen, address _dyst) external;
  function depositLP(uint256 _lpAmount) external;
  function withdrawLP(uint256 _lpAmount) external;
  function claimRewards() external;
  function unstakeAndClaim() external;
  function withdraw(address _token) external;
}