// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IPenroseProxy.sol";

contract Vault is IVault {
  address public lpToken;
  address public manager;
  address public owner;
  address public penroseProxy;

  address public dyst; // 0x39aB6574c289c3Ae4d88500eEc792AB5B947A5Eb;
  address public pen; // 0x9008D70A5282a936552593f410AbcBcE2F891A97;
  address public constant PENDYST = 0x5b0522391d0A5a37FD117fE4C43e8876FB4e91E6;

  string public constant VERSION = "0.0.1";

  modifier onlyOwner {
    require(msg.sender == owner, "Not allowed there");
    _;
  }

  modifier onlyManager {
    require(msg.sender == manager, "Not allowed there");
    _;
  }

  modifier onlyOwnerOrManager {
    require(msg.sender == owner || msg.sender == manager, "Not allowed here");
    _;
  }

  function initialize(
    address _lp,
    address _user,
    address _penroseProxy,
    address _pen,
    address _dyst
  ) public override {

    require(lpToken == address(0), "Already initialized");

    require(_lp != address(0), "LP address to zero");
    lpToken = _lp;
    IERC20(lpToken).approve(msg.sender, type(uint256).max);

    require(_user != address(0), "User to zero");
    manager = _user;

    require(_penroseProxy != address(0), "Penrose proxy set to zero");
    penroseProxy = _penroseProxy;

    IERC20(lpToken).approve(penroseProxy, type(uint256).max);

    require(_pen != address(0), "Pen token address to zero");
    pen = _pen;
    IERC20(pen).approve(penroseProxy, type(uint256).max);

    require(_dyst != address(0), "Dyst token address to zero");
    dyst = _dyst;
    IERC20(dyst).approve(penroseProxy, type(uint256).max);
    

    owner = msg.sender;
  }

  function depositLP(uint256 _lpAmount) external override onlyOwnerOrManager {
    require(IERC20(lpToken).balanceOf(msg.sender) >= _lpAmount, "Not enough LP");
    require(IERC20(lpToken).allowance(msg.sender, address(this)) >= _lpAmount, "Insufficient allowance");
    IERC20(lpToken).transferFrom(msg.sender, address(this), _lpAmount);

    IPenroseProxy(penroseProxy).depositLpAndStake(lpToken, _lpAmount);
  }

  function withdrawLP(uint256 _lpAmount) external override onlyOwnerOrManager {
    IPenroseProxy(penroseProxy).unstakeLpAndWithdraw(lpToken, _lpAmount);

    IERC20(lpToken).transfer(msg.sender, _lpAmount);
  }

  function claimRewards() external override onlyOwnerOrManager {
    IPenroseProxy(penroseProxy).claimStakingRewards();
    IPenroseProxy(penroseProxy).convertDystToPenDystAndStake();
    IERC20(pen).transfer(msg.sender, IERC20(pen).balanceOf(address(this)));
  }

  function unstakeAndClaim() external override onlyOwnerOrManager {
    IPenroseProxy(penroseProxy).unstakePenDyst();
    IERC20(PENDYST).transfer(msg.sender, IERC20(PENDYST).balanceOf(msg.sender));
  }

  function withdraw(address _token) external override onlyOwner {
    IERC20(_token).transfer(msg.sender, IERC20(_token).balanceOf(msg.sender));
  }
}