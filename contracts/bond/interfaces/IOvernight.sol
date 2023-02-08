// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IOvernight {
    function buy(address _addrTok, uint256 _amount) external returns (uint256);
}
