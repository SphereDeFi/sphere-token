// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PenroseProxy {
  mapping(address => uint256) public depositorInfos;

  function depositLpAndStake(address _addr, uint256 _amount) public {
    require(_addr != address(0), "Pool to zero address");
    depositorInfos[msg.sender] += _amount;
    IERC20(_addr).transferFrom(msg.sender, address(this), _amount);
  }

  function unstakeLpAndWithdraw(address _addr, uint256 _amount) public {
    require(_addr != address(0), "Pool to zero address");
    require(depositorInfos[msg.sender] >= _amount, "Balance lower than amount");
    depositorInfos[msg.sender] -= _amount;
    IERC20(_addr).transfer(msg.sender, _amount);
  }

  function unstakeLpWithdrawAndClaim(address _addr, uint256 _amount) public {
    unstakeLpAndWithdraw(_addr, _amount);
  }
}