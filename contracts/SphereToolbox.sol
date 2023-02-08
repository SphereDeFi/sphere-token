// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

interface ITetuSwapPair {
    function claimAll() external;
}

contract SphereToolbox is OwnableUpgradeable {
    // This declares a state variable that would store the contract address
    IERC20 public sphereInstance;
    IERC20 public buybackTokenInstance;

    IUniswapV2Router02 public router;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    address public treasuryAddress;
    address public rewardTokenAddress;
    address public pairAddress;

    address public sphereAddress;
    address public buybackTokenAddress;
    address public routerAddress;

    string public constant VERSION = "0.0.1";

    function init() public initializer {
        __Ownable_init();
    }

    function setRouter(address _routerAddress) external onlyOwner {
        require(_routerAddress != address(0x0), "Router address can not be zero");
        routerAddress = _routerAddress;
        router = IUniswapV2Router02(routerAddress);
    }

    function setSphere(address _sphereAddress) external onlyOwner {
        require(_sphereAddress != address(0x0), "Sphere address can not be zero");
        sphereAddress = _sphereAddress;
        sphereInstance = IERC20(sphereAddress);
    }

    function setBuybackToken(address _buybackTokenAddress) external onlyOwner {
        require(_buybackTokenAddress != address(0x0), "Buyback token address can not be zero");
        buybackTokenAddress = _buybackTokenAddress;
        buybackTokenInstance = IERC20(buybackTokenAddress);
    }

    function claimVaultRewards() external onlyOwner {
        ITetuSwapPair tetuPair = ITetuSwapPair(pairAddress);
        tetuPair.claimAll();

        IERC20 rewardToken = IERC20(rewardTokenAddress);
        uint256 rewardAmount = rewardToken.balanceOf(address(this));
        rewardToken.transfer(treasuryAddress, rewardAmount);

        emit ClaimVaultRewards(rewardAmount);
    }

    function setTreasury(address _treasuryAddress) external onlyOwner {
        require(_treasuryAddress != address(0x0), "treasury can not be 0x0");
        treasuryAddress = _treasuryAddress;
    }

    function setRewardToken(address _rewardTokenAddress) external onlyOwner {
        require(_rewardTokenAddress != address(0x0), "reward token can not be 0x0");
        rewardTokenAddress = _rewardTokenAddress;
    }

    function setPairAddress(address _pairAddress) external onlyOwner {
        require(_pairAddress != address(0x0), "pair address can not be 0x0");
        pairAddress = _pairAddress;
    }

    function buyBackAndBurn()
    external
    onlyOwner
    {
        require(buybackTokenAddress != address(0x0), "Buyback token not set");
        require(sphereAddress != address(0x0), "Sphere not set");
        require(routerAddress != address(0x0), "Router not set");

        address[] memory path = new address[](2);
        path[0] = buybackTokenAddress;
        path[1] = sphereAddress;

        uint256 amountToSwap = buybackTokenInstance.balanceOf(address(this));

        uint256 beforeBalance = sphereInstance.balanceOf(DEAD);

        buybackTokenInstance.approve(routerAddress, type(uint256).max);

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountToSwap,
            0,
            path,
            DEAD,
            block.timestamp
        );

        uint256 burntBalance = sphereInstance.balanceOf(DEAD) - beforeBalance;

        emit BuyBackAndBurn(amountToSwap, burntBalance);
    }

    function burnToken()
    external
    onlyOwner
    returns (bool success)
    {
        uint256 burnTokenAmount = sphereInstance.balanceOf(address(this));
        success = sphereInstance.transfer(DEAD, burnTokenAmount);

        emit BurnToken(burnTokenAmount);
    }

    function withdraw(address _tokenAddress)
    external
    onlyOwner
    returns (bool success)
    {
        IERC20 token = IERC20(_tokenAddress);
        uint256 amount = token.balanceOf(address(this));
        success = token.transfer(msg.sender, amount);

        emit Withdraw(_tokenAddress, amount);
    }

    /*
        Events definitions
    */
    event ClaimVaultRewards(uint256);
    event BurnToken(uint256);
    event BuyBackAndBurn(uint256, uint256);
    event Withdraw(address, uint256);
}
