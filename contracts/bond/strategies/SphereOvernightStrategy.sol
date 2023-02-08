// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/IOvernight.sol';

interface ISphereBondStrategy {
  function swapBack() external;
}

contract SphereOvernightStrategy is OwnableUpgradeable, ISphereBondStrategy {
  using SafeERC20 for IERC20;
  address public routerAddress;

  address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
  address public immutable USDPLUS_TOKEN = 0x236eeC6359fb44CCe8f97E99387aa7F8cd5cdE1f;

  address public principleAsset;

  address public strategyAddress;

  address public fundsReceiver;

  //funds that are used for other operations
  address public miscellaneousReceiver;
  uint256 public feeSplit;

  mapping(address => bool) public swapBacker;

  function init() public initializer {
    __Ownable_init();
  }

  receive() external payable {}

  function setConfig(
    address _fundsReceiver,
    address _principleAsset,
    address _strategyAddress,
    address _miscellaneousReceiver,
    uint256 _feeSplit
  ) external onlyOwner {
    fundsReceiver = _fundsReceiver;
    principleAsset = _principleAsset;
    strategyAddress = _strategyAddress;
    miscellaneousReceiver = _miscellaneousReceiver;
    feeSplit = _feeSplit;
  }

  function addSwapBacker(address _swapBacker) external onlyOwner {
    require(_swapBacker != address(0x0), 'swap backer can not be 0x0');
    require(swapBacker[_swapBacker] != true, 'swap backer already set');

    swapBacker[_swapBacker] = true;

    emit AddSwapBacker(_swapBacker);
  }

  function removeSwapBacker(address _swapBacker) external onlyOwner {
    require(_swapBacker != address(0x0), 'swap backer can not be 0x0');
    require(swapBacker[_swapBacker], 'swap backer is not set');

    swapBacker[_swapBacker] = false;

    emit RemoveSwapBacker(_swapBacker);
  }

  modifier onlySwapBacker() {
    require(swapBacker[msg.sender], 'not allowed to swap back');
    _;
  }

  function swapBack() external override onlySwapBacker {
    require(fundsReceiver != address(0x0), 'uninitialized fund receiver');

    uint256 balance = IERC20(principleAsset).balanceOf(address(this));
    uint256 feeLiquidity;

    //Approve USDC balance
    IERC20(principleAsset).safeApprove(strategyAddress, balance);

    //Buying USD+ with USDC
    IOvernight(strategyAddress).buy(principleAsset, balance);

    uint256 bal = IERC20(USDPLUS_TOKEN).balanceOf(address(this));

    if (miscellaneousReceiver != address(0)) {
      //update fee liquidity
      feeLiquidity = (bal * feeSplit) / 100;
      //add fees
      bal = bal - feeLiquidity;
      //transfer asset to miscellaneousReceiver (buys & burns, liquidity)
      IERC20(USDPLUS_TOKEN).safeTransfer(miscellaneousReceiver, feeLiquidity);
      //execute function
      ISphereBondStrategy(miscellaneousReceiver).swapBack();
    }

    if (bal > 0) {
      // transfer asset to funds receiver (treasury)
      IERC20(USDPLUS_TOKEN).safeTransfer(fundsReceiver, bal);
    }

    emit SwapBack(balance, bal, feeLiquidity);
  }

  function withdrawToken(address tokenAddress) external onlyOwner {
    IERC20 token = IERC20(tokenAddress);
    require(token.balanceOf(address(this)) > 0, 'nothing to withdraw');

    token.transfer(msg.sender, token.balanceOf(address(this)));
  }

  function withdrawNativeToken() external onlyOwner {
    require(address(this).balance > 0, 'nothing to withdraw');

    uint256 balance = address(this).balance;
    (bool success, bytes memory data) = address(msg.sender).call{value: balance}('');
  }

  event AddSwapBacker(address swapBacker);
  event RemoveSwapBacker(address swapBacker);
  event SwapBack(uint256 amount, uint256 newBalance, uint256 feeLiquidity);
}
