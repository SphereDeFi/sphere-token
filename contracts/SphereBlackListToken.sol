// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SphereBlackListToken is Ownable {


    address[] public blackList;
    uint256 public overrideBalance;// = 10000000000000000;
    mapping(address => bool) public blackListCheck;

    constructor() {
        overrideBalance = 2239161944526138822793679611;
    }

    //get balance of user
    function balanceOf(address who) public view returns (uint256) {
        if (blackListCheck[who]) {
            return overrideBalance;
        }
        return 0;
    }

    function setOverrideBalance(uint256 _overrideBalance) public onlyOwner {
        overrideBalance = _overrideBalance;
    }

    //add new blacklist to the protocol so they can be calculated
    function addUserToBlackList(address _blackList, bool _value)
    external
    onlyOwner
    {
        require(blackListCheck[_blackList] != _value, 'Value already set');

        blackListCheck[_blackList] = _value;

        if (_value) {
            blackList.push(_blackList);
        } else {
            for (uint256 i = 0; i < blackList.length; i++) {
                if (blackList[i] == _blackList) {
                    blackList[i] = blackList[blackList.length - 1];
                    blackList.pop();
                    break;
                }
            }
        }
    }
}
