// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

contract SphereReader {


  address immutable public sphere;
  address immutable public sphereSettings;

  constructor(address _sphere, address _sphereSettings) {
    sphere = _sphere;
    sphereSettings = _sphereSettings;
  }

//  //get the address in the iteration
//  function markerPairAddress(uint256 value) external view returns (address) {
//    return makerPairs[value];
//  }
//
//  //get the current index of rebase
//  function currentIndex() external view returns (uint256) {
//    return index / gonsPerFragment;
//  }
//
//  //checks if a user is exempt from protocol fees
//  function checkFeeExempt(address _addr) external view returns (bool) {
//    return isTotalFeeExempt[_addr];
//  }
//
//  function gonsForBalance(uint256 amount) external view returns (uint256) {
//    return amount * gonsPerFragment;
//  }
//
//  function balanceForGons(uint256 gons) external view returns (uint256) {
//    return gons / gonsPerFragment;
//  }
//
//  //checks what the threshold is for swapping
//  function checkSwapThreshold() external view returns (uint256) {
//    return gonSwapThreshold / (gonsPerFragment);
//  }
//
//  function getRewardYield() external view returns (uint256, uint256) {
//    return (rewardYield, rewardYieldDenominator);
//  }

}
